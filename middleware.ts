import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  // AccÃ¨s public par lien annonceur
  if (
    pathname.startsWith("/advertiser/access/") ||
    pathname.startsWith("/api/advertiser/access-link/")
  ) {
    const response = NextResponse.next();

    if (pathname.startsWith("/advertiser/access/")) {
      response.headers.set("x-seetuads-public-access", "true");
    }

    return response;
  }

  // Routes publiques
  if (
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/player") ||
    pathname.startsWith("/api/monitoring") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/player") ||
    pathname.startsWith("/p/")
  ) {
    return NextResponse.next();
  }

  // Protection temporaire conservÃ©e pendant la migration
  // vers les vÃ©rifications d'authentification au niveau des ressources.
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};