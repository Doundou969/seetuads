const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      pi.media_id,
      pi.campaign_id,
      pi.duration_seconds AS programmed_seconds,
      pl.duration_seconds AS played_seconds,
      COUNT(*)::int AS occurrences
    FROM playlist_items pi
    JOIN playback_logs pl
      ON pl.media_id = pi.media_id
     AND (
          pl.campaign_id = pi.campaign_id
          OR (pl.campaign_id IS NULL AND pi.campaign_id IS NULL)
     )
    WHERE pl.status = 'PLAYED'
    GROUP BY
      pi.media_id,
      pi.campaign_id,
      pi.duration_seconds,
      pl.duration_seconds
    ORDER BY
      pi.media_id,
      pi.duration_seconds,
      pl.duration_seconds;
  `);

  console.table(rows);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
