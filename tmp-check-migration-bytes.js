const fs = require("fs");
const crypto = require("crypto");

for (const path of [
  "./prisma/migrations/0_init/migration.sql",
  "./prisma/migrations/20260920000000_add_campaign_rejection_reason/migration.sql"
]) {
  const b = fs.readFileSync(path);

  console.log(path);
  console.log("bytes:", b.length);
  console.log("sha256:", crypto.createHash("sha256").update(b).digest("hex"));
  console.log("first bytes:", [...b.subarray(0, 8)]);
}
