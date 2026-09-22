const fs = require("fs");

const path = "./prisma/migrations/20260920000000_add_campaign_rejection_reason/migration.sql";
const buffer = fs.readFileSync(path);

console.log("First 3 bytes:", [...buffer.subarray(0, 3)]);
console.log("Has UTF-8 BOM:", buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF);
