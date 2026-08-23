import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",

  // APIs publiques
  "/api/health(.*)",
  "/api/webhooks(.*)",
  "/api/player(.*)",
  "/api/monitoring(.*)",

  // Player public
  "/player(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  // Accès public par lien annonceur
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
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Routes protégées
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