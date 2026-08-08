# Phoneme audio attribution

## Active files in this repo

Human recordings from [Wikimedia Commons](https://commons.wikimedia.org/),
used under **CC BY-SA 3.0** (and/or GFDL) as stated on each file page.

Many samples are IPA chart recordings by **Denelson83** and other Commons contributors.

Regenerate (requires `ffmpeg` on PATH):

```bash
npm run fetch:phonemes
```

## Preferred future source (not redistributed yet)

[LearnPhonics.co phonics sounds](https://learnphonics.co/phonics-sounds) hosts clear
classroom-style letter/phoneme WAVs under `/audio/phonemes/`. **No public
redistribution license was found** — do not vendor or hotlink those files until
permission is granted (`editors@learnphonics.co`).

Mapping, hosting details, and a permission-gated fetch script:

- [LEARNPHONICS.md](./LEARNPHONICS.md)
- `npm run fetch:learnphonics -- --i-have-permission` (only after permission)

## Wikimedia file list

- `iy.mp3` ← [Close front unrounded vowel.ogg](https://commons.wikimedia.org/wiki/File:Close_front_unrounded_vowel.ogg)
- `ih.mp3` ← [Near-close near-front unrounded vowel.ogg](https://commons.wikimedia.org/wiki/File:Near-close_near-front_unrounded_vowel.ogg)
- `eh.mp3` ← [Open-mid front unrounded vowel.ogg](https://commons.wikimedia.org/wiki/File:Open-mid_front_unrounded_vowel.ogg)
- `ae.mp3` ← [Near-open front unrounded vowel.ogg](https://commons.wikimedia.org/wiki/File:Near-open_front_unrounded_vowel.ogg)
- `aa.mp3` ← [Open back unrounded vowel.ogg](https://commons.wikimedia.org/wiki/File:Open_back_unrounded_vowel.ogg)
- `ao.mp3` ← [Open-mid back rounded vowel.ogg](https://commons.wikimedia.org/wiki/File:Open-mid_back_rounded_vowel.ogg)
- `ah.mp3` ← [Open-mid back unrounded vowel.ogg](https://commons.wikimedia.org/wiki/File:Open-mid_back_unrounded_vowel.ogg)
- `uh.mp3` ← [Near-close near-back rounded vowel.ogg](https://commons.wikimedia.org/wiki/File:Near-close_near-back_rounded_vowel.ogg)
- `uw.mp3` ← [Close back rounded vowel.ogg](https://commons.wikimedia.org/wiki/File:Close_back_rounded_vowel.ogg)
- `er.mp3` ← [Open-mid central unrounded vowel.ogg](https://commons.wikimedia.org/wiki/File:Open-mid_central_unrounded_vowel.ogg)
- `ax.mp3` ← [Mid-central vowel.ogg](https://commons.wikimedia.org/wiki/File:Mid-central_vowel.ogg)
- `ey.mp3` ← [Close-mid front unrounded vowel.ogg](https://commons.wikimedia.org/wiki/File:Close-mid_front_unrounded_vowel.ogg)
- `ay.mp3` ← [Open front unrounded vowel.ogg](https://commons.wikimedia.org/wiki/File:Open_front_unrounded_vowel.ogg)
- `ow.mp3` ← [Close-mid back rounded vowel.ogg](https://commons.wikimedia.org/wiki/File:Close_mid_back_rounded_vowel.ogg)
- `aw.mp3` ← [Open back unrounded vowel.ogg](https://commons.wikimedia.org/wiki/File:Open_back_unrounded_vowel.ogg)
- `oy.mp3` ← [Open-mid back rounded vowel.ogg](https://commons.wikimedia.org/wiki/File:Open-mid_back_rounded_vowel.ogg)
- `f.mp3` ← [Voiceless labio-dental fricative.ogg](https://commons.wikimedia.org/wiki/File:Voiceless_labio-dental_fricative.ogg)
- `v.mp3` ← [Voiced labio-dental fricative.ogg](https://commons.wikimedia.org/wiki/File:Voiced_labio-dental_fricative.ogg)
- `th.mp3` ← [Voiceless dental fricative.ogg](https://commons.wikimedia.org/wiki/File:Voiceless_dental_fricative.ogg)
- `dh.mp3` ← [Voiced dental fricative.ogg](https://commons.wikimedia.org/wiki/File:Voiced_dental_fricative.ogg)
- `s.mp3` ← [Voiceless alveolar sibilant.ogg](https://commons.wikimedia.org/wiki/File:Voiceless_alveolar_sibilant.ogg)
- `z.mp3` ← [Voiced alveolar sibilant.ogg](https://commons.wikimedia.org/wiki/File:Voiced_alveolar_sibilant.ogg)
- `sh.mp3` ← [Voiceless palato-alveolar sibilant.ogg](https://commons.wikimedia.org/wiki/File:Voiceless_palato-alveolar_sibilant.ogg)
- `zh.mp3` ← [Voiced palato-alveolar sibilant.ogg](https://commons.wikimedia.org/wiki/File:Voiced_palato-alveolar_sibilant.ogg)
- `m.mp3` ← [Bilabial nasal.ogg](https://commons.wikimedia.org/wiki/File:Bilabial_nasal.ogg)
- `n.mp3` ← [Alveolar nasal.ogg](https://commons.wikimedia.org/wiki/File:Alveolar_nasal.ogg)
- `ng.mp3` ← [Velar nasal.ogg](https://commons.wikimedia.org/wiki/File:Velar_nasal.ogg)
- `l.mp3` ← [Alveolar lateral approximant.ogg](https://commons.wikimedia.org/wiki/File:Alveolar_lateral_approximant.ogg)
- `r.mp3` ← [Alveolar approximant.ogg](https://commons.wikimedia.org/wiki/File:Alveolar_approximant.ogg)
- `w.mp3` ← [Voiced labio-velar approximant.ogg](https://commons.wikimedia.org/wiki/File:Voiced_labio-velar_approximant.ogg)
- `y.mp3` ← [Palatal approximant.ogg](https://commons.wikimedia.org/wiki/File:Palatal_approximant.ogg)
- `hh.mp3` ← [Voiceless glottal fricative.ogg](https://commons.wikimedia.org/wiki/File:Voiceless_glottal_fricative.ogg)
- `p.mp3` ← [Voiceless bilabial plosive.ogg](https://commons.wikimedia.org/wiki/File:Voiceless_bilabial_plosive.ogg)
- `b.mp3` ← [Voiced bilabial plosive.ogg](https://commons.wikimedia.org/wiki/File:Voiced_bilabial_plosive.ogg)
- `t.mp3` ← [Voiceless alveolar plosive.ogg](https://commons.wikimedia.org/wiki/File:Voiceless_alveolar_plosive.ogg)
- `d.mp3` ← [Voiced alveolar plosive.ogg](https://commons.wikimedia.org/wiki/File:Voiced_alveolar_plosive.ogg)
- `k.mp3` ← [Voiceless velar plosive.ogg](https://commons.wikimedia.org/wiki/File:Voiceless_velar_plosive.ogg)
- `g.mp3` ← [Voiced velar plosive 02.ogg](https://commons.wikimedia.org/wiki/File:Voiced_velar_plosive_02.ogg)
- `ch.mp3` ← [Voiceless palato-alveolar affricate.ogg](https://commons.wikimedia.org/wiki/File:Voiceless_palato-alveolar_affricate.ogg)
- `jh.mp3` ← [Voiced palato-alveolar affricate.ogg](https://commons.wikimedia.org/wiki/File:Voiced_palato-alveolar_affricate.ogg)
- `ks.mp3` ← [Voiceless alveolar sibilant.ogg](https://commons.wikimedia.org/wiki/File:Voiceless_alveolar_sibilant.ogg)
- `kw.mp3` ← [Voiceless velar plosive.ogg](https://commons.wikimedia.org/wiki/File:Voiceless_velar_plosive.ogg)
