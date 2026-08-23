import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const usersCount = await prisma.user.count();

    return NextResponse.json({
      success: true,
      service: "SeetuAds Database",
      status: "healthy",
      database: "connected",
      usersCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    return NextResponse.json(
      {
        success: false,
        service: "SeetuAds Database",
        status: "unhealthy",
        database: "disconnected",
        error:
          error instanceof Error
            ? error.message
            : "Unknown database error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}