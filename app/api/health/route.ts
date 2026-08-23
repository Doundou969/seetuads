import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      service: "SeetuAds",
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
    }
  );
}