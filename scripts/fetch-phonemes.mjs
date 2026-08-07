/**
 * Download human-recorded English phoneme samples from Wikimedia Commons
 * and convert to MP3 with ffmpeg.
 *
 *   node scripts/fetch-phonemes.mjs
 */
import {
  mkdirSync,
  writeFileSync,
  readdirSync,
  unlinkSync,
  existsSync,
  rmSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "sounds", "phonemes");
const TMP_DIR = join(OUT_DIR, "_tmp");
const UA =
  "learntoread-phonemes/1.0 (educational; https://github.com/aaronjsmith/learntoread)";

/**
 * Direct upload.wikimedia.org paths (stable) for IPA chart / EN samples.
 * Titles are used for attribution only.
 */
const PHONEMES = {
  iy: {
    title: "Close front unrounded vowel.ogg",
    path: "9/91/Close_front_unrounded_vowel.ogg",
  },
  ih: {
    title: "Near-close near-front unrounded vowel.ogg",
    path: "4/4c/Near-close_near-front_unrounded_vowel.ogg",
  },
  eh: {
    title: "Open-mid front unrounded vowel.ogg",
    path: "7/71/Open-mid_front_unrounded_vowel.ogg",
  },
  ae: {
    title: "Near-open front unrounded vowel.ogg",
    path: "c/c9/Near-open_front_unrounded_vowel.ogg",
  },
  aa: {
    title: "Open back unrounded vowel.ogg",
    path: "e/e5/Open_back_unrounded_vowel.ogg",
  },
  ao: {
    title: "Open-mid back rounded vowel.ogg",
    path: "0/02/Open-mid_back_rounded_vowel.ogg",
  },
  ah: {
    title: "Open-mid back unrounded vowel.ogg",
    path: "9/92/Open-mid_back_unrounded_vowel.ogg",
  },
  uh: {
    title: "Near-close near-back rounded vowel.ogg",
    path: "d/d5/Near-close_near-back_rounded_vowel.ogg",
  },
  uw: {
    title: "Close back rounded vowel.ogg",
    path: "5/5d/Close_back_rounded_vowel.ogg",
  },
  er: {
    title: "Open-mid central unrounded vowel.ogg",
    path: "0/01/Open-mid_central_unrounded_vowel.ogg",
  },
  ax: {
    title: "Mid-central vowel.ogg",
    path: "d/d9/Mid-central_vowel.ogg",
  },
  ey: {
    title: "Close-mid front unrounded vowel.ogg",
    path: "6/6c/Close-mid_front_unrounded_vowel.ogg",
  },
  ay: {
    title: "Open front unrounded vowel.ogg",
    path: "6/65/Open_front_unrounded_vowel.ogg",
  },
  ow: {
    title: "Close-mid back rounded vowel.ogg",
    path: "8/84/Close-mid_back_rounded_vowel.ogg",
  },
  aw: {
    title: "Open back unrounded vowel.ogg",
    path: "e/e5/Open_back_unrounded_vowel.ogg",
  },
  oy: {
    title: "Open-mid back rounded vowel.ogg",
    path: "0/02/Open-mid_back_rounded_vowel.ogg",
  },
  f: {
    title: "Voiceless labio-dental fricative.ogg",
    path: "c/c7/Voiceless_labio-dental_fricative.ogg",
  },
  v: {
    title: "Voiced labio-dental fricative.ogg",
    path: "4/42/Voiced_labio-dental_fricative.ogg",
  },
  th: {
    title: "Voiceless dental fricative.ogg",
    path: "8/80/Voiceless_dental_fricative.ogg",
  },
  dh: {
    title: "Voiced dental fricative.ogg",
    path: "6/6a/Voiced_dental_fricative.ogg",
  },
  s: {
    title: "Voiceless alveolar sibilant.ogg",
    path: "a/ac/Voiceless_alveolar_sibilant.ogg",
  },
  z: {
    title: "Voiced alveolar sibilant.ogg",
    path: "c/c0/Voiced_alveolar_sibilant.ogg",
  },
  sh: {
    title: "Voiceless palato-alveolar sibilant.ogg",
    path: "c/cc/Voiceless_palato-alveolar_sibilant.ogg",
  },
  zh: {
    title: "Voiced palato-alveolar sibilant.ogg",
    path: "3/30/Voiced_palato-alveolar_sibilant.ogg",
  },
  m: {
    title: "Bilabial nasal.ogg",
    path: "a/a9/Bilabial_nasal.ogg",
  },
  n: {
    title: "Alveolar nasal.ogg",
    path: "2/29/Alveolar_nasal.ogg",
  },
  ng: {
    title: "Velar nasal.ogg",
    path: "3/39/Velar_nasal.ogg",
  },
  l: {
    title: "Alveolar lateral approximant.ogg",
    path: "b/bc/Alveolar_lateral_approximant.ogg",
  },
  r: {
    title: "Alveolar approximant.ogg",
    path: "1/1f/Alveolar_approximant.ogg",
  },
  w: {
    title: "Voiced labio-velar approximant.ogg",
    path: "f/f2/Voiced_labio-velar_approximant.ogg",
  },
  y: {
    title: "Palatal approximant.ogg",
    path: "e/e8/Palatal_approximant.ogg",
  },
  hh: {
    title: "Voiceless glottal fricative.ogg",
    path: "d/da/Voiceless_glottal_fricative.ogg",
  },
  p: {
    title: "Voiceless bilabial plosive.ogg",
    path: "5/51/Voiceless_bilabial_plosive.ogg",
  },
  b: {
    title: "Voiced bilabial plosive.ogg",
    path: "2/2c/Voiced_bilabial_plosive.ogg",
  },
  t: {
    title: "Voiceless alveolar plosive.ogg",
    path: "0/02/Voiceless_alveolar_plosive.ogg",
  },
  d: {
    title: "Voiced alveolar plosive.ogg",
    path: "0/01/Voiced_alveolar_plosive.ogg",
  },
  k: {
    title: "Voiceless velar plosive.ogg",
    path: "e/e3/Voiceless_velar_plosive.ogg",
  },
  g: {
    title: "Voiced velar plosive 02.ogg",
    path: "1/12/Voiced_velar_plosive_02.ogg",
  },
  ch: {
    title: "Voiceless palato-alveolar affricate.ogg",
    path: "9/97/Voiceless_palato-alveolar_affricate.ogg",
  },
  jh: {
    title: "Voiced palato-alveolar affricate.ogg",
    path: "e/e6/Voiced_palato-alveolar_affricate.ogg",
  },
  ks: {
    title: "Voiceless alveolar sibilant.ogg",
    path: "a/ac/Voiceless_alveolar_sibilant.ogg",
  },
  kw: {
    title: "Voiceless velar plosive.ogg",
    path: "e/e3/Voiceless_velar_plosive.ogg",
  },
};

function findFfmpeg() {
  const which = spawnSync("where.exe", ["ffmpeg"], { encoding: "utf8" });
  if (which.status === 0) {
    const line = which.stdout.split(/\r?\n/).find(Boolean);
    if (line) return line.trim();
  }
  return "ffmpeg";
}

function toMp3(ffmpeg, inputPath, outputPath) {
  const r = spawnSync(
    ffmpeg,
    [
      "-y",
      "-i",
      inputPath,
      "-codec:a",
      "libmp3lame",
      "-qscale:a",
      "4",
      "-ac",
      "1",
      outputPath,
    ],
    { encoding: "utf8" }
  );
  if (r.status !== 0) {
    throw new Error(r.stderr?.slice(-500) || "ffmpeg failed");
  }
}

function looksLikeAudio(buf) {
  if (buf.length < 64) return false;
  // OggS / ID3 / MP3 frame sync / fLaC
  if (buf[0] === 0x4f && buf[1] === 0x67 && buf[2] === 0x67 && buf[3] === 0x53)
    return true;
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return true;
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return true;
  if (buf[0] === 0x66 && buf[1] === 0x4c && buf[2] === 0x61 && buf[3] === 0x43)
    return true;
  return false;
}

async function download(path, dest) {
  const urls = [
    `https://upload.wikimedia.org/wikipedia/commons/${path}`,
    `https://upload.wikimedia.org/wikipedia/commons/transcoded/${path}/${path.split("/").pop()}.mp3`,
  ];
  for (const url of urls) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "audio/*,*/*" },
        redirect: "follow",
      });
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) break;
      const buf = Buffer.from(await res.arrayBuffer());
      if (!looksLikeAudio(buf)) break;
      writeFileSync(dest, buf);
      return { url, bytes: buf.length };
    }
  }
  return null;
}

const ffmpeg = findFfmpeg();
console.log("ffmpeg:", ffmpeg);

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(TMP_DIR, { recursive: true });

for (const name of readdirSync(OUT_DIR)) {
  if (/\.(mp3|wav|ogg)$/i.test(name)) unlinkSync(join(OUT_DIR, name));
}

const attribution = [];
let ok = 0;
let fail = 0;

for (const [id, meta] of Object.entries(PHONEMES)) {
  const destMp3 = join(OUT_DIR, `${id}.mp3`);
  const tmp = join(TMP_DIR, `${id}.bin`);
  const hit = await download(meta.path, tmp);
  if (!hit) {
    fail++;
    console.error(`FAIL ${id} (${meta.title})`);
    await new Promise((r) => setTimeout(r, 500));
    continue;
  }
  try {
    toMp3(ffmpeg, tmp, destMp3);
    ok++;
    const wiki = meta.title.replace(/ /g, "_");
    attribution.push(
      `- \`${id}.mp3\` ← [${meta.title}](https://commons.wikimedia.org/wiki/File:${encodeURIComponent(wiki)})`
    );
    console.log(`ok  ${id}.mp3  ← ${meta.title}`);
  } catch (e) {
    fail++;
    console.error(`FAIL ${id} convert:`, e.message);
  }
  await new Promise((r) => setTimeout(r, 400));
}

rmSync(TMP_DIR, { recursive: true, force: true });

writeFileSync(
  join(OUT_DIR, "ATTRIBUTION.md"),
  `# Phoneme audio attribution

Human recordings from [Wikimedia Commons](https://commons.wikimedia.org/),
used under **CC BY-SA 3.0** (and/or GFDL) as stated on each file page.

Many samples are IPA chart recordings by **Denelson83** and other Commons contributors.

Regenerate (requires \`ffmpeg\` on PATH):

\`\`\`bash
npm run fetch:phonemes
\`\`\`

## Files

${attribution.join("\n")}
`
);

writeFileSync(
  join(OUT_DIR, "README.md"),
  `# Phoneme sounds (human recordings)

MP3s converted from Wikimedia Commons IPA pronunciation samples (human voice).

\`\`\`bash
npm run fetch:phonemes
\`\`\`

See [ATTRIBUTION.md](./ATTRIBUTION.md) for sources and license.
`
);

console.log(`\nDone: ${ok} ok, ${fail} failed → ${OUT_DIR}`);
if (fail) process.exitCode = 1;
