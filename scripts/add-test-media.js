import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  let body: any = {};
  
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {
    // body vide ou invalide
  }

  const { deviceId, appVersion, osVersion, storageStatus, ipAddress } = body;

  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({
    where: { deviceId },
    include: { screen: true },
  });

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const updateData: any = {
    lastHeartbeat: new Date(),
    status: "ONLINE",
    lastIp: ipAddress || player.lastIp,
    appVersion: appVersion || player.appVersion,
    osVersion: osVersion || player.osVersion,
  };

  if (storageStatus) {
    updateData.storageStatus = JSON.stringify(storageStatus);
  }

  const updated = await prisma.player.update({
    where: { id: player.id },
    data: updateData,
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