// lib/services/media-order.service.ts
// Ã‰tape 1 V2 : crÃ©ation MediaOrder + Item + ItemScreen + Campaign(DRAFT)
// Prix toujours recalculÃ© serveur, formule identique au V1.

import { Prisma, type PricingRule, type Screen } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface CreateMediaOrderInput {
  name: string;
  objective: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  spotDuration: number;     // 5..60
  frequencyPerLoop: number; // 1..10
  screenIds: string[];
  mediaIds: string[];
  onBehalfOfAdvertiserId?: string; // TODO admin : brancher sur le helper admin de @/lib/permissions
}

export interface RequesterContext {
  advertiserId: string | null;
  isAdmin: boolean;
}

const MS_PER_DAY = 86_400_000;

function numberOfDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY);
}

async function buildOrderNumber(tx: Prisma.TransactionClient) {
  // TODO(production) : contrainte d'unicitÃ© + stratÃ©gie anti-collision
  const count = await tx.mediaOrder.count();
  return `CMD-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
}

// Formule strictement identique au V1 (app/api/campaigns/route.ts)
function computeScreenPrice(rule: PricingRule, days: number): number {
  return (
    Number(rule.basePrice) *
    Number(rule.durationMultiplier) *
    Number(rule.frequencyMultiplier) *
    Number(rule.zoneMultiplier) *
    days
  );
}

export async function createMediaOrder(
  input: CreateMediaOrderInput,
  requester: RequesterContext
) {
  if (!input.name?.trim()) throw new HttpError(400, "Le nom de la campagne est requis.");
  if (!input.startDate || !input.endDate)
    throw new HttpError(400, "Les dates de la campagne sont invalides.");

  const days = numberOfDays(input.startDate, input.endDate);
  if (days <= 0)
    throw new HttpError(400, "La date de fin doit Ãªtre strictement postÃ©rieure Ã  la date de dÃ©but.");
  if (
    !Number.isInteger(input.spotDuration) ||
    input.spotDuration < 5 ||
    input.spotDuration > 60
  )
    throw new HttpError(400, "La durÃ©e du spot doit Ãªtre comprise entre 5 et 60 secondes.");
  if (
    !Number.isInteger(input.frequencyPerLoop) ||
    input.frequencyPerLoop < 1 ||
    input.frequencyPerLoop > 10
  )
    throw new HttpError(400, "La frÃ©quence par boucle doit Ãªtre comprise entre 1 et 10.");
  if (!Array.isArray(input.screenIds) || input.screenIds.length === 0)
    throw new HttpError(400, "La campagne doit contenir au moins un Ã©cran.");
  if (!Array.isArray(input.mediaIds) || input.mediaIds.length === 0)
    throw new HttpError(400, "La campagne doit contenir au moins un mÃ©dia.");

  const advertiserId =
    requester.advertiserId ??
    (requester.isAdmin ? input.onBehalfOfAdvertiserId ?? null : null);
  if (!advertiserId) throw new HttpError(401, "Annonceur non identifiÃ©.");

  const startAt = new Date(`${input.startDate}T00:00:00`);
  const endAt = new Date(`${input.endDate}T00:00:00`);

  return prisma.$transaction(async (tx) => {
    // --- contrÃ´les repris du V1 ---
    const advertiserRecord = await tx.advertiser.findFirst({
      where: { id: advertiserId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!advertiserRecord)
      throw new HttpError(400, "Votre compte annonceur doit Ãªtre actif pour crÃ©er une commande.");

    const screens = await tx.screen.findMany({
      where: { id: { in: input.screenIds } },
      include: { zone: true },
    });
    if (screens.length !== input.screenIds.length)
      throw new HttpError(400, "Un ou plusieurs Ã©crans sÃ©lectionnÃ©s sont introuvables.");

    const approvedMedia = await tx.media.findMany({
      where: { id: { in: input.mediaIds }, advertiserId, status: "APPROVED" },
      select: { id: true },
    });
    if (approvedMedia.length !== input.mediaIds.length)
      throw new HttpError(400, "Un ou plusieurs mÃ©dias sont introuvables, ne vous appartiennent pas ou ne sont pas approuvÃ©s.");

    const conflicting = await tx.campaignScreen.findMany({
      where: {
        screenId: { in: input.screenIds },
        status: "ACTIVE",
        campaign: {
          status: { in: ["PENDING_REVIEW", "AWAITING_PAYMENT", "SCHEDULED", "ACTIVE"] },
          startDate: { lt: endAt },
          endDate: { gt: startAt },
        },
      },
      select: { screenId: true },
    });
    if (conflicting.length > 0)
      throw new HttpError(400, "Un ou plusieurs Ã©crans sÃ©lectionnÃ©s sont dÃ©jÃ  rÃ©servÃ©s sur cette pÃ©riode.");

    // --- tarification (snapshot figÃ©) ---
    const zoneIds = [
      ...new Set(
        screens.map((s: Screen & { zoneId: string | null }) => s.zoneId).filter(Boolean)
      ),
    ] as string[];

    const rules = await tx.pricingRule.findMany({
      where: {
        active: true,
        OR:
          zoneIds.length > 0
            ? [{ screenId: { in: input.screenIds } }, { zoneId: { in: zoneIds } }]
            : [{ screenId: { in: input.screenIds } }],
      },
      orderBy: { createdAt: "desc" },
    });

    const lines = screens.map((screen) => {
      const rule =
        rules.find((r) => r.screenId === screen.id) ??
        (screen.zoneId
          ? rules.find((r) => r.zoneId === screen.zoneId)
          : undefined) ??
        null;
      if (!rule)
        throw new HttpError(400, "Aucune rÃ¨gle de tarification active n'est dÃ©finie pour un Ã©cran sÃ©lectionnÃ©.");
      const subtotal = computeScreenPrice(rule, days);
      return { screen, rule, unitPrice: subtotal, subtotal };
    });

    const subtotal = lines.reduce((sum, l) => sum + l.subtotal, 0);

    // --- Ã©critures ---
    const order = await tx.mediaOrder.create({
      data: {
        orderNumber: await buildOrderNumber(tx),
        advertiserId,
        status: "PENDING_PAYMENT",
        subtotal,
        totalAmount: subtotal,
      },
    });

    const campaign = await tx.campaign.create({
      data: {
        advertiserId,
        name: input.name.trim(),
        objective: input.objective?.trim() || null,
        startDate: startAt,
        endDate: endAt,
        spotDuration: input.spotDuration,
        frequencyPerLoop: input.frequencyPerLoop,
        estimatedPrice: subtotal,
        status: "DRAFT", // diffusion attend le paiement
      },
    });

    const item = await tx.mediaOrderItem.create({
      data: {
        orderId: order.id,
        campaignId: campaign.id,
        name: input.name.trim(),
        startDate: startAt,
        endDate: endAt,
        spotDuration: input.spotDuration,
        frequencyPerLoop: input.frequencyPerLoop,
        subtotal,
        pricingSnapshot: {
          days,
          spotDuration: input.spotDuration,
          frequencyPerLoop: input.frequencyPerLoop,
          generatedAt: new Date().toISOString(),
        },
      },
    });

    await tx.mediaOrderItemScreen.createMany({
      data: lines.map((l) => ({
        orderItemId: item.id,
        screenId: l.screen.id,
        pricingRuleId: l.rule.id,
        unitPrice: l.unitPrice,
        subtotal: l.subtotal,
        pricingSnapshot: { rule: l.rule, days },
      })),
    });

    await tx.mediaOrderItemMedia.createMany({
      data: input.mediaIds.map((mediaId, index) => ({
        orderItemId: item.id,
        mediaId,
        displayOrder: index + 1,
        durationSeconds: input.spotDuration,
      })),
    });

    // CampaignScreen[] / CampaignMedia[] volontairement NON crÃ©Ã©s ici :
    // matÃ©rialisÃ©s au passage PAID -> PROCESSING (Ã‰tape 4).

    return {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        subtotal: order.subtotal,
        totalAmount: order.totalAmount,
      },
      campaign: { id: campaign.id, name: campaign.name, status: campaign.status },
      itemId: item.id,
      pricing: {
        currency: "XOF",
        lines: lines.map((l) => ({
          screenId: l.screen.id,
          pricingRuleId: l.rule.id,
          unitPrice: l.unitPrice,
          subtotal: l.subtotal,
        })),
      },
    };
  });
}
