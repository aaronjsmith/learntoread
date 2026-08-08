# LearnPhonics.co letter sounds

Inspected: [https://learnphonics.co/phonics-sounds](https://learnphonics.co/phonics-sounds) (2026-08-08).

## How sounds are hosted

| Item | Detail |
| --- | --- |
| Format | WAV (`audio/wav`) |
| URL pattern | `https://learnphonics.co/audio/phonemes/{encodeURIComponent(filename)}` |
| Page wiring | Buttons use `data-wav` (e.g. `æ.wav`, `k.wav+w.wav`); click handler plays `new Audio('/audio/phonemes/…')` |
| CORS | Responses include `Access-Control-Allow-Origin: *` (hotlink technically works in a browser) |
| Bot protection | Bare requests may get HTTP 403; browser-like `User-Agent` + `Referer: …/phonics-sounds` succeed |

Filenames are **IPA symbols**, not English letter names (e.g. short A is `æ.wav`, /ʃ/ is `ʃ.wav`, hard G is `ɡ.wav`).

Composite letters on the A–Z chart:

- **q** → `k.wav` then `w.wav`
- **x** → `k.wav` then `s.wav`

## Graphemes / chart coverage

**A–Z tiles (primary letter sounds):** a æ, b, c→k, d, e ɛ, f, g ɡ, h, i ɪ, j dʒ, k, l, m, n, o ɒ, p, q k+w, r, s, t, u ʌ, v, w, x k+s, y j, z.

**Extra sound tiles:** short vowels; long ai/ee/ie/oa/ue; oo (uː / ʊ); ow aʊ; oi ɔɪ; aw ɔː; ar ɑː; or ɔː; er ɜː; air eə; ear ɪə; sh/ch/th(θ)/th(ð)/ng/zh.

Schwa (**ə**) is discussed on the page but **no `ə.wav`** appears on the interactive chart — our `ax` id has no LearnPhonics source.

## License conclusion

**Redistribution and hotlinking are not clearly allowed.**

- No Terms of Use (or Creative Commons / similar) granting third-party apps the right to copy or rehost the WAVs.
- `/about` describes a free educational reference site; that is not a content license.
- `robots.txt` Content-Signal (`use=reference`) addresses AI crawling, not app redistribution of audio.
- Contact for permission: **editors@learnphonics.co**.

Until permission is granted, this repo **keeps Wikimedia Commons** MP3s (CC BY-SA) as the playable assets and does **not** commit LearnPhonics audio.

## Mapping onto our phoneme ids

App playback uses `sounds/phonemes/{id}.mp3` (see `app.js` + `data/words.json`). LearnPhonics IPA → our ids:

| Our id | LearnPhonics WAV | Teaching example |
| --- | --- | --- |
| `ae` | `æ.wav` | a / apple, cat |
| `eh` | `ɛ.wav` | e / egg, bed |
| `ih` | `ɪ.wav` | i / ink, sit |
| `aa` | `ɒ.wav` | o / orange, dog |
| `ah` | `ʌ.wav` | u / umbrella, cup |
| `ao` | `ɔː.wav` | aw / claw; or / corn |
| `iy` | `iː.wav` | ee / tree |
| `ey` | `eɪ.wav` | ai / rain |
| `ay` | `aɪ.wav` | ie / kite |
| `ow` | `oʊ.wav` | oa / boat |
| `uw` | `uː.wav` | oo / moon |
| `uh` | `ʊ.wav` | oo / book |
| `aw` | `aʊ.wav` | ow / cow |
| `oy` | `ɔɪ.wav` | oi / boy |
| `er` | `ɜː.wav` | er / her |
| `th` | `θ.wav` | th / think |
| `dh` | `ð.wav` | th / that |
| `sh` | `ʃ.wav` | sh / ship |
| `ch` | `tʃ.wav` | ch / chip |
| `zh` | `ʒ.wav` | zh / measure |
| `ng` | `ŋ.wav` | ng / ring |
| `jh` | `dʒ.wav` | j / jam |
| `hh` | `h.wav` | h / hat |
| `y` | `j.wav` | y / yes |
| `g` | `ɡ.wav` | g / goat |
| `k` | `k.wav` | c/k |
| `ks` | `k.wav` + `s.wav` | x / fox |
| `kw` | `k.wav` + `w.wav` | q / queen |
| consonants `b d f l m n p r s t v w z` | same letter `.wav` | — |
| `ax` | *(none)* | schwa — keep Wikimedia |

Not used by our current word list (no dedicated id): `ɑː` (ar), `eə` (air), `ɪə` (ear), `juː` (ue / cube).

## After you get permission

```bash
npm run fetch:learnphonics -- --i-have-permission
```

This downloads the WAVs, converts/concatenates to MP3 under `sounds/phonemes/`, and rewrites `ATTRIBUTION.md`. Precaching in `app.js` keeps working because paths stay `{id}.mp3`.

To restore Commons-only samples:

```bash
npm run fetch:phonemes
```
