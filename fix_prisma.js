const fs = require('fs');
const path = require('path');

const files = [
  'app/api/campagnes/route.ts',
  'app/api/campagnes/[id]/ecrans/route.ts',
  'app/api/campagnes/[id]/medias/route.ts',
  'app/api/campagnes/[id]/route.ts',
  'app/api/ecrans/[id]/playlist/route.ts',
  'app/api/medias/route.ts',
  'app/api/medias/[id]/route.ts',
  'app/api/paiements/route.ts',
  'app/api/paiements/verify/route.ts',
  'app/api/upload/route.ts',
];

const oldPattern = /import\s*\{\s*PrismaClient\s*\}\s*from\s*['"]@prisma\/client['"];?\s*\n\s*const prisma = new PrismaClient\(\);?/g;
const replacement = "import { prisma } from '@/lib/prisma';";

let fixed = 0;
let skipped = 0;

files.forEach(f => {
  if (!fs.existsSync(f)) {
    console.log(`[SKIP] ${f} - introuvable`);
    skipped++;
    return;
  }

  let content = fs.readFileSync(f, 'utf8');
  const newContent = content.replace(oldPattern, replacement);

  if (newContent !== content) {
    fs.writeFileSync(f, newContent, 'utf8');
    console.log(`[FIXED] ${f}`);
    fixed++;
  } else {
    console.log(`[OK] ${f} - deja correct ou format different`);
  }
});

console.log(`\n=== RESULTAT : ${fixed} corriges, ${skipped} introuvables ===`);
console.log("Verifie avec : findstr /s /c:\"new PrismaClient\" app\\*.ts lib\\*.ts");
