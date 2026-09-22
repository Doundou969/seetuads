import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { regenerate } from "@/lib/playlist-generator";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authorization = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET manquant.");

      return NextResponse.json(
        { error: "Configuration cron invalide" },
        { status: 500 }
      );
    }

    if (authorization !== `Bearer ${cronSecret}`) {
      console.warn("Tentative non autorisÃ©e sur le Cron.");

      return NextResponse.json(
        { error: "Non autorisÃ©" },
        { status: 401 }
      );
    }

    /*
     * Campaign.startDate et Campaign.endDate sont @db.Date.
     *
     * On travaille avec la journÃ©e UTC afin de rester cohÃ©rent
     * avec playlist-generator.ts et inventory.ts.
     */
    const now = new Date();
    const today = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      )
    );

    /*
     * Les campagnes SCHEDULED dont la date de dÃ©but est atteinte
     * peuvent passer ACTIVE.
     *
     * startDate <= today permet de rattraper une activation
     * si un passage du cron a Ã©tÃ© manquÃ©.
     */
    const scheduledCampaigns = await prisma.campaign.findMany({
      where: {
        status: "SCHEDULED",
        startDate: {
          lte: today,
        },
      },
      select: {
        id: true,
        startDate: true,
        campaignScreens: {
          where: {
            status: "ACTIVE",
          },
          select: {
            screenId: true,
          },
        },
      },
    });

    /*
     * Les campagnes ACTIVE dont la date de fin est dÃ©passÃ©e
     * doivent devenir COMPLETED.
     *
     * endDate <= today signifie que la campagne est expiree.
     * La date de fin est exclusive.
     */
    const expiredCampaigns = await prisma.campaign.findMany({
      where: {
        status: "ACTIVE",
        endDate: {
          lte: today,
        },
      },
      select: {
        id: true,
        endDate: true,
        campaignScreens: {
          where: {
            status: "ACTIVE",
          },
          select: {
            screenId: true,
          },
        },
      },
    });

    const candidateCampaigns = [
      ...scheduledCampaigns,
      ...expiredCampaigns,
    ];

    if (candidateCampaigns.length === 0) {
      console.log(
        "Cron lifecycle : aucune campagne Ã  activer ou Ã  clÃ´turer."
      );

      return NextResponse.json({
        success: true,
        scheduledFound: 0,
        activated: 0,
        expiredFound: 0,
        completed: 0,
        skipped: 0,
        regeneratedScreens: 0,
        timestamp: now.toISOString(),
      });
    }

    /*
     * Rassembler tous les Ã©crans concernÃ©s avant d'acquÃ©rir
     * les verrous.
     *
     * L'ordre triÃ© et global rÃ©duit les risques de deadlock
     * lorsque plusieurs campagnes partagent des Ã©crans.
     */
    const allScreenIds = [
      ...new Set(
        candidateCampaigns.flatMap((campaign) =>
          campaign.campaignScreens.map(
            (campaignScreen) => campaignScreen.screenId
          )
        )
      ),
    ].sort();

    let activated = 0;
    let completed = 0;
    let skipped = 0;
    const regeneratedScreenIds = new Set<string>();

    await prisma.$transaction(async (tx) => {
      /*
       * Verrouiller tous les Ã©crans concernÃ©s avant de relire
       * les campagnes et de modifier leur lifecycle.
       */
      for (const screenId of allScreenIds) {
        await tx.$executeRaw`
          SELECT pg_advisory_xact_lock(
            hashtextextended(${screenId}, 0)
          )
        `;
      }

      /*
       * Relecture aprÃ¨s acquisition des verrous.
       *
       * Le findMany initial sert Ã  identifier les candidats.
       * L'Ã©tat relu dans la transaction est la source de vÃ©ritÃ©.
       */
      const currentCampaigns = await tx.campaign.findMany({
        where: {
          id: {
            in: candidateCampaigns.map(
              (campaign) => campaign.id
            ),
          },
        },
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          campaignScreens: {
            where: {
              status: "ACTIVE",
            },
            select: {
              screenId: true,
            },
          },
        },
      });

      /*
       * Effectuer toutes les transitions avant de rÃ©gÃ©nÃ©rer
       * les playlists.
       */
      for (const campaign of currentCampaigns) {
        if (
          campaign.status === "SCHEDULED" &&
          campaign.endDate <= today
        ) {
          /*
           * La campagne n'a jamais Ã©tÃ© activÃ©e avant sa date
           * de fin. Elle est clÃ´turÃ©e directement.
           */
          await tx.campaign.update({
            where: {
              id: campaign.id,
            },
            data: {
              status: "COMPLETED",
            },
          });

          completed++;
          continue;
        }

        if (
          campaign.status === "SCHEDULED" &&
          campaign.startDate <= today
        ) {
          /*
           * Les rÃ©servations CONFIRMED ont dÃ©jÃ  Ã©tÃ© crÃ©Ã©es
           * lors de l'approbation.
           *
           * Aucune nouvelle rÃ©servation n'est crÃ©Ã©e ici.
           */
          await tx.campaign.update({
            where: {
              id: campaign.id,
            },
            data: {
              status: "ACTIVE",
            },
          });

          activated++;
          continue;
        }
        if (
          campaign.status === "ACTIVE" &&
          campaign.endDate <= today
        ) {
          /*
           * La campagne est ACTIVE jusqu'a sa date de fin.
           */
          await tx.campaign.update({
            where: {
              id: campaign.id,
            },
            data: {
              status: "COMPLETED",
            },
          });

          completed++;
          continue;
        }

        /*
         * La campagne a changÃ© d'Ã©tat entre les deux lectures
         * ou ne satisfait plus les conditions de transition.
         */
        skipped++;
      }

      /*
       * RÃ©gÃ©nÃ©rer une seule fois chaque Ã©cran concernÃ©.
       *
       * regenerate() relit les rÃ©servations CONFIRMED et les
       * campagnes dÃ©sormais ACTIVE pour construire la playlist.
       */
      for (const screenId of allScreenIds) {
        await regenerate(screenId, tx);
        regeneratedScreenIds.add(screenId);
      }
    });

    console.log("Cron lifecycle terminÃ© :", {
      scheduledFound: scheduledCampaigns.length,
      activated,
      expiredFound: expiredCampaigns.length,
      completed,
      skipped,
      regeneratedScreens: regeneratedScreenIds.size,
      timestamp: now.toISOString(),
    });

    return NextResponse.json({
      success: true,
      scheduledFound: scheduledCampaigns.length,
      activated,
      expiredFound: expiredCampaigns.length,
      completed,
      skipped,
      regeneratedScreens: regeneratedScreenIds.size,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("CRON LIFECYCLE ERROR:", error);

    return NextResponse.json(
      {
        error: "Erreur serveur pendant le traitement du lifecycle",
      },
      {
        status: 500,
      }
    );
  }
}


