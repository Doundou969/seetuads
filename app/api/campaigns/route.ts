import { NextResponse } from "next/server";
import { requireAdvertiser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function parseIdList(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`La sélection des ${label} est invalide.`);
  }

  const ids = value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0
  );

  if (ids.length !== value.length) {
    throw new Error(`La sélection des ${label} est invalide.`);
  }

  return [...new Set(ids.map((id) => id.trim()))];
}

export async function GET() {
  try {
    const { advertiser } = await requireAdvertiser();

    const campaigns = await prisma.campaign.findMany({
      where: {
        advertiserId: advertiser.id,
      },
      include: {
        campaignScreens: {
          include: {
            screen: {
              select: {
                name: true,
                screenCode: true,
              },
            },
          },
        },
        campaignMedia: {
          include: {
            media: {
              select: {
                name: true,
                fileType: true,
                mimeType: true,
                fileUrl: true,
                durationSeconds: true,
                status: true,
              },
            },
          },
        },
        payments: {
          select: {
            status: true,
            amount: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("CAMPAIGNS GET ERROR:", error);

    const details =
      error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: "Impossible de récupérer les campagnes.",
        details,
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { advertiser } = await requireAdvertiser();

    const body = await req.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const objective =
      typeof body.objective === "string"
        ? body.objective.trim()
        : "";

    const startDateValue =
      typeof body.startDate === "string"
        ? body.startDate.trim()
        : "";

    const endDateValue =
      typeof body.endDate === "string"
        ? body.endDate.trim()
        : "";

    const spotDuration = Number(body.spotDuration ?? 15);
    const frequencyPerLoop = Number(body.frequencyPerLoop ?? 1);

    if (!name) {
      return NextResponse.json(
        {
          error: "Le nom de la campagne est requis.",
        },
        { status: 400 }
      );
    }

    if (
      !DATE_REGEX.test(startDateValue) ||
      !DATE_REGEX.test(endDateValue)
    ) {
      return NextResponse.json(
        {
          error: "Les dates de la campagne sont invalides.",
        },
        { status: 400 }
      );
    }

    const parsedStartDate = new Date(`${startDateValue}T00:00:00`);
    const parsedEndDate = new Date(`${endDateValue}T00:00:00`);

    if (
      Number.isNaN(parsedStartDate.getTime()) ||
      Number.isNaN(parsedEndDate.getTime())
    ) {
      return NextResponse.json(
        {
          error: "Les dates de la campagne sont invalides.",
        },
        { status: 400 }
      );
    }

    if (parsedEndDate < parsedStartDate) {
      return NextResponse.json(
        {
          error:
            "La date de fin doit être postérieure ou égale à la date de début.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(spotDuration) ||
      spotDuration < 5 ||
      spotDuration > 60
    ) {
      return NextResponse.json(
        {
          error:
            "La durée du spot doit être comprise entre 5 et 60 secondes.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(frequencyPerLoop) ||
      frequencyPerLoop < 1 ||
      frequencyPerLoop > 10
    ) {
      return NextResponse.json(
        {
          error:
            "La fréquence par boucle doit être comprise entre 1 et 10.",
        },
        { status: 400 }
      );
    }

    let screenIds: string[];
    let mediaIds: string[];

    try {
      screenIds = parseIdList(body.screenIds, "écrans");
      mediaIds = parseIdList(body.mediaIds, "médias");
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "La sélection est invalide.",
        },
        { status: 400 }
      );
    }

    if (screenIds.length === 0) {
      return NextResponse.json(
        {
          error: "La campagne doit contenir au moins un écran.",
        },
        { status: 400 }
      );
    }

    if (mediaIds.length === 0) {
      return NextResponse.json(
        {
          error: "La campagne doit contenir au moins un média.",
        },
        { status: 400 }
      );
    }

    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const numberOfDays = Math.max(
      1,
      Math.ceil(
        (parsedEndDate.getTime() - parsedStartDate.getTime()) /
          MS_PER_DAY
      )
    );

    const result = await prisma.$transaction(async (tx) => {
      const advertiserRecord = await tx.advertiser.findFirst({
        where: {
          id: advertiser.id,
          status: "ACTIVE",
        },
        select: {
          id: true,
        },
      });

      if (!advertiserRecord) {
        throw new Error(
          "Votre compte annonceur doit être actif pour créer une campagne."
        );
      }

      const approvedMedia = await tx.media.findMany({
        where: {
          id: {
            in: mediaIds,
          },
          advertiserId: advertiser.id,
          status: "APPROVED",
        },
        select: {
          id: true,
        },
      });

      if (approvedMedia.length !== mediaIds.length) {
        throw new Error(
          "Un ou plusieurs médias sélectionnés sont introuvables, n'appartiennent pas à votre compte ou ne sont pas approuvés."
        );
      }

      const validScreens = await tx.screen.findMany({
        where: {
          id: {
            in: screenIds,
          },
        },
        select: {
          id: true,
          zoneId: true,
        },
      });

      if (validScreens.length !== screenIds.length) {
        throw new Error(
          "Un ou plusieurs écrans sélectionnés sont introuvables."
        );
      }

      const zoneIds = [
        ...new Set(
          validScreens
            .map((screen) => screen.zoneId)
            .filter(
              (zoneId): zoneId is string =>
                Boolean(zoneId)
            )
        ),
      ];

      const pricingRules = await tx.pricingRule.findMany({
        where: {
          active: true,
          OR:
            zoneIds.length > 0
              ? [
                  {
                    screenId: {
                      in: screenIds,
                    },
                  },
                  {
                    zoneId: {
                      in: zoneIds,
                    },
                  },
                ]
              : [
                  {
                    screenId: {
                      in: screenIds,
                    },
                  },
                ],
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          screenId: true,
          zoneId: true,
          basePrice: true,
          durationMultiplier: true,
          frequencyMultiplier: true,
          zoneMultiplier: true,
        },
      });

      let totalPrice = 0;

      for (const screen of validScreens) {
        const screenRule = pricingRules.find(
          (rule) => rule.screenId === screen.id
        );

        const zoneRule = screen.zoneId
          ? pricingRules.find(
              (rule) => rule.zoneId === screen.zoneId
            )
          : undefined;

        const rule = screenRule ?? zoneRule;

        if (!rule) {
          throw new Error(
            "Aucune règle de tarification active n'est définie pour un écran sélectionné."
          );
        }

        const screenPrice =
          Number(rule.basePrice) *
          Number(rule.durationMultiplier) *
          Number(rule.frequencyMultiplier) *
          Number(rule.zoneMultiplier) *
          numberOfDays;

        totalPrice += screenPrice;
      }

      const estimatedPrice =
        Math.round(totalPrice * 100) / 100;

      const campaign = await tx.campaign.create({
        data: {
          advertiserId: advertiser.id,
          name,
          objective: objective || null,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          spotDuration,
          frequencyPerLoop,
          estimatedPrice,
          status: "DRAFT",
        },
      });

      await tx.campaignScreen.createMany({
        data: screenIds.map((screenId) => ({
          campaignId: campaign.id,
          screenId,
          reservedSeconds: spotDuration,
          status: "ACTIVE",
        })),
      });

      await tx.campaignMedia.createMany({
        data: mediaIds.map((mediaId, index) => ({
          campaignId: campaign.id,
          mediaId,
          displayOrder: index + 1,
          durationSeconds: spotDuration,
        })),
      });

      return campaign;
    });

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error) {
    console.error("CAMPAIGN POST ERROR:", error);

    const details =
      error instanceof Error
        ? error.message
        : String(error);

    const isValidationError =
      details.includes("Votre compte annonceur") ||
      details.includes("Un ou plusieurs médias") ||
      details.includes("Un ou plusieurs écrans") ||
      details.includes("Aucune règle de tarification");

    return NextResponse.json(
      {
        error: isValidationError
          ? details
          : "Impossible de créer la campagne.",
        ...(isValidationError ? {} : { details }),
      },
      {
        status: isValidationError ? 400 : 500,
      }
    );
  }
}
