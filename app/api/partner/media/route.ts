import { NextResponse } from "next/server";
import {
  HttpError,
  requirePartner,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

function serializeData<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function GET() {
  try {
    const { partner } = await requirePartner();

    const media = await prisma.media.findMany({
      where: {
        partnerId: partner.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(serializeData(media));
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("PARTNER MEDIA GET ERROR:", error);

    return NextResponse.json(
      { error: "Impossible de charger vos médias." },
      { status: 500 }
    );
  }
}