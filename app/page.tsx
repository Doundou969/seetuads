import { prisma } from "@/lib/prisma";
import { LandingContent } from "@/components/home/landing-content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [zones, partners, screens, campaigns] = await Promise.all([
    prisma.zone.count(),
    prisma.partner.count(),
    prisma.screen.count(),
    prisma.campaign.count(),
  ]);

  return (
    <LandingContent
      stats={{
        zones,
        partners,
        screens,
        campaigns,
      }}
    />
  );
}