#!/usr/bin/env node
/**
 * fix-mojibake-safe.js
 * Version sécurisée : corrige les chaînes UTF-8 mal réinterprétées comme CP1252,
 * mais valide STRICTEMENT chaque niveau de décodage UTF-8 avant de l'accepter.
 * Si un niveau produit une séquence UTF-8 invalide, on s'arrête au dernier niveau
 * valide au lieu de continuer et de perdre des données silencieusement.
 *
 * Usage :
 *   node fix-mojibake-safe.js --dry-run
 *   node fix-mojibake-safe.js
 *   node fix-mojibake-safe.js --exts=.ts,.tsx,.json,.md
 *   node fix-mojibake-safe.js --exclude=node_modules,.git,.next,.vercel
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const extsArg = args.find(a => a.startsWith('--exts='));
const excludeArg = args.find(a => a.startsWith('--exclude='));
const exts = (extsArg ? extsArg.split('=')[1] : '.ts,.tsx').split(',');
const excludes = (excludeArg ? excludeArg.split('=')[1] : 'node_modules,.git,.next,.vercel').split(',');

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

// Décodeur UTF-8 STRICT : lève une exception sur toute séquence invalide,
// au lieu de la remplacer silencieusement par U+FFFD.
const strictDecoder = new TextDecoder('utf-8', { fatal: true });

// Réinterprète une chaîne comme si ses octets avaient été lus en CP1252,
// puis tente un redécodage UTF-8 strict. Retourne null si invalide
// (au lieu de retourner un résultat corrompu avec des caractères de remplacement).
function reinterpretOneLevelStrict(str) {
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
    return strictDecoder.decode(Buffer.from(bytes));
  } catch {
    return null; // séquence UTF-8 invalide à ce niveau : on n'accepte PAS ce résultat
  }
}

function looksMojibake(str) {
  return str.includes('Ã') || str.includes('â€') || str.includes('Â');
}

function fixMojibakeStrict(str, maxLevels = 6) {
  let current = str;
  let levels = 0;
  while (looksMojibake(current) && levels < maxLevels) {
    const next = reinterpretOneLevelStrict(current);
    if (next === null) {
      // Le niveau suivant serait invalide en UTF-8 : on s'arrête ICI,
      // on garde le dernier état valide plutôt que de continuer.
      break;
    }
    if (next === current) break;
    current = next;
    levels++;
  }
  return { fixed: current, levels, stillLooksMojibake: looksMojibake(current) };
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
let flagged = 0;

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  if (!looksMojibake(original)) continue;

  const { fixed, levels, stillLooksMojibake } = fixMojibakeStrict(original);
  if (fixed === original) {
    // Rien n'a pu être corrigé de façon sûre : signaler pour revue manuelle.
    flagged++;
    console.log(`[ATTENTION] ${file} — motif suspect mais aucune correction sûre trouvée (revue manuelle nécessaire)`);
    continue;
  }

  touched++;
  const warn = stillLooksMojibake ? ' [reste du mojibake après arrêt sûr — revue manuelle conseillée]' : '';
  console.log(`${dryRun ? '[dry-run] ' : ''}${file} — ${levels} niveau(x) corrigé(s)${warn}`);

  if (!dryRun) {
    fs.writeFileSync(file + '.bak-mojibake-safe', original, 'utf8');
    fs.writeFileSync(file, fixed, 'utf8');
  }
}

console.log(`\n${touched} fichier(s) ${dryRun ? 'à corriger' : 'corrigé(s)'}, ${flagged} signalé(s) pour revue manuelle, sur ${files.length} analysé(s).`);
if (dryRun) {
  console.log('Relancez sans --dry-run pour appliquer (des copies .bak-mojibake-safe seront créées à côté de chaque fichier modifié).');
}
