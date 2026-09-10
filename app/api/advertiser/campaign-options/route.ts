import { NextResponse } from "next/server";
import { requireAdvertiser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { advertiser } = await requireAdvertiser();

    const [screens, pricingRules, media] = await Promise.all([
      prisma.screen.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          location: true,
          zone: true,
        },
      }),

      prisma.pricingRule.findMany({
        where: { active: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          zoneId: true,
          screenId: true,
          basePrice: true,
          durationMultiplier: true,
          frequencyMultiplier: true,
          zoneMultiplier: true,
        },
      }),

      prisma.media.findMany({
        where: {
          advertiserId: advertiser.id,
          status: "APPROVED",
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          fileType: true,
          mimeType: true,
          durationSeconds: true,
        },
      }),
    ]);

    return NextResponse.json({
      screens: screens.map((screen) => ({
        id: screen.id,
        screenCode: screen.screenCode,
        name: screen.name,
        status: screen.status,
        location: screen.location
          ? { name: screen.location.name }
          : null,
        zone: screen.zone
          ? {
              id: screen.zone.id,
              name: screen.zone.name,
            }
          : null,
      })),
      pricingRules: pricingRules.map((rule) => ({
        id: rule.id,
        zoneId: rule.zoneId,
        screenId: rule.screenId,
        basePrice: Number(rule.basePrice),
        durationMultiplier: Number(rule.durationMultiplier),
        frequencyMultiplier: Number(rule.frequencyMultiplier),
        zoneMultiplier: Number(rule.zoneMultiplier),
      })),
      media: media.map((item) => ({
        id: item.id,
        name: item.name,
        fileType: item.fileType,
        mimeType: item.mimeType,
        durationSeconds: item.durationSeconds,
      })),
    });
  } catch (error) {
    console.error("CAMPAIGN OPTIONS GET ERROR:", error);

    return NextResponse.json(
      {
        error: "Impossible de récupérer les options de campagne.",
      },
      { status: 403 }
    );
  }
}