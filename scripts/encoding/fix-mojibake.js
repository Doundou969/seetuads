#!/usr/bin/env node
/**
 * fix-mojibake.js
 * Corrige les chaînes UTF-8 mal réinterprétées comme CP1252, sur un ou plusieurs
 * niveaux de corruption (double/triple mojibake).
 *
 * Usage :
 *   node fix-mojibake.js --dry-run                 (prévisualise, ne modifie rien)
 *   node fix-mojibake.js                            (applique, crée des .bak-mojibake)
 *   node fix-mojibake.js --exts=.ts,.tsx,.json
 *   node fix-mojibake.js --exclude=node_modules,encoding-backup,dist
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const extsArg = args.find(a => a.startsWith('--exts='));
const excludeArg = args.find(a => a.startsWith('--exclude='));
const exts = (extsArg ? extsArg.split('=')[1] : '.ts,.tsx').split(',');
const excludes = (excludeArg ? excludeArg.split('=')[1] : 'node_modules,encoding-backup,.git').split(',');

// Table CP1252 pour les octets 0x80-0x9F (les autres octets = même code point qu'en Latin-1)
const CP1252_80_9F = {
  0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E, 0x85: 0x2026,
  0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160,
  0x8B: 0x2039, 0x8C: 0x0152, 0x8E: 0x017D, 0x91: 0x2018, 0x92: 0x2019,
  0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A, 0x9C: 0x0153,
  0x9E: 0x017E, 0x9F: 0x0178,
};
const REVERSE_80_9F = {};
for (const [byte, cp] of Object.entries(CP1252_80_9F)) {
  REVERSE_80_9F[cp] = Number(byte);
}

// Réinterprète une chaîne JS (qui représente en fait des octets UTF-8 mal décodés
// puis réencodés) comme si ces octets avaient été lus en CP1252, et redécode le
// résultat en UTF-8 — soit un niveau de "dé-corruption".
function reinterpretOneLevel(str) {
  const bytes = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cp > 0xFF) {
      bytes.push(...Buffer.from(ch, 'utf8'));
      continue;
    }
    const byte = REVERSE_80_9F[cp] !== undefined ? REVERSE_80_9F[cp] : cp;
    bytes.push(byte);
  }
  try {
    return Buffer.from(bytes).toString('utf8');
  } catch {
    return null;
  }
}

function looksMojibake(str) {
  return str.includes('Ã') || str.includes('â€') || str.includes('Â');
}

function fixMojibake(str, maxLevels = 6) {
  let current = str;
  let levels = 0;
  while (looksMojibake(current) && levels < maxLevels) {
    const next = reinterpretOneLevel(current);
    if (next === null || next === current) break;
    current = next;
    levels++;
  }
  return { fixed: current, levels };
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (excludes.some(ex => entry.name === ex)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (exts.includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const files = walk(process.cwd());
let touched = 0;

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  if (!looksMojibake(original)) continue;

  const { fixed, levels } = fixMojibake(original);
  if (fixed === original) continue;

  touched++;
  console.log(`${dryRun ? '[dry-run] ' : ''}${file} — ${levels} niveau(x) corrigé(s)`);

  if (!dryRun) {
    fs.writeFileSync(file + '.bak-mojibake', original, 'utf8');
    fs.writeFileSync(file, fixed, 'utf8');
  }
}

console.log(`\n${touched} fichier(s) ${dryRun ? 'à corriger' : 'corrigé(s)'} sur ${files.length} analysé(s).`);
if (dryRun) {
  console.log('Relancez sans --dry-run pour appliquer (des copies .bak-mojibake seront créées à côté de chaque fichier modifié).');
}
