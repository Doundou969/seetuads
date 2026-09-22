const fs = require("fs");

const path = "./prisma/migrations/0_init/migration.sql";
const b = fs.readFileSync(path);

let crlf = 0;
let lf = 0;
let cr = 0;

for (let i = 0; i < b.length; i++) {
  if (b[i] === 13 && b[i + 1] === 10) crlf++;
  else if (b[i] === 10) lf++;
  else if (b[i] === 13) cr++;
}

console.log({
  bytes: b.length,
  crlf,
  lf,
  cr,
  bom: b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf
});
