import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const deviceId = typeof body.deviceId === "string" ? body.deviceId : null;
  const apiKey = req.headers.get("x-player-key");

  if (!deviceId) {
    return NextResponse.json({ error: "deviceId requis" }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: "ClÃ© player requise" }, { status: 401 });
  }

  const player = await prisma.player.findFirst({
    where: { deviceId, apiKey },
    include: { screen: true },
  });

  if (!player) {
    return NextResponse.json({ error: "Player non autorisÃ©" }, { status: 401 });
  }

  const forwardedIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  const updated = await prisma.player.update({
    where: { id: player.id },
    data: {
      lastHeartbeat: new Date(),
      status: "ONLINE",
      lastIp:
        (typeof body.ipAddress === "string" && body.ipAddress) ||
        forwardedIp ||
        player.lastIp,
      appVersion:
        (typeof body.appVersion === "string" && body.appVersion) ||
        player.appVersion,
      osVersion:
        (typeof body.osVersion === "string" && body.osVersion) ||
        player.osVersion,
      ...(body.storageStatus !== undefined
  ? { storageStatus: body.storageStatus as Prisma.InputJsonValue }
        : {}),
    },
  });

  if (player.screen) {
    await prisma.screen.update({
      where: { id: player.screen.id },
      data: { status: "ONLINE" },
    });
  }

  return NextResponse.json({
    success: true,
    deviceId: updated.deviceId,
    status: updated.status,
    lastHeartbeat: updated.lastHeartbeat,
  });
}