# learntoread

A TTS app for teaching kids to read, using HTML and JavaScript.

## Letter sounds

Tapping a letter plays an isolated phoneme from `sounds/phonemes/`, generated with
[klattsch](https://github.com/chewieglass-labs/klattsch) (MIT) — a Klatt-style
formant synthesizer that produces real vowel and consonant sounds (not letter names).

Regenerate the bank:

```bash
npm run generate:phonemes
```

Whole-word speech still uses the browser voice (Voice settings). The scrub slider
builds the spoken word; letter tiles play phonemes.

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
