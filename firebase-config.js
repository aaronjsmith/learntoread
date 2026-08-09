/**
 * Ellie Reads — Firebase client config (public).
 *
 * Fill in values from Firebase Console → Project settings → Your apps.
 * Client config is safe to expose in the browser; never put service-account
 * private keys here.
 *
 * Until apiKey / authDomain / projectId / appId are real values (not YOUR_*),
 * Google sync stays hidden and disabled.
 *
 * Optional local override: create firebase-config.local.js (gitignored) with the
 * same shape and load it after this file in index.html while developing.
 */
window.ELLIE_FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
