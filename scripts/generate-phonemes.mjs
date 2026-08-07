/**
 * Generate isolated English phoneme WAVs with klattsch (MIT, Klatt 1980 formants).
 *
 *   node scripts/generate-phonemes.mjs
 *
 * Vowels / continuants are held longer so kids can hear the sound.
 * Stops use a light schwa (phonics "buh", "tuh") because a bare burst is hard to hear.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  compileString,
  renderToBuffer,
  encodeWav,
} from "klattsch";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "sounds", "phonemes");

/** id → ARPABET string for klattsch */
const PHONEMES = {
  // Short / long vowels & diphthongs
  iy: "r260 IY IY",
  ih: "r260 IH IH",
  eh: "r260 EH EH",
  ae: "r260 AE AE",
  aa: "r260 AA AA",
  ao: "r260 AO AO",
  ah: "r260 AH AH",
  uh: "r260 UH UH",
  uw: "r260 UW UW",
  er: "r260 ER ER",
  ey: "r240 EY EY",
  ay: "r240 AY AY",
  ow: "r240 OW OW",
  aw: "r240 AW AW",
  oy: "r240 OY OY",

  // Continuants (sustainable)
  f: "r240 F F F",
  v: "r240 V V V",
  s: "r240 S S S",
  z: "r240 Z Z Z",
  th: "r240 TH TH TH",
  dh: "r240 DH DH DH",
  sh: "r240 SH SH SH",
  zh: "r240 ZH ZH",
  m: "r240 M M M",
  n: "r240 N N N",
  ng: "r240 NG NG",
  l: "r240 L L L",
  r: "r240 R R R",
  w: "r220 W W",
  y: "r220 Y Y",
  hh: "r220 HH HH",

  // Stops / affricates — phonics style with brief schwa
  p: "r150 P AH",
  b: "r150 B AH",
  t: "r150 T AH",
  d: "r150 D AH",
  k: "r150 K AH",
  g: "r150 G AH",
  ch: "r160 CH AH",
  jh: "r160 JH AH",

  // Digraph helper: /ks/ for letter x
  ks: "r150 K S",
  // /kw/ for qu
  kw: "r150 K W",
};

function renderOne(arpabet) {
  const sampleRate = 48000;
  const { voices, totalMs, warnings } = compileString(arpabet);
  if (warnings.length) {
    console.warn("  warnings:", warnings.join(", "));
  }
  const buf = new Float32Array(Math.ceil((totalMs * sampleRate) / 1000));
  for (const v of voices) {
    if (!v.schedule.length) continue;
    const vb = renderToBuffer({
      sampleRate,
      schedule: v.schedule,
      totalMs: v.totalMs,
    });
    const n = Math.min(buf.length, vb.length);
    for (let i = 0; i < n; i++) buf[i] += vb[i];
  }
  return encodeWav(buf, sampleRate, {
    metadata: {
      software: "klattsch · https://tgies.github.io/klattsch",
      comment: arpabet,
    },
  });
}

mkdirSync(OUT_DIR, { recursive: true });

let ok = 0;
for (const [id, arpabet] of Object.entries(PHONEMES)) {
  const { bytes, gain } = renderOne(arpabet);
  const path = join(OUT_DIR, `${id}.wav`);
  writeFileSync(path, bytes);
  console.log(
    `${id}.wav  ${(bytes.length / 1024).toFixed(1)} KB  gain ${gain.toFixed(2)}x  [${arpabet}]`
  );
  ok++;
}

writeFileSync(
  join(OUT_DIR, "README.md"),
  `# Phoneme sounds

Generated with [klattsch](https://github.com/chewieglass-labs/klattsch) (MIT),
using Klatt 1980 English formant targets.

Regenerate:

\`\`\`bash
node scripts/generate-phonemes.mjs
\`\`\`

Files are named by ARPABET-style ids (\`ae.wav\`, \`sh.wav\`, …).
`
);

console.log(`\nWrote ${ok} phonemes to ${OUT_DIR}`);
