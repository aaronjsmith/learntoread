# learntoread

A TTS app for teaching kids to read, using HTML and JavaScript.

## Letter sounds

Tap a letter to hear its **sound** (not its name). Slide under the word to blend
those sounds in order — same idea as blending trainers like Lotty Learns. Tap the
word itself to hear it spoken whole (browser voice).

Phoneme MP3s in `sounds/phonemes/` are **human recordings** from
[Wikimedia Commons](https://commons.wikimedia.org/) (CC BY-SA). See
`sounds/phonemes/ATTRIBUTION.md`.

[LearnPhonics.co](https://learnphonics.co/phonics-sounds) has clearer phonics
letter sounds, but **no public redistribution license** was found — mapping and
a permission-gated fetch live in `sounds/phonemes/LEARNPHONICS.md`.

Regenerate Commons samples (requires `ffmpeg` on PATH):

```bash
npm run fetch:phonemes
```

After LearnPhonics permission:

```bash
npm run fetch:learnphonics -- --i-have-permission
```


## Deploy (Cloudflare Workers)

```bash
npm install
npm run deploy
```

Local preview:

```bash
npm run dev
```

Custom domain (after first deploy): Cloudflare Dashboard → Workers & Pages → **learntoread** → Custom domains → add `learntoread.top`.
