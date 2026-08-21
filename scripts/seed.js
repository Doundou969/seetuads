const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── 0. USERS (nécessaires pour les relations) ────────
  const users = await Promise.all([
    prisma.user.create({
      data: {
        clerkUserId: "clerk_user_1",
        role: "PARTNER",
        email: "partner1@seetuads.sn",
        firstName: "Amadou",
        lastName: "Diallo",
        phone: "+221 77 123 45 67",
      },
    }),
    prisma.user.create({
      data: {
        clerkUserId: "clerk_user_2",
        role: "PARTNER",
        email: "partner2@seetuads.sn",
        firstName: "Fatou",
        lastName: "Ndiaye",
        phone: "+221 76 234 56 78",
      },
    }),
    prisma.user.create({
      data: {
        clerkUserId: "clerk_user_3",
        role: "PARTNER",
        email: "partner3@seetuads.sn",
        firstName: "Ibrahima",
        lastName: "Sow",
        phone: "+221 70 345 67 89",
      },
    }),
    prisma.user.create({
      data: {
        clerkUserId: "clerk_user_4",
        role: "PARTNER",
        email: "partner4@seetuads.sn",
        firstName: "Ousmane",
        lastName: "Fall",
        phone: "+221 78 456 78 90",
      },
    }),
  ]);
  console.log(`✅ Created ${users.length} users`);

  // ─── 1. ZONES ─────────────────────────────────────────
  const zones = await Promise.all([
    prisma.zone.create({
      data: {
        name: "Plateau",
        city: "Dakar",
        district: "Plateau",
        description: "Centre administratif et commercial de Dakar",
        radiusMeters: 1500,
        status: "ACTIVE",
      },
    }),
    prisma.zone.create({
      data: {
        name: "Almadies",
        city: "Dakar",
        district: "Les Almadies",
        description: "Zone touristique et residentielle",
        radiusMeters: 2000,
        status: "ACTIVE",
      },
    }),
    prisma.zone.create({
      data: {
        name: "Medina",
        city: "Dakar",
        district: "Medina",
        description: "Quartier historique et commercant",
        radiusMeters: 1200,
        status: "ACTIVE",
      },
    }),
    prisma.zone.create({
      data: {
        name: "Mermoz",
        city: "Dakar",
        district: "Mermoz-Sacre-Coeur",
        description: "Zone residentielle",
        radiusMeters: 1800,
        status: "PENDING",
      },
    }),
  ]);
  console.log(`✅ Created ${zones.length} zones`);

  // ─── 2. PARTNERS ──────────────────────────────────────
  const partners = await Promise.all([
    prisma.partner.create({
      data: {
        userId: users[0].id,
        businessName: "Cafe de la Plage",
        ownerName: "Amadou Diallo",
        phone: "+221 77 123 45 67",
        email: "contact@cafedelaplage.sn",
        businessType: "RESTAURANT",
        address: "Route des Almadies, Ngor",
        city: "Dakar",
        latitude: 14.7419,
        longitude: -17.5112,
        status: "ACTIVE",
      },
    }),
    prisma.partner.create({
      data: {
        userId: users[1].id,
        businessName: "Supermarche Casino",
        ownerName: "Fatou Ndiaye",
        phone: "+221 76 234 56 78",
        email: "casino@supermarche.sn",
        businessType: "SUPERMARKET",
        address: "Avenue Lamine Gueye, Plateau",
        city: "Dakar",
        latitude: 14.6678,
        longitude: -17.4369,
        status: "ACTIVE",
      },
    }),
    prisma.partner.create({
      data: {
        userId: users[2].id,
        businessName: "Pharmacie du Centre",
        ownerName: "Dr. Ibrahima Sow",
        phone: "+221 70 345 67 89",
        email: "pharmacie@centre.sn",
        businessType: "PHARMACY",
        address: "Rue Vincens, Plateau",
        city: "Dakar",
        latitude: 14.6645,
        longitude: -17.4333,
        status: "ACTIVE",
      },
    }),
    prisma.partner.create({
      data: {
        userId: users[3].id,
        businessName: "Station Total Mermoz",
        ownerName: "Ousmane Fall",
        phone: "+221 78 456 78 90",
        email: "total.mermoz@petrol.sn",
        businessType: "GAS_STATION",
        address: "Boulevard du Centenaire, Mermoz",
        city: "Dakar",
        latitude: 14.7056,
        longitude: -17.4689,
        status: "PENDING",
      },
    }),
  ]);
  console.log(`✅ Created ${partners.length} partners`);

  // ─── 3. LOCATIONS ─────────────────────────────────────
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        partnerId: partners[0].id,
        name: "Cafe de la Plage - Terrasse",
        businessType: "RESTAURANT",
        address: "Route des Almadies, Ngor",
        city: "Dakar",
        district: "Les Almadies",
        latitude: 14.7419,
        longitude: -17.5112,
        description: "Grande terrasse avec vue sur l'ocean",
        photos: JSON.stringify(["https://example.com/photo1.jpg"]),
        status: "ACTIVE",
      },
    }),
    prisma.location.create({
      data: {
        partnerId: partners[1].id,
        name: "Supermarche Casino - Entree",
        businessType: "SUPERMARKET",
        address: "Avenue Lamine Gueye, Plateau",
        city: "Dakar",
        district: "Plateau",
        latitude: 14.6678,
        longitude: -17.4369,
        description: "Entree principale du supermarche",
        photos: JSON.stringify(["https://example.com/photo2.jpg"]),
        status: "ACTIVE",
      },
    }),
    prisma.location.create({
      data: {
        partnerId: partners[2].id,
        name: "Pharmacie du Centre - Vitrine",
        businessType: "PHARMACY",
        address: "Rue Vincens, Plateau",
        city: "Dakar",
        district: "Plateau",
        latitude: 14.6645,
        longitude: -17.4333,
        description: "Vitrine principale",
        photos: JSON.stringify(["https://example.com/photo3.jpg"]),
        status: "ACTIVE",
      },
    }),
    prisma.location.create({
      data: {
        partnerId: partners[3].id,
        name: "Station Total Mermoz - Boutique",
        businessType: "GAS_STATION",
        address: "Boulevard du Centenaire, Mermoz",
        city: "Dakar",
        district: "Mermoz-Sacre-Coeur",
        latitude: 14.7056,
        longitude: -17.4689,
        description: "Boutique de la station-service",
        photos: JSON.stringify(["https://example.com/photo4.jpg"]),
        status: "PENDING",
      },
    }),
  ]);
  console.log(`✅ Created ${locations.length} locations`);

  // ─── 4. SCREENS ───────────────────────────────────────
  const screens = await Promise.all([
    prisma.screen.create({
      data: {
        locationId: locations[0].id,
        zoneId: zones[1].id,
        screenCode: "SCR-ALM-001",
        name: "Ecran Terrasse Almadies",
        widthPx: 1920,
        heightPx: 1080,
        resolution: "1920x1080",
        orientation: "landscape",
        status: "ONLINE",
        installationDate: new Date("2024-01-15"),
        monthlyPartnerFee: 25000.0,
        inventoryLoopSeconds: 120,
      },
    }),
    prisma.screen.create({
      data: {
        locationId: locations[1].id,
        zoneId: zones[0].id,
        screenCode: "SCR-PLT-001",
        name: "Ecran Entree Casino",
        widthPx: 1920,
        heightPx: 1080,
        resolution: "1920x1080",
        orientation: "landscape",
        status: "ONLINE",
        installationDate: new Date("2024-02-20"),
        monthlyPartnerFee: 30000.0,
        inventoryLoopSeconds: 120,
      },
    }),
    prisma.screen.create({
      data: {
        locationId: locations[2].id,
        zoneId: zones[0].id,
        screenCode: "SCR-PLT-002",
        name: "Ecran Pharmacie Plateau",
        widthPx: 1920,
        heightPx: 1080,
        resolution: "1920x1080",
        orientation: "portrait",
        status: "OFFLINE",
        installationDate: new Date("2024-03-10"),
        monthlyPartnerFee: 20000.0,
        inventoryLoopSeconds: 120,
      },
    }),
    prisma.screen.create({
      data: {
        locationId: locations[3].id,
        zoneId: zones[3].id,
        screenCode: "SCR-MER-001",
        name: "Ecran Station Mermoz",
        widthPx: 1920,
        heightPx: 1080,
        resolution: "1920x1080",
        orientation: "landscape",
        status: "WARNING",
        installationDate: new Date("2024-04-05"),
        monthlyPartnerFee: 22000.0,
        inventoryLoopSeconds: 120,
      },
    }),
  ]);
  console.log(`✅ Created ${screens.length} screens`);

  // ─── 5. PLAYERS ───────────────────────────────────────
  const players = await Promise.all([
    prisma.player.create({
      data: {
        screenId: screens[0].id,
        deviceId: "DEV-ALM-001-A",
        serialNumber: "SN123456789",
        appVersion: "2.1.0",
        osVersion: "Android 12",
        lastHeartbeat: new Date(),
        status: "ONLINE",
        lastIp: "192.168.1.101",
        storageStatus: JSON.stringify({ used: 45, total: 128, unit: "GB" }),
      },
    }),
    prisma.player.create({
      data: {
        screenId: screens[1].id,
        deviceId: "DEV-PLT-001-B",
        serialNumber: "SN987654321",
        appVersion: "2.1.0",
        osVersion: "Android 13",
        lastHeartbeat: new Date(),
        status: "ONLINE",
        lastIp: "192.168.1.102",
        storageStatus: JSON.stringify({ used: 62, total: 128, unit: "GB" }),
      },
    }),
    prisma.player.create({
      data: {
        screenId: screens[2].id,
        deviceId: "DEV-PLT-002-C",
        serialNumber: "SN456789123",
        appVersion: "2.0.5",
        osVersion: "Android 11",
        lastHeartbeat: new Date(Date.now() - 86400000),
        status: "OFFLINE",
        lastIp: "192.168.1.103",
        storageStatus: JSON.stringify({ used: 30, total: 64, unit: "GB" }),
      },
    }),
    prisma.player.create({
      data: {
        screenId: screens[3].id,
        deviceId: "DEV-MER-001-D",
        serialNumber: "SN789123456",
        appVersion: "2.1.0",
        osVersion: "Android 12",
        lastHeartbeat: new Date(Date.now() - 3600000),
        status: "ERROR",
        lastIp: "192.168.1.104",
        storageStatus: JSON.stringify({ used: 110, total: 128, unit: "GB" }),
      },
    }),
  ]);
  console.log(`✅ Created ${players.length} players`);

  // ─── 6. PRICING RULES ─────────────────────────────────
  const pricingRules = await Promise.all([
    prisma.pricingRule.create({
      data: {
        name: "Tarif Standard Plateau",
        zoneId: zones[0].id,
        basePrice: 50000.0,
        durationMultiplier: 1.0,
        frequencyMultiplier: 1.0,
        zoneMultiplier: 1.5,
        active: true,
      },
    }),
    prisma.pricingRule.create({
      data: {
        name: "Tarif Standard Almadies",
        zoneId: zones[1].id,
        basePrice: 60000.0,
        durationMultiplier: 1.0,
        frequencyMultiplier: 1.0,
        zoneMultiplier: 1.8,
        active: true,
      },
    }),
  ]);
  console.log(`✅ Created ${pricingRules.length} pricing rules`);

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   Users:     ${users.length}`);
  console.log(`   Zones:     ${zones.length}`);
  console.log(`   Partners:  ${partners.length}`);
  console.log(`   Locations: ${locations.length}`);
  console.log(`   Screens:   ${screens.length}`);
  console.log(`   Players:   ${players.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });