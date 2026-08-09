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

## Google progress sync (Firebase)

Progress still saves to **localStorage** and JSON Save/Load. Optionally, learners can
**Sign in with Google** so the same progress follows them across devices.

**Approach:** Firebase Authentication (Google) + Cloud Firestore — one document per
user at `progress/{uid}`. No Cloudflare auth bindings are used (Workers only
serves the static site).

**Merge rule (cloud ↔ local on sign-in):** mastery maps and story flags are
**smart-merged** (max of phonics counters, OR of sight/story flags, max of
indices). Voice/name/rate-style settings prefer the payload with the newer
`savedAt`. After merge, the result is written to localStorage and uploaded.
While signed in, local progress changes **debounce-upload** (~1.5s) to Firestore.

### Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Add a **Web** app and copy the config object.
3. Enable **Authentication → Sign-in method → Google**.
4. Create a **Firestore** database (production mode is fine if you paste rules below).
5. Put the web config into `firebase-config.js` (or copy
   `firebase-config.example.js`). Client Firebase config is public by design —
   **never** commit service-account private keys.
6. Authorized domains (Authentication → Settings): add `localhost`, your
   Workers preview host, and `learntoread.top` (or your custom domain).
7. Firestore rules (only the signed-in owner can read/write their doc):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /progress/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### Config keys (`firebase-config.js`)

| Key | Notes |
| --- | --- |
| `apiKey` | Web API key |
| `authDomain` | Usually `YOUR_PROJECT_ID.firebaseapp.com` |
| `projectId` | Firebase project id |
| `storageBucket` | Optional for this app; set from console |
| `messagingSenderId` | From console |
| `appId` | Web app id |

Until `apiKey`, `authDomain`, `projectId`, and `appId` are real values (not
`YOUR_*` placeholders), the Google header button stays **hidden**.

Optional local override (gitignored): `firebase-config.local.js` — load it after
`firebase-config.js` in `index.html` while developing.

### Files

- `firebase-config.js` — client config (placeholders until you fill them in)
- `cloud-sync.js` — Firebase modular SDK (CDN) + Auth/Firestore helpers
- `app.js` — merge, debounce upload, header Sign in / Sign out UX
