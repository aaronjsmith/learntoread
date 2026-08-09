/**
 * Google sign-in + Firestore progress sync for Ellie Reads.
 * Uses the Firebase modular SDK from CDN (no bundler).
 *
 * Document path: progress/{uid} — one JSON progress payload per user.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const PLACEHOLDER_RE = /YOUR_|REPLACE_ME/i;

function configLooksReady(cfg) {
  if (!cfg || typeof cfg !== "object") return false;
  const required = ["apiKey", "authDomain", "projectId", "appId"];
  return required.every((key) => {
    const val = cfg[key];
    return typeof val === "string" && val.trim() && !PLACEHOLDER_RE.test(val);
  });
}

let app = null;
let auth = null;
let db = null;
let initTried = false;

function isConfigured() {
  return configLooksReady(window.ELLIE_FIREBASE_CONFIG);
}

function ensureInit() {
  if (app && auth && db) return true;
  if (initTried) return !!(app && auth && db);
  initTried = true;
  if (!isConfigured()) return false;
  try {
    app = initializeApp(window.ELLIE_FIREBASE_CONFIG);
    auth = getAuth(app);
    db = getFirestore(app);
    return true;
  } catch (err) {
    console.warn("Ellie cloud sync: Firebase init failed", err);
    app = null;
    auth = null;
    db = null;
    return false;
  }
}

function progressRef(uid) {
  return doc(db, "progress", uid);
}

async function signInWithGoogle() {
  if (!ensureInit()) {
    throw new Error("Firebase is not configured");
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(auth, provider);
}

async function signOutUser() {
  if (!ensureInit()) return;
  await signOut(auth);
}

function onAuthChange(callback) {
  if (!ensureInit()) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

function getCurrentUser() {
  if (!ensureInit()) return null;
  return auth.currentUser;
}

/**
 * @returns {Promise<object|null>} progress payload or null if missing
 */
async function loadRemoteProgress(uid) {
  if (!ensureInit() || !uid) return null;
  const snap = await getDoc(progressRef(uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!data || typeof data !== "object") return null;
  // Stored either as { progress: {...} } or flat payload fields.
  if (data.progress && typeof data.progress === "object") return data.progress;
  return data;
}

async function saveRemoteProgress(uid, payload) {
  if (!ensureInit() || !uid || !payload) return;
  await setDoc(
    progressRef(uid),
    {
      progress: payload,
      updatedAt: new Date().toISOString(),
      uid,
    },
    { merge: true }
  );
}

window.EllieCloud = {
  isConfigured,
  ensureInit,
  signInWithGoogle,
  signOutUser,
  onAuthChange,
  getCurrentUser,
  loadRemoteProgress,
  saveRemoteProgress,
};
