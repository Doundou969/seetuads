import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { reserve } from "@/lib/inventory";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await req.json();

    const action = typeof body.action === "string" ? body.action : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Action invalide. Utilisez approve ou reject." },
        { status: 400 }
      );
    }

    /*
     * REJET
     *
     * Le rejet ne réserve aucun inventaire.
     */
    if (action === "reject") {
      const updated = await prisma.campaign.updateMany({
        where: {
          id,
          status: "PENDING_REVIEW",
        },
        data: {
          status: "CANCELLED",
          rejectionReason: reason || null,
        },
      });

      if (updated.count === 0) {
        const campaign = await prisma.campaign.findUnique({
          where: { id },
          select: {
            id: true,
            status: true,
          },
        });

        if (!campaign) {
          return NextResponse.json(
            {
              error: "Campagne introuvable.",
            },
            { status: 404 }
          );
        }

        return NextResponse.json(
          {
            error: `Cette campagne n'est pas en attente de validation (statut actuel : ${campaign.status}).`,
          },
          { status: 400 }
        );
      }

      const campaign = await prisma.campaign.findUnique({
        where: { id },
      });

      console.log("Campagne rejetée :", {
        campaignId: id,
        action,
        newStatus: "CANCELLED",
        reason: reason || null,
      });

      return NextResponse.json({
        success: true,
        campaign,
      });
    }

    /*
     * APPROBATION
     *
     * L'allocation et le passage à SCHEDULED
     * doivent être atomiques.
     */
    const result = await prisma.$transaction(
      async (tx) => {
        const campaign = await tx.campaign.findUnique({
          where: { id },
          include: {
            campaignScreens: {
              where: {
                status: "ACTIVE",
              },
              select: {
                screenId: true,
              },
            },
            campaignMedia: {
              include: {
                media: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  },
                },
              },
            },
          },
        });

        if (!campaign) {
          throw new Error("Campagne introuvable.");
        }

        if (campaign.status !== "PENDING_REVIEW") {
          throw new Error(
            `Cette campagne n'est pas en attente de validation (statut actuel : ${campaign.status}).`
          );
        }

        if (campaign.campaignScreens.length === 0) {
          throw new Error(
            "La campagne doit contenir au moins un écran actif."
          );
        }

        if (campaign.campaignMedia.length === 0) {
          throw new Error(
            "La campagne doit contenir au moins un média."
          );
        }

        const rejectedMedia = campaign.campaignMedia.find(
          (campaignMedia) =>
            campaignMedia.media.status === "REJECTED"
        );

        if (rejectedMedia) {
          throw new Error(
            `Le média "${rejectedMedia.media.name}" a été rejeté et doit être remplacé avant la validation de la campagne.`
          );
        }

        const unapprovedMedia = campaign.campaignMedia.find(
          (campaignMedia) =>
            campaignMedia.media.status !== "APPROVED"
        );

        if (unapprovedMedia) {
          throw new Error(
            `Le média "${unapprovedMedia.media.name}" n'est pas approuvé.`
          );
        }

        if (
          !Number.isInteger(campaign.spotDuration) ||
          campaign.spotDuration <= 0
        ) {
          throw new Error("La durée du spot est invalide.");
        }

        if (
          !Number.isInteger(campaign.frequencyPerLoop) ||
          campaign.frequencyPerLoop <= 0
        ) {
          throw new Error(
            "La fréquence par boucle est invalide."
          );
        }

        /*
         * Unité commerciale d'allocation :
         *
         * durée du spot × nombre d'occurrences
         * par boucle.
         */
        const reservedSeconds =
          campaign.spotDuration *
          campaign.frequencyPerLoop;

        if (
          !Number.isInteger(reservedSeconds) ||
          reservedSeconds <= 0
        ) {
          throw new Error(
            "Le temps réservé par boucle est invalide."
          );
        }

        /*
         * IMPORTANT :
         * reserve() verrouille les écrans dans un ordre
         * déterministe, vérifie la capacité puis crée
         * toutes les réservations.
         *
         * Si un seul écran manque de capacité,
         * aucune réservation n'est conservée.
         */
        const screenIds = campaign.campaignScreens
          .map(
            (campaignScreen) =>
              campaignScreen.screenId
          )
          .sort();

        const reservations = await reserve(
          {
            campaignId: campaign.id,
            screenIds,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            reservedSeconds,
            temporary: false,
          },
          tx
        );

        /*
         * La campagne ne devient SCHEDULED
         * qu'apr?s la cr?ation réussie de toutes
         * les réservations CONFIRMED.
         */
        const updatedResult =
          await tx.campaign.updateMany({
            where: {
              id: campaign.id,
              status: "PENDING_REVIEW",
            },
            data: {
              status: "SCHEDULED",
              rejectionReason: null,
            },
          });

        if (updatedResult.count !== 1) {
          throw new Error(
            "La campagne a changé d'état pendant sa validation. Aucune réservation n'a été conservée."
          );
        }

        const updated = await tx.campaign.findUnique({
          where: {
            id: campaign.id,
          },
        });

        if (!updated) {
          throw new Error(
            "Campagne introuvable après validation."
          );
        }

        return {
          campaign: updated,
          reservations,
          reservedSeconds,
        };
      }
    );

    console.log(
      "Campagne approuvée et inventaire réservé :",
      {
        campaignId: id,
        action,
        newStatus: "SCHEDULED",
        reservationCount: result.reservations.length,
        reservedSeconds: result.reservedSeconds,
      }
    );

    return NextResponse.json({
      success: true,
      campaign: result.campaign,
      reservations: result.reservations,
      reservedSeconds: result.reservedSeconds,
    });
  } catch (error) {
    console.error("CAMPAIGN REVIEW ERROR:", error);

    const status =
      error instanceof Error && "statusCode" in error
        ? (error as { statusCode: number }).statusCode
        : 500;

    const message =
      error instanceof Error ? error.message : "Erreur serveur.";

    return NextResponse.json(
      { error: message },
      { status: typeof status === "number" ? status : 500 }
    );
  }
}