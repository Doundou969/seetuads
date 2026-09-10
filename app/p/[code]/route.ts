import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const player = await prisma.player.findUnique({
    where: { shortCode: code.toUpperCase() },
    select: { deviceId: true, apiKey: true },
  });

  if (!player) {
    return new NextResponse("Code inconnu", { status: 404 });
  }

  const url = new URL("/player", req.url);
  url.searchParams.set("deviceId", player.deviceId);
  url.searchParams.set("key", player.apiKey);

  return NextResponse.redirect(url);
}