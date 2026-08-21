import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({
        authenticated: false,
        userId: null,
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      select: {
        id: true,
        clerkUserId: true,
        role: true,
        email: true,
      },
    });

    return NextResponse.json({
      authenticated: true,
      userId,
      prismaUserFound: !!user,
      user: user
        ? {
            id: user.id,
            clerkUserId: user.clerkUserId,
            role: user.role,
            email: user.email,
          }
        : null,
    });
  } catch (error) {
    console.error("DEBUG AUTH ERROR:", error);

    return NextResponse.json(
      {
        error: "Database/auth diagnostic failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}