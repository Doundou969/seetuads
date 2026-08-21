const fs = require("fs");
const path = require("path");

function loadEnvFile(fileName) {
  const filePath = path.join(__dirname, fileName);

  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (
      !trimmed ||
      trimmed.startsWith("#")
    ) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed
      .slice(0, separatorIndex)
      .trim();

    let value = trimmed
      .slice(separatorIndex + 1)
      .trim();

    if (
      (value.startsWith('"') &&
        value.endsWith('"')) ||
      (value.startsWith("'") &&
        value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (
      process.env[key] === undefined
    ) {
      process.env[key] = value;
    }
  }
}

// Charge d'abord .env puis .env.local.
// .env.local est prioritaire dans Next.js.
loadEnvFile(".env");
loadEnvFile(".env.local");

const { PrismaClient } =
  require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("");
  console.log("========================================");
  console.log(" VÉRIFICATION COMPLÈTE DES PLAYLISTS");
  console.log("========================================");

  const playlists =
    await prisma.playlist.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: [
        {
          publishedAt: "desc",
        },
        {
          version: "desc",
        },
      ],
      include: {
        screen: {
          include: {
            location: true,
            zone: true,
          },
        },
        items: {
          orderBy: {
            position: "asc",
          },
          include: {
            media: true,
            campaign: true,
          },
        },
      },
    });

  console.log("");
  console.log(
    `Playlists actives trouvées : ${playlists.length}`
  );

  let totalItems = 0;
  let totalCampaignItems = 0;
  let totalPermanentItems = 0;

  for (const playlist of playlists) {
    console.log("");
    console.log("========================================");
    console.log(
      `ÉCRAN : ${
        playlist.screen.name ||
        playlist.screen.screenCode
      }`
    );
    console.log("========================================");

    console.log(
      "Playlist ID :",
      playlist.id
    );

    console.log(
      "Version     :",
      playlist.version
    );

    console.log(
      "Statut      :",
      playlist.status
    );

    console.log(
      "Publié le  :",
      playlist.publishedAt
        ? playlist.publishedAt.toISOString()
        : "Non défini"
    );

    console.log(
      "Location   :",
      playlist.screen.location
        ? playlist.screen.location.name
        : "Non définie"
    );

    console.log(
      "Zone       :",
      playlist.screen.zone
        ? playlist.screen.zone.name
        : "Non définie"
    );

    console.log("");

    console.log(
      `Nombre total d'items : ${playlist.items.length}`
    );

    console.log("");

    if (
      playlist.items.length === 0
    ) {
      console.log(
        "AUCUN ITEM DANS CETTE PLAYLIST."
      );

      continue;
    }

    const rows =
      playlist.items.map(
        (item) => ({
          position:
            item.position,

          playlistItemId:
            item.id,

          media:
            item.media?.name ||
            "MÉDIA INTROUVABLE",

          mediaId:
            item.mediaId,

          durationSeconds:
            item.durationSeconds,

          campaign:
            item.campaign
              ? item.campaign.name
              : "CONTENU ADMIN / SANS CAMPAGNE",

          campaignId:
            item.campaignId ||
            null,

          startDate:
            item.startDate
              ? item.startDate.toISOString()
              : null,

          endDate:
            item.endDate
              ? item.endDate.toISOString()
              : null,
        })
      );

    console.table(rows);

    const campaignItems =
      playlist.items.filter(
        (item) =>
          item.campaignId !== null
      );

    const permanentItems =
      playlist.items.filter(
        (item) =>
          item.campaignId === null
      );

    totalItems +=
      playlist.items.length;

    totalCampaignItems +=
      campaignItems.length;

    totalPermanentItems +=
      permanentItems.length;

    console.log("");
    console.log("Résumé de cet écran :");

    console.log(
      `  Items permanents / administratifs : ${permanentItems.length}`
    );

    console.log(
      `  Items provenant de campagnes      : ${campaignItems.length}`
    );

    console.log(
      `  TOTAL                             : ${playlist.items.length}`
    );
  }

  console.log("");
  console.log("========================================");
  console.log(" RÉSUMÉ GLOBAL");
  console.log("========================================");

  console.log(
    `Playlists actives          : ${playlists.length}`
  );

  console.log(
    `Items permanents           : ${totalPermanentItems}`
  );

  console.log(
    `Items de campagnes         : ${totalCampaignItems}`
  );

  console.log(
    `TOTAL D'ITEMS              : ${totalItems}`
  );

  console.log("");
  console.log("========================================");
  console.log(" VÉRIFICATION TERMINÉE");
  console.log("========================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("========================================");
    console.error(" ERREUR");
    console.error("========================================");
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });