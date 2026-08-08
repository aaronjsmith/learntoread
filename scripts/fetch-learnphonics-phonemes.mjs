/**
 * Download LearnPhonics.co phoneme WAVs and convert to our CMU-style MP3 ids.
 *
 * License: LearnPhonics.co does not publish a clear redistribution license.
 * Do not run this (or commit the resulting MP3s) unless you have permission
 * from the site operators (editors@learnphonics.co). See
 * sounds/phonemes/LEARNPHONICS.md.
 *
 *   node scripts/fetch-learnphonics-phonemes.mjs --i-have-permission
 */
import {
  mkdirSync,
  writeFileSync,
  existsSync,
  rmSync,
  unlinkSync,
  readdirSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "sounds", "phonemes");
const TMP_DIR = join(OUT_DIR, "_tmp_learnphonics");
const BASE = "https://learnphonics.co/audio/phonemes/";
const UA =
  "Mozilla/5.0 (compatible; learntoread-phonemes/1.0; educational; +https://github.com/aaronjsmith/learntoread)";

/**
 * Our app phoneme id → LearnPhonics IPA WAV name(s).
 * Composite sounds (q/x) are concatenated in order.
 */
const PHONEME_TO_WAV = {
  ae: "æ.wav",
  eh: "ɛ.wav",
  ih: "ɪ.wav",
  aa: "ɒ.wav",
  ao: "ɔː.wav",
  ah: "ʌ.wav",
  uh: "ʊ.wav",
  uw: "uː.wav",
  er: "ɜː.wav",
  ey: "eɪ.wav",
  ay: "aɪ.wav",
  ow: "oʊ.wav",
  aw: "aʊ.wav",
  oy: "ɔɪ.wav",
  iy: "iː.wav",
  f: "f.wav",
  v: "v.wav",
  th: "θ.wav",
  dh: "ð.wav",
  s: "s.wav",
  z: "z.wav",
  sh: "ʃ.wav",
  zh: "ʒ.wav",
  m: "m.wav",
  n: "n.wav",
  ng: "ŋ.wav",
  l: "l.wav",
  r: "r.wav",
  w: "w.wav",
  y: "j.wav",
  hh: "h.wav",
  p: "p.wav",
  b: "b.wav",
  t: "t.wav",
  d: "d.wav",
  k: "k.wav",
  g: "ɡ.wav",
  ch: "tʃ.wav",
  jh: "dʒ.wav",
  ks: ["k.wav", "s.wav"],
  kw: ["k.wav", "w.wav"],
};

/** Chart tiles that have no dedicated file on learnphonics (keep Wikimedia). */
const UNSUPPORTED = {
  ax: "No ə.wav on the public phonics-sounds chart (schwa).",
};

function findFfmpeg() {
  const which = spawnSync("where.exe", ["ffmpeg"], { encoding: "utf8" });
  if (which.status === 0) {
    const line = which.stdout.split(/\r?\n/).find(Boolean);
    if (line) return line.trim();
  }
  return "ffmpeg";
}

function toMp3(ffmpeg, inputs, outputPath) {
  const args = ["-y"];
  for (const input of inputs) {
    args.push("-i", input);
  }
  if (inputs.length === 1) {
    args.push("-codec:a", "libmp3lame", "-qscale:a", "4", "-ac", "1", outputPath);
  } else {
    // q (/k/+ /w/) and x (/k/+ /s/) — filter concat is reliable on Windows.
    const labels = inputs.map((_, i) => `[${i}:a]`).join("");
    args.push(
      "-filter_complex",
      `${labels}concat=n=${inputs.length}:v=0:a=1[a]`,
      "-map",
      "[a]",
      "-codec:a",
      "libmp3lame",
      "-qscale:a",
      "4",
      "-ac",
      "1",
      outputPath
    );
  }
  const r = spawnSync(ffmpeg, args, { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(r.stderr?.slice(-500) || "ffmpeg failed");
  }
}

function looksLikeWav(buf) {
  return (
    buf.length > 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x41 &&
    buf[10] === 0x56 &&
    buf[11] === 0x45
  );
}

async function downloadWav(name, dest) {
  const url = BASE + encodeURIComponent(name);
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "audio/wav,audio/*,*/*",
        Referer: "https://learnphonics.co/phonics-sounds",
      },
      redirect: "follow",
    });
    if (res.status === 429 || res.status === 403) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!looksLikeWav(buf)) return null;
    writeFileSync(dest, buf);
    return { url, bytes: buf.length };
  }
  return null;
}

