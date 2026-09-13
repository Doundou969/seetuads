import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

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

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campagne introuvable." },
        { status: 404 }
      );
    }

    if (campaign.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        {
          error: `Cette campagne n'est pas en attente de validation (statut actuel : ${campaign.status}).`,
        },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "SCHEDULED" : "CANCELLED";

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        status: newStatus,
        rejectionReason: action === "reject" ? reason || null : null,
      },
    });

    console.log("Campagne revue :", {
      campaignId: id,
      action,
      newStatus,
      reason: reason || null,
    });

    return NextResponse.json({
      success: true,
      campaign: updated,
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