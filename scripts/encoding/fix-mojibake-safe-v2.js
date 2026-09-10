#!/usr/bin/env node
/**
 * fix-mojibake-safe-v2.js
 * Corrige UNIQUEMENT les segments de texte qui portent la signature du mojibake
 * (Ã, Â, et les symboles typographiques CP1252 mal réinterprétés), en laissant
 * strictement intact tout le reste du fichier — y compris les accents déjà
 * correctement encodés (é, è, à, —, etc.) qui ne doivent JAMAIS être touchés.
 *
 * Chaque segment isolé est décodé niveau par niveau avec validation UTF-8
 * stricte (TextDecoder fatal:true) ; si un niveau produirait une séquence
 * invalide, on garde le dernier niveau valide et on signale le fichier pour
 * revue manuelle au lieu de continuer.
 *
 * Usage :
 *   node fix-mojibake-safe-v2.js --dry-run
 *   node fix-mojibake-safe-v2.js
 *   node fix-mojibake-safe-v2.js --exts=.ts,.tsx,.json,.md
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const extsArg = args.find(a => a.startsWith('--exts='));
const excludeArg = args.find(a => a.startsWith('--exclude='));
const exts = (extsArg ? extsArg.split('=')[1] : '.ts,.tsx').split(',');
const excludes = (excludeArg ? excludeArg.split('=')[1] : 'node_modules,.git,.next,.vercel').split(',');

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

// Alphabet des caractères qui n'apparaissent QUE dans du mojibake dans ce contexte :
// Â, Ã (lead bytes UTF-8 mal relus), les 26 symboles CP1252 0x80-0x9F remappés,
// et la plage U+00A0-U+00BF (octets de continuation typiques après Ã).
// Un 'é', 'è', 'à', 'ç' correctement encodé (U+00E0-U+00FF) N'EST PAS dans cet
// alphabet et ne sera donc jamais touché.
const MOJIBAKE_CHARS = new Set([
  0x00C2, 0x00C3,
  ...Object.values(CP1252_80_9F),
]);
for (let cp = 0x00A0; cp <= 0x00BF; cp++) MOJIBAKE_CHARS.add(cp);

function isMojibakeChar(ch) {
  return MOJIBAKE_CHARS.has(ch.codePointAt(0));
}

// Découpe la chaîne en segments alternés : { text, isRun }
function splitRuns(str) {
  const segments = [];
  let current = '';
  let currentIsRun = false;
  for (const ch of str) {
    const chIsRun = isMojibakeChar(ch);
    if (current === '' ) {
      current = ch;
      currentIsRun = chIsRun;
    } else if (chIsRun === currentIsRun) {
      current += ch;
    } else {
      segments.push({ text: current, isRun: currentIsRun });
      current = ch;
      currentIsRun = chIsRun;
    }
  }
  if (current !== '') segments.push({ text: current, isRun: currentIsRun });
  return segments;
}

const strictDecoder = new TextDecoder('utf-8', { fatal: true });

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
    return null;
  }
}

// Corrige un run isolé, niveau par niveau, en s'arrêtant au dernier niveau
// strictement valide en UTF-8. Retourne aussi si le run semble encore corrompu.
function fixRunStrict(run, maxLevels = 6) {
  let current = run;
  let levels = 0;
  while (levels < maxLevels) {
    const next = reinterpretOneLevelStrict(current);
    if (next === null || next === current) break;
    // Un run "corrigé avec succès" ne doit plus contenir de caractère de
    // l'alphabet mojibake une fois qu'on a atteint le bon niveau.
    current = next;
    levels++;
    const stillHasRunChars = [...current].some(isMojibakeChar);
    if (!stillHasRunChars) break;
  }
  const stillLooksMojibake = [...current].some(isMojibakeChar);
  return { fixed: current, levels, stillLooksMojibake };
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
  const segments = splitRuns(original);
  const runSegments = segments.filter(s => s.isRun);

  if (runSegments.length === 0) continue;

  let anyFixed = false;
  let anyUnresolved = false;
  const rebuilt = segments.map(seg => {
    if (!seg.isRun) return seg.text;
    const { fixed, levels, stillLooksMojibake } = fixRunStrict(seg.text);
    if (levels > 0) anyFixed = true;
    if (stillLooksMojibake) anyUnresolved = true;
    return fixed;
  }).join('');

  if (!anyFixed) {
    flagged++;
    console.log(`[ATTENTION] ${file} — motif suspect mais aucune correction sûre trouvée (revue manuelle nécessaire)`);
    continue;
  }

  touched++;
  const warn = anyUnresolved ? ' [certains segments restent suspects après correction partielle — revue manuelle conseillée]' : '';
  console.log(`${dryRun ? '[dry-run] ' : ''}${file} — corrigé${warn}`);

  if (!dryRun) {
    fs.writeFileSync(file + '.bak-mojibake-v2', original, 'utf8');
    fs.writeFileSync(file, rebuilt, 'utf8');
  }
}

console.log(`\n${touched} fichier(s) ${dryRun ? 'à corriger' : 'corrigé(s)'}, ${flagged} signalé(s) pour revue manuelle, sur ${files.length} analysé(s).`);
if (dryRun) {
  console.log('Relancez sans --dry-run pour appliquer (des copies .bak-mojibake-v2 seront créées à côté de chaque fichier modifié).');
}
