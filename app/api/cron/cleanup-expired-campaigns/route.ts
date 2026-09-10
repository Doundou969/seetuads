import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      console.warn("Tentative non autorisée sur le Cron.");

      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const now = new Date();

    const expiredLinks = await prisma.campaignScreen.findMany({
      where: {
        status: "ACTIVE",
        campaign: {
          endDate: {
            lt: now,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (expiredLinks.length === 0) {
      console.log("Cron cleanup : aucune association expirée.");

      return NextResponse.json({
        success: true,
        cleaned: 0,
        timestamp: now.toISOString(),
      });
    }

    const result = await prisma.campaignScreen.updateMany({
      where: {
        id: {
          in: expiredLinks.map((link) => link.id),
        },
        status: "ACTIVE",
      },
      data: {
        status: "INACTIVE",
      },
    });

    console.log("Cron cleanup terminé :", {
      found: expiredLinks.length,
      cleaned: result.count,
      timestamp: now.toISOString(),
    });

    return NextResponse.json({
      success: true,
      found: expiredLinks.length,
      cleaned: result.count,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("CRON CLEANUP ERROR:", error);

    return NextResponse.json(
      {
        error: "Erreur serveur pendant le nettoyage",
      },
      {
        status: 500,
      }
    );
  }
}
