const crypto = require("crypto");
const fs = require("fs");

const files = [
  "prisma/migrations/0_init/migration.sql",
  "prisma/migrations/20260910031212_add_player_short_code/migration.sql",
  "prisma/migrations/20260917000000_add_active_reservation_unique_index/migration.sql",
  "prisma/migrations/20260917010000_protect_playback_history/migration.sql",
  "prisma/migrations/20260920000000_add_campaign_rejection_reason/migration.sql"
];

for (const file of files) {
  const hash = crypto
    .createHash("sha256")
    .update(fs.readFileSync(file))
    .digest("hex");

  console.log(`${file}`);
  console.log(hash);
}