if (!process.argv.includes("--i-have-permission")) {
  console.error(`Refusing to download LearnPhonics.co audio.

LearnPhonics.co does not publish a clear license to redistribute or hotlink
their phoneme recordings in third-party apps. Contact editors@learnphonics.co
for permission, then re-run:

  node scripts/fetch-learnphonics-phonemes.mjs --i-have-permission

See sounds/phonemes/LEARNPHONICS.md.
`);
  process.exit(1);
}

const ffmpeg = findFfmpeg();
console.log("ffmpeg:", ffmpeg);
console.log(
  "WARNING: Only proceed if you have redistribution permission from LearnPhonics.co.\n"
);

mkdirSync(OUT_DIR, { recursive: true });
if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true, force: true });
mkdirSync(TMP_DIR, { recursive: true });

const wavCache = new Map();
let ok = 0;
let fail = 0;
const attribution = [];

for (const [id, wavSpec] of Object.entries(PHONEME_TO_WAV)) {
  const names = Array.isArray(wavSpec) ? wavSpec : [wavSpec];
  const localPaths = [];
  let missed = false;
  for (const name of names) {
    let local = wavCache.get(name);
    if (!local) {
      local = join(TMP_DIR, Buffer.from(name, "utf8").toString("hex") + ".wav");
      const hit = await downloadWav(name, local);
      if (!hit) {
        console.error(`FAIL download ${id} ← ${name}`);
        missed = true;
        break;
      }
      wavCache.set(name, local);
      console.log(`got  ${name}  (${hit.bytes} bytes)`);
      await new Promise((r) => setTimeout(r, 250));
    }
    localPaths.push(local);
  }
  if (missed) {
    fail++;
    continue;
  }
  const destMp3 = join(OUT_DIR, `${id}.mp3`);
  try {
    toMp3(ffmpeg, localPaths, destMp3);
    ok++;
    attribution.push(
      `- \`${id}.mp3\` ← \`${names.join(" + ")}\` ([phonics-sounds](https://learnphonics.co/phonics-sounds))`
    );
    console.log(`ok   ${id}.mp3  ← ${names.join(" + ")}`);
  } catch (e) {
    fail++;
    console.error(`FAIL ${id} convert:`, e.message);
  }
}

rmSync(TMP_DIR, { recursive: true, force: true });

// Drop stale temp dirs from older fetch runs.
for (const name of readdirSync(OUT_DIR)) {
  if (name === "_tmp" || name.startsWith("_tmp_")) {
    rmSync(join(OUT_DIR, name), { recursive: true, force: true });
  }
}

const noteLines = Object.entries(UNSUPPORTED)
  .map(([id, why]) => `- \`${id}.mp3\` — ${why} (kept from Wikimedia if present)`)
  .join("\n");

writeFileSync(
  join(OUT_DIR, "ATTRIBUTION.md"),
  `# Phoneme audio attribution

## Primary source (when this fetch was used)

Recordings from [LearnPhonics.co — Phonics Sounds](https://learnphonics.co/phonics-sounds)
(\`/audio/phonemes/*.wav\`, converted to MP3).

**License:** Only include these files in the app if you have explicit permission
from LearnPhonics.co (\`editors@learnphonics.co\`). The public site does not
state a Creative Commons or similar redistribution license.

Regenerate (requires permission + \`ffmpeg\`):

\`\`\`bash
npm run fetch:learnphonics -- --i-have-permission
\`\`\`

### Mapped files

${attribution.join("\n")}

### Not available from LearnPhonics chart

${noteLines}

## Fallback source

Unmapped ids (e.g. schwa \`ax\`) may still use Wikimedia Commons IPA samples
via \`npm run fetch:phonemes\` (CC BY-SA). See git history for the previous
Commons file list if you need to restore it.
`
);

console.log(`\nDone: ${ok} ok, ${fail} failed → ${OUT_DIR}`);
if (fail) process.exitCode = 1;
