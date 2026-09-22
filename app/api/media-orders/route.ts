// app/api/media-orders/route.ts
// POST /api/media-orders — création d'une commande V2

import { NextRequest, NextResponse } from "next/server";
import { requireAdvertiser } from "@/lib/permissions";
import {
  createMediaOrder,
  HttpError,
  type RequesterContext,
} from "@/lib/services/media-order.service";

async function getRequesterContext(): Promise<RequesterContext> {
  // TODO admin : si un helper requireAdmin existe dans @/lib/permissions,
  // le détecter ici pour autoriser onBehalfOfAdvertiserId.
  const { advertiser } = await requireAdvertiser();
  return { advertiserId: advertiser.id, isAdmin: false };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const context = await getRequesterContext();
    const result = await createMediaOrder(body, context);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/media-orders]", error);
    return NextResponse.json({ error: "Impossible de créer la commande." }, { status: 500 });
  }
}