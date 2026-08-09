(function () {
  "use strict";

  const LS_USER_NAME = "learntoread_userName";
  const LS_PREVIEW_TEXT = "learntoread_previewText";
  const LS_PROGRESS = "learntoread_progress";
  const DEFAULT_PREVIEW_TEXT = "Hello! I will help you read.";
  /** Debounce window for uploading progress to Firestore after local changes. */
  const CLOUD_UPLOAD_DEBOUNCE_MS = 1500;

  const DEFAULT_WORDS = [
    { word: "hat", letters: ["H", "A", "T"], phonemes: ["hh", "ae", "t"] },
    {
      word: "the",
      letters: ["TH", "E"],
      phonemes: ["dh", "ax"],
      sounds: ["thuh", "uh"],
    },
    { word: "and", letters: ["A", "N", "D"], phonemes: ["ae", "n", "d"] },
    { word: "a", letters: ["A"], phonemes: ["ax"] },
    { word: "to", letters: ["T", "O"], phonemes: ["t", "uw"] },
    { word: "is", letters: ["I", "S"], phonemes: ["ih", "z"] },
    { word: "you", letters: ["Y", "OU"], phonemes: ["y", "uw"] },
    { word: "it", letters: ["I", "T"], phonemes: ["ih", "t"] },
    { word: "in", letters: ["I", "N"], phonemes: ["ih", "n"] },
    { word: "said", letters: ["S", "AI", "D"], phonemes: ["s", "eh", "d"] },
    { word: "for", letters: ["F", "OR"], phonemes: ["f", "er"] },
    { word: "up", letters: ["U", "P"], phonemes: ["ah", "p"] },
    { word: "look", letters: ["L", "OO", "K"], phonemes: ["l", "uh", "k"] },
    { word: "go", letters: ["G", "O"], phonemes: ["g", "ow"] },
    { word: "we", letters: ["W", "E"], phonemes: ["w", "iy"] },
    { word: "can", letters: ["C", "A", "N"], phonemes: ["k", "ae", "n"] },
    { word: "see", letters: ["S", "EE"], phonemes: ["s", "iy"] },
    { word: "my", letters: ["M", "Y"], phonemes: ["m", "ay"] },
    { word: "like", letters: ["L", "I", "KE"], phonemes: ["l", "ay", "k"] },
    { word: "at", letters: ["A", "T"], phonemes: ["ae", "t"] },
    { word: "play", letters: ["P", "L", "AY"], phonemes: ["p", "l", "ey"] },
  ];

  /** Primary phonics sound for a grapheme when the word has no phonemes list. */
  const DEFAULT_GRAPHEME_PHONEME = {
    a: "ae",
    e: "eh",
    i: "ih",
    o: "aa",
    u: "ah",
    b: "b",
    c: "k",
    d: "d",
    f: "f",
    g: "g",
    h: "hh",
    j: "jh",
    k: "k",
    l: "l",
    m: "m",
    n: "n",
    p: "p",
    q: "kw",
    r: "r",
    s: "s",
    t: "t",
    v: "v",
    w: "w",
    x: "ks",
    y: "y",
    z: "z",
    th: "th",
    sh: "sh",
    ch: "ch",
    wh: "w",
    ck: "k",
    ng: "ng",
    nk: "ng",
    ph: "f",
    qu: "kw",
    tch: "ch",
    dge: "jh",
    ee: "iy",
    ea: "iy",
    oo: "uw",
    oa: "ow",
    ai: "ey",
    ay: "ey",
    oy: "oy",
    oi: "oy",
    ow: "ow",
    ou: "aw",
    igh: "ay",
    eigh: "ey",
    ar: "aa",
    er: "er",
    ir: "er",
    or: "er",
    ur: "er",
    kn: "n",
    wr: "r",
    gn: "n",
    ss: "s",
    ll: "l",
    ff: "f",
    zz: "z",
  };

  /** A–Z letter-sound curriculum (primary phonics sounds). */
  const PHONICS_LETTERS = [
    { id: "a", letter: "A", phoneme: "ae", example: "apple", emoji: "🍎" },
    { id: "b", letter: "B", phoneme: "b", example: "ball", emoji: "🏀" },
    { id: "c", letter: "C", phoneme: "k", example: "cat", emoji: "🐱" },
    { id: "d", letter: "D", phoneme: "d", example: "dog", emoji: "🐶" },
    { id: "e", letter: "E", phoneme: "eh", example: "egg", emoji: "🥚" },
    { id: "f", letter: "F", phoneme: "f", example: "fish", emoji: "🐟" },
    { id: "g", letter: "G", phoneme: "g", example: "goat", emoji: "🐐" },
    { id: "h", letter: "H", phoneme: "hh", example: "hat", emoji: "🎩" },
    { id: "i", letter: "I", phoneme: "ih", example: "igloo", emoji: "🧊" },
    { id: "j", letter: "J", phoneme: "jh", example: "jam", emoji: "🫙" },
    { id: "k", letter: "K", phoneme: "k", example: "kite", emoji: "🪁" },
    { id: "l", letter: "L", phoneme: "l", example: "leaf", emoji: "🍃" },
    { id: "m", letter: "M", phoneme: "m", example: "moon", emoji: "🌙" },
    { id: "n", letter: "N", phoneme: "n", example: "nest", emoji: "🪺" },
    { id: "o", letter: "O", phoneme: "aa", example: "octopus", emoji: "🐙" },
    { id: "p", letter: "P", phoneme: "p", example: "pig", emoji: "🐷" },
    { id: "q", letter: "Q", phoneme: "kw", example: "queen", emoji: "👑" },
    { id: "r", letter: "R", phoneme: "r", example: "rain", emoji: "🌧️" },
    { id: "s", letter: "S", phoneme: "s", example: "sun", emoji: "☀️" },
    { id: "t", letter: "T", phoneme: "t", example: "tiger", emoji: "🐯" },
    { id: "u", letter: "U", phoneme: "ah", example: "umbrella", emoji: "☂️" },
    { id: "v", letter: "V", phoneme: "v", example: "van", emoji: "🚐" },
    { id: "w", letter: "W", phoneme: "w", example: "web", emoji: "🕸️" },
    { id: "x", letter: "X", phoneme: "ks", example: "fox", emoji: "🦊" },
    { id: "y", letter: "Y", phoneme: "y", example: "yo-yo", emoji: "🪀" },
    { id: "z", letter: "Z", phoneme: "z", example: "zebra", emoji: "🦓" },
  ];

  const PHONEME_AUDIO_BASE = "sounds/phonemes/";
  const SFX_BASE = "sounds/sfx/";
  const phonemeAudioCache = new Map();
  const sfxAudioCache = new Map();
  let activePhonemeAudio = null;
  let activeSfxAudio = null;
  let phonicsQuizMode = false;
  let phonicsListenMode = false;
  /** Current visible main screen name (`home`, `phonics`, …). */
  let activeScreenName = "";
  /** Last instruction key auto-spoken for this screen visit (anti-spam). */
  let lastAutoSpokenInstructionKey = "";
  /** Queued line if voices are not ready yet. */
  let pendingInstructionText = null;

  const SpeechRecognitionAPI =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  const SpeechGrammarListAPI =
    typeof window !== "undefined"
      ? window.SpeechGrammarList || window.webkitSpeechGrammarList
      : null;

  let activeRecognition = null;
  let sayWordListening = false;
  let lastPhonicsUiIndex = -1;

  /**
   * Longest-match-first patterns for splitting words into graphemes when JSON
   * has no `letters` array (e.g. "the" → ["TH","E"], "ship" → ["SH","I","P"]).
   */
  const GRAPHEME_PATTERNS = (() => {
    const raw = [
      "tch",
      "dge",
      "eigh",
      "igh",
      "ch",
      "sh",
      "th",
      "wh",
      "ck",
      "ng",
      "nk",
      "ph",
      "qu",
      "ss",
      "ll",
      "ff",
      "zz",
      "ar",
      "er",
      "ir",
      "or",
      "ur",
      "ai",
      "ay",
      "ea",
      "ee",
      "oa",
      "oo",
      "ou",
      "ow",
      "oi",
      "oy",
      "kn",
      "wr",
      "gn",
    ];
    return [...new Set(raw)].sort((a, b) => b.length - a.length);
  })();

  let voices = [];
  let filteredVoices = [];
  let sightWords = [];
  let stories = [];
  let activeStoryId = "";
  let storyReading = false;
  let storyReadGen = 0;
  let storyKaraokeActiveEl = null;
  let storyKaraokeTimerIds = [];

  const STORY_LEVELS = ["beginner", "advanced"];
  const STORY_LEVEL_SPEAK = {
    beginner: "Easy",
    advanced: "Longer",
  };

  const state = {
    userName: "",
    previewText: DEFAULT_PREVIEW_TEXT,
    sightWordIndex: 0,
    phonicsIndex: 0,
    phonicsMastery: {},
    sightMastery: {},
    storiesProgress: {},
    storyReadingLevel: "beginner",
    region: "",
    onlineOnly: true,
    gender: "both",
    voiceName: "",
    rate: 0.95,
    pitch: 1.05,
    scrubIndex: 0,
  };

  const els = {};

  /** @type {import("firebase/auth").User | null} */
  let cloudUser = null;
  let cloudUploadTimer = null;
  let cloudSyncPaused = false;
  let cloudAuthSpeakPending = false;
  let cloudAuthReady = false;

  function $(id) {
    return document.getElementById(id);
  }

  function getEllieCloud() {
    return typeof window !== "undefined" ? window.EllieCloud : null;
  }

  function persistUserName(name) {
    const t = String(name || "").trim();
    try {
      if (t) localStorage.setItem(LS_USER_NAME, t);
      else localStorage.removeItem(LS_USER_NAME);
    } catch (_) {}
  }

  function persistPreviewText(text) {
    const t = String(text || "").trim() || DEFAULT_PREVIEW_TEXT;
    state.previewText = t;
    try {
      localStorage.setItem(LS_PREVIEW_TEXT, t);
    } catch (_) {}
  }

  function loadPersistedProfile() {
    try {
      const u = localStorage.getItem(LS_USER_NAME);
      if (u != null) {
        const t = String(u).trim();
        if (t) state.userName = t;
      }
    } catch (_) {}
    try {
      const p = localStorage.getItem(LS_PREVIEW_TEXT);
      if (p != null && String(p).trim()) state.previewText = String(p).trim();
    } catch (_) {}
    if (!state.previewText) state.previewText = DEFAULT_PREVIEW_TEXT;
  }

  function emptyPhonicsRecord() {
    return { heard: 0, practiced: 0, quizWins: 0 };
  }

  function getPhonicsRecord(id) {
    if (!state.phonicsMastery[id]) {
      state.phonicsMastery[id] = emptyPhonicsRecord();
    }
    return state.phonicsMastery[id];
  }

  function phonicsStars(rec) {
    if (!rec) return 0;
    let stars = 0;
    if (rec.heard > 0) stars += 1;
    if (rec.practiced > 0) stars += 1;
    if (rec.quizWins > 0) stars += 1;
    return stars;
  }

  function isPhonicsMastered(id) {
    return phonicsStars(getPhonicsRecord(id)) >= 3;
  }

  function starsLabel(n) {
    return "★".repeat(n) + "☆".repeat(Math.max(0, 3 - n));
  }

  function countPhonicsMastered() {
    return PHONICS_LETTERS.filter((L) => isPhonicsMastered(L.id)).length;
  }

  function countSightMastered() {
    if (!sightWords.length) return 0;
    return sightWords.filter((w) => isSightWordMastered(w.word)).length;
  }

  function normalizeStoryLevel(level) {
    const key = String(level || "").trim().toLowerCase();
    return STORY_LEVELS.includes(key) ? key : "beginner";
  }

  function getStoryReadingLevel() {
    return normalizeStoryLevel(state.storyReadingLevel);
  }

  function setStoryReadingLevel(level, opts) {
    const next = normalizeStoryLevel(level);
    const changed = next !== getStoryReadingLevel();
    state.storyReadingLevel = next;
    if (changed || (opts && opts.forcePersist)) persistProgress();
    updateStoryLevelPickersUI();
    if (changed && activeStoryId) {
      stopStoryReading();
      updateStoryReaderUI();
    }
    return next;
  }

  function getStoryProgress(id) {
    const key = String(id || "").trim();
    if (!key) return { opened: false, finished: false, finishedLevels: {} };
    if (!state.storiesProgress[key] || typeof state.storiesProgress[key] !== "object") {
      state.storiesProgress[key] = {
        opened: false,
        finished: false,
        finishedLevels: {},
      };
    }
    const rec = state.storiesProgress[key];
    if (!rec.finishedLevels || typeof rec.finishedLevels !== "object") {
      rec.finishedLevels = {};
    }
    return rec;
  }

  /**
   * Resolve display/read-aloud text for the active (or given) reading level.
   * Supports leveled `levels` data and legacy flat `paragraphs`.
   */
  function getStoryLevelContent(story, level) {
    if (!story) {
      return {
        level: "beginner",
        title: "",
        paragraphs: [],
        moral: "",
      };
    }
    const lvl = normalizeStoryLevel(level || getStoryReadingLevel());
    const levels = story.levels && typeof story.levels === "object" ? story.levels : null;
    const pack =
      (levels && levels[lvl] && typeof levels[lvl] === "object" && levels[lvl]) ||
      (levels &&
        levels.beginner &&
        typeof levels.beginner === "object" &&
        levels.beginner) ||
      (levels &&
        levels.advanced &&
        typeof levels.advanced === "object" &&
        levels.advanced) ||
      null;

    const paragraphs = Array.isArray(pack && pack.paragraphs)
      ? pack.paragraphs
      : Array.isArray(story.paragraphs)
        ? story.paragraphs
        : [];

    return {
      level: pack
        ? levels && levels[lvl]
          ? lvl
          : levels && levels.beginner
            ? "beginner"
            : "advanced"
        : "advanced",
      title: String((pack && pack.title) || story.title || "").trim(),
      paragraphs: paragraphs.map((p) => String(p || "").trim()).filter(Boolean),
      moral: String((pack && pack.moral) || story.moral || "").trim(),
    };
  }

  function countStoriesFinished() {
    if (!stories.length) return 0;
    return stories.filter((s) => getStoryProgress(s.id).finished).length;
  }

  function sectionPercents() {
    const phonicsTotal = PHONICS_LETTERS.length || 1;
    const sightTotal = Math.max(1, sightWords.length);
    const storiesTotal = Math.max(1, stories.length);
    const phonicsPct = Math.round(
      (countPhonicsMastered() / phonicsTotal) * 100
    );
    const sightPct = Math.round((countSightMastered() / sightTotal) * 100);
    const storiesPct = Math.round(
      (countStoriesFinished() / storiesTotal) * 100
    );
    const overallPct = Math.round((phonicsPct + sightPct + storiesPct) / 3);
    return { phonicsPct, sightPct, storiesPct, overallPct };
  }

  function setProgressBar(barEl, fillEl, pct) {
    const value = Math.max(0, Math.min(100, pct | 0));
    if (fillEl) fillEl.style.width = `${value}%`;
    if (barEl) barEl.setAttribute("aria-valuenow", String(value));
  }

  function updateProgressUI() {
    const { phonicsPct, sightPct, storiesPct, overallPct } = sectionPercents();
    const phonicsDone = countPhonicsMastered();
    const sightDone = countSightMastered();
    const storiesDone = countStoriesFinished();

    if (els.overallProgressLabel) {
      els.overallProgressLabel.textContent = `${overallPct}%`;
    }
    setProgressBar(
      els.overallProgressBar,
      els.overallProgressFill,
      overallPct
    );
    setProgressBar(els.phonicsProgressBar, els.phonicsProgressFill, phonicsPct);
    setProgressBar(els.sightProgressBar, els.sightProgressFill, sightPct);
    setProgressBar(
      els.storiesProgressBar,
      els.storiesProgressFill,
      storiesPct
    );

    if (els.phonicsReportText) {
      els.phonicsReportText.textContent = `${phonicsDone} of ${PHONICS_LETTERS.length} letter sounds mastered`;
    }
    if (els.sightReportText) {
      els.sightReportText.textContent = `${sightDone} of ${sightWords.length} words mastered`;
    }
    if (els.storiesReportText) {
      els.storiesReportText.textContent = `${storiesDone} of ${stories.length} stories finished`;
    }
  }

  function sightWordKey(word) {
    return String(word || "")
      .trim()
      .toLowerCase();
  }

  function isSightWordMastered(word) {
    const key = sightWordKey(word);
    return !!(key && state.sightMastery[key]);
  }

  /** Update word-stage mastery chrome without clearing mic heard text / status. */
  function refreshSightWordMasteryUi() {
    const entry = getWordEntry(state.sightWordIndex);
    const key = sightWordKey(entry.word);
    const mastered = isSightWordMastered(key);

    if (els.sightWordTitle) {
      els.sightWordTitle.classList.toggle("is-mastered", mastered);
      if (key) {
        els.sightWordTitle.setAttribute(
          "aria-label",
          mastered ? "Hear whole word (mastered)" : "Hear whole word"
        );
      }
    }
    if (!els.sightWordProgress) return;
    if (!sightWords.length) {
      els.sightWordProgress.textContent = "No words loaded";
      return;
    }
    els.sightWordProgress.textContent = mastered
      ? `Word ${state.sightWordIndex + 1} of ${sightWords.length} · Mastered!`
      : `Word ${state.sightWordIndex + 1} of ${sightWords.length}`;
  }

  /**
   * Sight-word mastery is mic-only: call only after a successful spoken match.
   * Hearing the word, tapping letters, or phonics “I can say it!” must never grant this.
   */
  function markSightWordMastered(word) {
    const key = sightWordKey(word);
    if (!key) return;
    if (!state.sightMastery[key]) {
      state.sightMastery[key] = true;
      persistProgress();
      updateProgressUI();
    }
    refreshSightWordMasteryUi();
  }

  function bumpPhonics(id, field) {
    const rec = getPhonicsRecord(id);
    rec[field] = (rec[field] | 0) + 1;
    persistProgress();
    updateProgressUI();
    updatePhonicsUI({ keepQuiz: phonicsQuizMode });
  }

  function buildProgressPayload() {
    return {
      version: 3,
      savedAt: new Date().toISOString(),
      userName: state.userName,
      sightWordIndex: state.sightWordIndex,
      phonicsIndex: state.phonicsIndex,
      phonicsMastery: state.phonicsMastery,
      sightMastery: state.sightMastery,
      storiesProgress: state.storiesProgress,
      storyReadingLevel: getStoryReadingLevel(),
      voiceName: state.voiceName,
      region: state.region,
      onlineOnly: state.onlineOnly,
      gender: state.gender,
      rate: state.rate,
      pitch: state.pitch,
    };
  }

  function parseSavedAt(data) {
    const t = Date.parse(data && data.savedAt);
    return Number.isFinite(t) ? t : 0;
  }

  function mergePhonicsMasteryMaps(a, b) {
    const out = {};
    const ids = new Set([
      ...Object.keys(a && typeof a === "object" ? a : {}),
      ...Object.keys(b && typeof b === "object" ? b : {}),
    ]);
    ids.forEach((id) => {
      const left = (a && a[id]) || {};
      const right = (b && b[id]) || {};
      out[id] = {
        heard: Math.max(left.heard | 0, right.heard | 0),
        practiced: Math.max(left.practiced | 0, right.practiced | 0),
        quizWins: Math.max(left.quizWins | 0, right.quizWins | 0),
      };
    });
    return out;
  }

  function mergeSightMasteryMaps(a, b) {
    const out = {};
    const left = a && typeof a === "object" ? a : {};
    const right = b && typeof b === "object" ? b : {};
    Object.keys(left).forEach((k) => {
      if (left[k]) out[k] = true;
    });
    Object.keys(right).forEach((k) => {
      if (right[k]) out[k] = true;
    });
    return out;
  }

  function mergeStoriesProgressMaps(a, b) {
    const out = {};
    const ids = new Set([
      ...Object.keys(a && typeof a === "object" ? a : {}),
      ...Object.keys(b && typeof b === "object" ? b : {}),
    ]);
    ids.forEach((id) => {
      const left = (a && a[id]) || {};
      const right = (b && b[id]) || {};
      const finishedLevels = {};
      const levelKeys = new Set([
        ...Object.keys(
          left.finishedLevels && typeof left.finishedLevels === "object"
            ? left.finishedLevels
            : {}
        ),
        ...Object.keys(
          right.finishedLevels && typeof right.finishedLevels === "object"
            ? right.finishedLevels
            : {}
        ),
      ]);
      levelKeys.forEach((lvl) => {
        if (
          (left.finishedLevels && left.finishedLevels[lvl]) ||
          (right.finishedLevels && right.finishedLevels[lvl])
        ) {
          finishedLevels[lvl] = true;
        }
      });
      out[id] = {
        opened: !!(left.opened || right.opened),
        finished: !!(left.finished || right.finished),
        finishedLevels,
      };
    });
    return out;
  }

  /**
   * Merge cloud ↔ local progress.
   * Mastery maps / story flags: smart union (max counters, OR booleans).
   * Indices: take the higher (further along).
   * Settings (voice, name, rate, etc.): prefer the payload with newer savedAt.
   */
  function mergeProgressPayloads(local, remote) {
    if (!remote || typeof remote !== "object") return local || null;
    if (!local || typeof local !== "object") return remote;
    const newer = parseSavedAt(remote) >= parseSavedAt(local) ? remote : local;
    const older = newer === remote ? local : remote;
    const newestTs = Math.max(parseSavedAt(local), parseSavedAt(remote));
    return {
      version: Math.max(local.version | 0, remote.version | 0, 3),
      savedAt: newestTs
        ? new Date(newestTs).toISOString()
        : new Date().toISOString(),
      userName: newer.userName != null ? newer.userName : older.userName,
      voiceName: newer.voiceName != null ? newer.voiceName : older.voiceName,
      region: newer.region != null ? newer.region : older.region,
      onlineOnly:
        typeof newer.onlineOnly === "boolean"
          ? newer.onlineOnly
          : older.onlineOnly,
      gender: newer.gender != null ? newer.gender : older.gender,
      rate: typeof newer.rate === "number" ? newer.rate : older.rate,
      pitch: typeof newer.pitch === "number" ? newer.pitch : older.pitch,
      storyReadingLevel:
        newer.storyReadingLevel != null
          ? newer.storyReadingLevel
          : older.storyReadingLevel,
      sightWordIndex: Math.max(local.sightWordIndex | 0, remote.sightWordIndex | 0),
      phonicsIndex: Math.max(local.phonicsIndex | 0, remote.phonicsIndex | 0),
      phonicsMastery: mergePhonicsMasteryMaps(
        local.phonicsMastery,
        remote.phonicsMastery
      ),
      sightMastery: mergeSightMasteryMaps(local.sightMastery, remote.sightMastery),
      storiesProgress: mergeStoriesProgressMaps(
        local.storiesProgress,
        remote.storiesProgress
      ),
    };
  }

  function scheduleCloudUpload() {
    const cloud = getEllieCloud();
    if (
      cloudSyncPaused ||
      !cloudUser ||
      !cloud ||
      !cloud.isConfigured()
    ) {
      return;
    }
    clearTimeout(cloudUploadTimer);
    cloudUploadTimer = setTimeout(() => {
      uploadProgressToCloud().catch((err) => {
        console.warn("Ellie cloud sync: upload failed", err);
        setCloudSyncing(false);
      });
    }, CLOUD_UPLOAD_DEBOUNCE_MS);
  }

  function setCloudSyncing(on) {
    if (!els.cloudAuthBtn) return;
    els.cloudAuthBtn.classList.toggle("icon-btn--syncing", !!on);
  }

  async function uploadProgressToCloud() {
    const cloud = getEllieCloud();
    if (!cloudUser || !cloud || !cloud.isConfigured()) return;
    setCloudSyncing(true);
    try {
      await cloud.saveRemoteProgress(cloudUser.uid, buildProgressPayload());
    } finally {
      setCloudSyncing(false);
    }
  }

  function updateCloudAuthUI() {
    if (!els.cloudAuthBtn) return;
    const cloud = getEllieCloud();
    if (!cloud || !cloud.isConfigured()) {
      els.cloudAuthBtn.hidden = true;
      return;
    }
    els.cloudAuthBtn.hidden = false;
    if (cloudUser) {
      els.cloudAuthBtn.classList.add("icon-btn--signed-in");
      const who = cloudUser.email || cloudUser.displayName || "Google";
      els.cloudAuthBtn.title = `Signed in as ${who}. Tap to sign out.`;
      els.cloudAuthBtn.setAttribute("aria-label", "Sign out of Google");
      els.cloudAuthBtn.dataset.speak = "Sign out";
      if (els.cloudAuthCaption) els.cloudAuthCaption.textContent = "Out";
    } else {
      els.cloudAuthBtn.classList.remove("icon-btn--signed-in");
      els.cloudAuthBtn.title = "Sign in with Google to sync progress";
      els.cloudAuthBtn.setAttribute("aria-label", "Sign in with Google");
      els.cloudAuthBtn.dataset.speak = "Google";
      if (els.cloudAuthCaption) els.cloudAuthCaption.textContent = "Google";
    }
  }

  function refreshUiAfterProgressApply() {
    syncControlsFromState();
    updateHomeGreeting();
    updateProgressUI();
    updateStoryLevelPickersUI();
    if (els.sightScreen && !els.sightScreen.hidden) updateSightWordUI();
    applyVoiceFilters();
  }

  async function syncCloudWithLocal(user) {
    const cloud = getEllieCloud();
    if (!cloud || !user) return;
    cloudSyncPaused = true;
    setCloudSyncing(true);
    try {
      const remote = await cloud.loadRemoteProgress(user.uid);
      const local = buildProgressPayload();
      const merged = mergeProgressPayloads(local, remote) || local;
      applyProgressData(merged, { persist: true });
      await cloud.saveRemoteProgress(user.uid, buildProgressPayload());
      refreshUiAfterProgressApply();
      if (cloudAuthSpeakPending) {
        cloudAuthSpeakPending = false;
        speakCue("Signed in");
      }
    } catch (err) {
      console.warn("Ellie cloud sync: merge failed", err);
      cloudAuthSpeakPending = false;
    } finally {
      setCloudSyncing(false);
      cloudSyncPaused = false;
    }
  }

  function bindCloudAuth() {
    const cloud = getEllieCloud();
    updateCloudAuthUI();
    if (!cloud || !cloud.isConfigured()) {
      cloudAuthReady = true;
      return;
    }
    cloud.ensureInit();
    cloud.onAuthChange(async (user) => {
      cloudUser = user || null;
      updateCloudAuthUI();
      if (user) {
        await syncCloudWithLocal(user);
      } else {
        cloudAuthSpeakPending = false;
      }
      cloudAuthReady = true;
    });

    if (els.cloudAuthBtn) {
      els.cloudAuthBtn.addEventListener("click", async () => {
        if (!cloud.isConfigured()) return;
        if (cloudUser) {
          speakCue("Sign out");
          try {
            await cloud.signOutUser();
          } catch (err) {
            console.warn("Ellie cloud sync: sign-out failed", err);
          }
          return;
        }
        speakCue("Google");
        cloudAuthSpeakPending = true;
        try {
          await cloud.signInWithGoogle();
        } catch (err) {
          cloudAuthSpeakPending = false;
          const code = err && err.code;
          if (
            code === "auth/popup-closed-by-user" ||
            code === "auth/cancelled-popup-request"
          ) {
            return;
          }
          console.warn("Ellie cloud sync: sign-in failed", err);
          alert(
            "Could not sign in with Google. Check Firebase Auth setup and authorized domains."
          );
        }
      });
    }
  }

  function persistProgress() {
    try {
      localStorage.setItem(LS_PROGRESS, JSON.stringify(buildProgressPayload()));
    } catch (_) {}
    scheduleCloudUpload();
  }

  /** @returns {boolean} true if progress was restored from localStorage */
  function loadPersistedProgress() {
    try {
      const raw = localStorage.getItem(LS_PROGRESS);
      if (raw == null || !String(raw).trim()) return false;
      const data = JSON.parse(raw);
      applyProgressData(data, { persist: false });
      return true;
    } catch (_) {
      return false;
    }
  }

  function resetStateForFreshStart() {
    state.sightWordIndex = 0;
    state.phonicsIndex = 0;
    state.phonicsMastery = {};
    state.sightMastery = {};
    state.storiesProgress = {};
    state.storyReadingLevel = "beginner";
    state.scrubIndex = 0;
    state.region = "";
    state.onlineOnly = true;
    state.gender = "both";
    state.voiceName = "";
    state.rate = 0.95;
    state.pitch = 1.05;
  }

  function applyProgressData(data, opts) {
    const shouldPersist = !opts || opts.persist !== false;
    if (data.userName != null) {
      state.userName = String(data.userName).trim();
      persistUserName(state.userName);
    }
    if (Number.isFinite(data.sightWordIndex))
      state.sightWordIndex = Math.max(0, data.sightWordIndex | 0);
    if (sightWords.length)
      state.sightWordIndex = Math.min(
        state.sightWordIndex,
        sightWords.length - 1
      );
    if (Number.isFinite(data.phonicsIndex))
      state.phonicsIndex = Math.max(
        0,
        Math.min(PHONICS_LETTERS.length - 1, data.phonicsIndex | 0)
      );
    if (data.phonicsMastery && typeof data.phonicsMastery === "object") {
      state.phonicsMastery = { ...data.phonicsMastery };
    }
    if (data.sightMastery && typeof data.sightMastery === "object") {
      state.sightMastery = { ...data.sightMastery };
    }
    if (data.storiesProgress && typeof data.storiesProgress === "object") {
      state.storiesProgress = { ...data.storiesProgress };
    }
    if (data.storyReadingLevel != null) {
      state.storyReadingLevel = normalizeStoryLevel(data.storyReadingLevel);
    } else {
      state.storyReadingLevel = "beginner";
    }
    if (data.voiceName != null) state.voiceName = String(data.voiceName);
    if (data.region != null) state.region = String(data.region);
    if (typeof data.onlineOnly === "boolean")
      state.onlineOnly = data.onlineOnly;
    if (data.gender != null) state.gender = String(data.gender);
    if (typeof data.rate === "number") state.rate = data.rate;
    if (typeof data.pitch === "number") state.pitch = data.pitch;
    if (shouldPersist) persistProgress();
  }

  function syncControlsFromState() {
    els.regionSelect.value = state.region;
    els.onlineToggle.checked = state.onlineOnly;
    els.genderSelect.value = state.gender;
    els.rateRange.value = String(state.rate);
    els.pitchRange.value = String(state.pitch);
    els.rateValue.textContent = els.rateRange.value;
    els.pitchValue.textContent = els.pitchRange.value;
    if (els.settingsPreviewText)
      els.settingsPreviewText.value = state.previewText;
  }

  function getWordEntry(i) {
    if (!sightWords.length) return { word: "" };
    return sightWords[Math.min(Math.max(0, i), sightWords.length - 1)];
  }

  function segmentWordIntoGraphemes(raw) {
    const word = (raw || "").trim();
    if (!word) return [];
    const lower = word.toLowerCase();
    const out = [];
    let i = 0;
    while (i < lower.length) {
      let matched = null;
      for (const p of GRAPHEME_PATTERNS) {
        if (lower.startsWith(p, i)) {
          matched = p;
          break;
        }
      }
      if (matched) {
        out.push(word.slice(i, i + matched.length).toUpperCase());
        i += matched.length;
      } else {
        out.push(word[i].toUpperCase());
        i += 1;
      }
    }
    return out;
  }

  function lettersForEntry(entry) {
    const w = (entry.word || "").trim();
    if (!w) return [];

    if (Array.isArray(entry.letters) && entry.letters.length) {
      const normalized = entry.letters.map((x) => String(x).toUpperCase());
      const joined = entry.letters.map((x) => String(x).toLowerCase()).join("");
      const wordNorm = w.toLowerCase().replace(/\s+/g, "");
      if (joined === wordNorm) return normalized;
    }
    return segmentWordIntoGraphemes(w);
  }

  function normalizePhonemeId(raw) {
    const id = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    return id || "";
  }

  function defaultPhonemeForGrapheme(graphemeUpper) {
    const g = String(graphemeUpper || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    if (!g) return "";
    if (DEFAULT_GRAPHEME_PHONEME[g]) return DEFAULT_GRAPHEME_PHONEME[g];
    if (g.length > 1) {
      const last = g[g.length - 1];
      if (DEFAULT_GRAPHEME_PHONEME[last]) return DEFAULT_GRAPHEME_PHONEME[last];
    }
    return DEFAULT_GRAPHEME_PHONEME[g[0]] || "";
  }

  /**
   * Phoneme id for a letter tile (from words.json or primary phonics defaults).
   */
  function phonemeIdForGrapheme(entry, graphemeIndex) {
    const letters = lettersForEntry(entry);
    if (!letters.length) return "";
    const idx = Math.min(Math.max(0, graphemeIndex | 0), letters.length - 1);
    const list = entry.phonemes;
    if (Array.isArray(list) && list[idx] != null) {
      const id = normalizePhonemeId(list[idx]);
      if (id) return id;
    }
    return defaultPhonemeForGrapheme(letters[idx]);
  }

  function stopPhonemeAudio() {
    if (!activePhonemeAudio) return;
    try {
      activePhonemeAudio.pause();
      activePhonemeAudio.currentTime = 0;
    } catch (_) {}
    activePhonemeAudio = null;
  }

  function getPhonemeAudio(id) {
    const key = normalizePhonemeId(id);
    if (!key) return null;
    let audio = phonemeAudioCache.get(key);
    if (!audio) {
      audio = new Audio(`${PHONEME_AUDIO_BASE}${key}.mp3`);
      audio.preload = "auto";
      phonemeAudioCache.set(key, audio);
    }
    return audio;
  }

  /** Phoneme ids needed for the current word list (plus grapheme defaults). */
  function collectPhonemeIdsToPreload() {
    const ids = new Set();
    for (const entry of sightWords) {
      const letters = lettersForEntry(entry);
      for (let i = 0; i < letters.length; i++) {
        const id = phonemeIdForGrapheme(entry, i);
        if (id) ids.add(id);
      }
    }
    for (const id of Object.values(DEFAULT_GRAPHEME_PHONEME)) {
      const key = normalizePhonemeId(id);
      if (key) ids.add(key);
    }
    return ids;
  }

  /**
   * Warm phonemeAudioCache so first letter taps do not wait on network.
   * Does not call play() — mobile still requires a user gesture to unmute/play.
   */
  function preloadPhonemeAudio() {
    for (const id of collectPhonemeIdsToPreload()) {
      const audio = getPhonemeAudio(id);
      if (!audio) continue;
      try {
        if (audio.readyState < 2) audio.load();
      } catch (_) {}
    }
    for (const id of ["correct", "wrong"]) {
      if (sfxAudioCache.has(id)) continue;
      const audio = new Audio(`${SFX_BASE}${id}.mp3`);
      audio.preload = "auto";
      sfxAudioCache.set(id, audio);
      try {
        audio.load();
      } catch (_) {}
    }
  }

  /**
   * Play an isolated letter-sound MP3 from sounds/phonemes/{id}.mp3.
   * Falls back to a short TTS hint only if the file is missing.
   */
  function playPhoneme(id, fallbackText) {
    const audio = getPhonemeAudio(id);
    if (!audio) {
      if (fallbackText) speakText(String(fallbackText).toLowerCase());
      return;
    }

    try {
      speechSynthesis.cancel();
    } catch (_) {}
    stopPhonemeAudio();

    const start = () => {
      activePhonemeAudio = audio;
      const p = audio.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          if (fallbackText) speakText(String(fallbackText).toLowerCase());
        });
      }
    };

    audio.onerror = () => {
      phonemeAudioCache.delete(normalizePhonemeId(id));
      if (fallbackText) speakText(String(fallbackText).toLowerCase());
    };

    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (_) {}

    if (audio.readyState >= 2) start();
    else {
      audio.addEventListener("canplaythrough", start, { once: true });
      audio.load();
    }
  }

  function speakGraphemeSound(entry, graphemeIndex) {
    stopSayWordListening();
    const id = phonemeIdForGrapheme(entry, graphemeIndex);
    const letters = lettersForEntry(entry);
    const label = letters[graphemeIndex] || "";
    playPhoneme(id, label ? String(label).toLowerCase() : "");
  }

  /**
   * Spoken form for chunks/slider: the real word from the start through this
   * grapheme so TTS blends it as language, not isolated phonics hints.
   */
  function wordPrefixThroughGrapheme(entry, graphemeIndex) {
    const letters = lettersForEntry(entry);
    const word = (entry.word || "").trim();
    if (!word || !letters.length) return "";
    const idx = Math.min(Math.max(0, graphemeIndex | 0), letters.length - 1);
    let charCount = 0;
    for (let i = 0; i <= idx; i++) {
      charCount += letters[i].length;
    }
    return word.slice(0, charCount);
  }

  /**
   * Browsers often say "tee aitch" for bare "th". Short TTS spellings that
   * usually come out closer to the digraph (still using the real word for context).
   */
  function phoneticHintFirstGrapheme(graphemeUpper, wordLower) {
    const g = String(graphemeUpper).toLowerCase();
    if (g === "th") {
      if (
        /^(therm|themat|theat|theor|thes|thick|thin|think|thing|third|thank|thumb|thun|thr|thw)/.test(
          wordLower
        )
      ) {
        return "thhh";
      }
      if (
        /^(the|this|that|they|them|their|there|these|those|then|than|though|thus|thy|thee|thou)\b/.test(
          wordLower
        )
      ) {
        return "thuh";
      }
      return "thhh";
    }
    const DIGRAPH_HINTS = {
      ch: "chuh",
      sh: "shhh",
      wh: "wuh",
      ph: "fff",
      qu: "kwuh",
      tch: "ch",
      dge: "juh",
      igh: "eye",
      ng: "ung",
      ck: "kuh",
    };
    if (DIGRAPH_HINTS[g]) return DIGRAPH_HINTS[g];
    return null;
  }

  /**
   * When the buildup is only the first multi-letter chunk, speak a phonetic
   * hint; once the slice is longer, use the real letters so it stays "in" the word.
   */
  function ttsTextForWordBuildup(entry, graphemeIndex) {
    const letters = lettersForEntry(entry);
    const word = (entry.word || "").trim();
    const wordLower = word.toLowerCase();
    const fragment = wordPrefixThroughGrapheme(entry, graphemeIndex);
    if (!fragment) return "";

    const sounds = entry.sounds;
    if (Array.isArray(sounds) && sounds.length === letters.length) {
      const parts = [];
      for (let i = 0; i <= graphemeIndex; i++) {
        const s = sounds[i];
        if (s == null || !String(s).trim()) {
          parts.length = 0;
          break;
        }
        parts.push(String(s).trim());
      }
      if (parts.length === graphemeIndex + 1) return parts.join(" ");
    }

    const lettersJoined = letters.map((l) => String(l).toLowerCase()).join("");
    const wordNorm = wordLower.replace(/\s+/g, "");
    if (
      lettersJoined === wordNorm &&
      wordLower === "the" &&
      letters.length === 2 &&
      graphemeIndex === 1
    ) {
      return "thuh uh";
    }

    if (fragment.toLowerCase() === wordLower) return fragment;

    if (graphemeIndex !== 0 || !letters.length) return fragment;

    const first = String(letters[0]);
    if (first.length < 2) return fragment;

    if (Array.isArray(sounds) && sounds[0] != null) {
      return String(sounds[0]);
    }
    if (sounds && typeof sounds === "object" && !Array.isArray(sounds)) {
      const key = first.toLowerCase();
      if (sounds[key] != null) return String(sounds[key]);
    }

    const hint = phoneticHintFirstGrapheme(first, wordLower);
    return hint || fragment;
  }

  function speakWordBuildupToGrapheme(entry, graphemeIndex) {
    const toSpeak = ttsTextForWordBuildup(entry, graphemeIndex);
    if (toSpeak) speakText(toSpeak.toLowerCase());
  }

  function getSelectedVoice() {
    const idx = parseInt(els.voiceSelect.value, 10);
    if (!Number.isFinite(idx) || idx < 0) return null;
    return filteredVoices[idx] || null;
  }

  /**
   * Prefer Microsoft Ava Online (Edge); name/URI strings vary by browser/OS.
   */
  function pickDefaultVoice(list) {
    if (!list.length) return null;
    const avaOnline = list.find((v) => {
      const n = v.name.toLowerCase();
      const u = v.voiceURI.toLowerCase();
      return (
        n.includes("ava") && (n.includes("online") || u.includes("online"))
      );
    });
    if (avaOnline) return avaOnline;
    const ava = list.find((v) => v.name.toLowerCase().includes("ava"));
    if (ava) return ava;
    return (
      list.find((v) => v.default) ||
      list.find((v) => v.lang.toLowerCase().startsWith("en-us")) ||
      list.find((v) => v.lang.toLowerCase().startsWith("en-gb")) ||
      list[0]
    );
  }

  function applyVoiceFilters() {
    const region = els.regionSelect.value;
    const onlineOnly = els.onlineToggle.checked;
    const gender = els.genderSelect.value;

    filteredVoices = voices.filter((v) => {
      const lang = v.lang.toLowerCase();
      const name = v.name.toLowerCase();
      const uri = v.voiceURI.toLowerCase();

      if (!lang.startsWith("en")) return false;
      if (region && !lang.includes(region)) return false;
      if (onlineOnly && !(uri.includes("google") || uri.includes("online"))) {
        return false;
      }
      if (
        gender === "male" &&
        !(name.includes("male") || name.includes("man"))
      ) {
        return false;
      }
      if (
        gender === "female" &&
        !(
          name.includes("female") ||
          name.includes("woman") ||
          name.includes("girl")
        )
      ) {
        return false;
      }
      return true;
    });

    els.voiceSelect.innerHTML = "";
    filteredVoices.forEach((voice, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = `${voice.name} (${voice.lang})`;
      els.voiceSelect.appendChild(option);
    });

    const savedIdx = state.voiceName
      ? filteredVoices.findIndex((v) => v.name === state.voiceName)
      : -1;

    if (savedIdx >= 0) {
      els.voiceSelect.value = String(savedIdx);
    } else if (filteredVoices.length) {
      const pick = pickDefaultVoice(filteredVoices);
      const idx = filteredVoices.indexOf(pick);
      state.voiceName = pick.name;
      els.voiceSelect.value = String(idx);
    } else {
      state.voiceName = "";
    }
  }

  function speakText(text, opts) {
    const voice = getSelectedVoice();
    if (!voice || !text) return null;

    stopPhonemeAudio();
    if (!(opts && opts.append)) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.rate = state.rate;
    u.pitch = state.pitch;
    if (opts && typeof opts.rate === "number") u.rate = opts.rate;
    if (opts && typeof opts.pitch === "number") u.pitch = opts.pitch;
    if (opts && typeof opts.onend === "function") u.onend = opts.onend;
    if (opts && typeof opts.onerror === "function") u.onerror = opts.onerror;
    if (opts && typeof opts.onboundary === "function") u.onboundary = opts.onboundary;
    speechSynthesis.speak(u);
    return u;
  }

  /** Short spoken cue for icon-first controls (non-readers). */
  function speakCue(text) {
    const line = String(text || "").trim();
    if (!line) return;
    speakText(line);
  }

  /**
   * Short instructional lines for pre-readers (not full on-screen paragraphs).
   * Keys match screens/modals and `data-speak-help` buttons.
   */
  function instructionLine(key) {
    switch (key) {
      case "home":
        return state.userName
          ? `Hi, ${state.userName}! Pick an activity with Ellie.`
          : "Hi! I'm Ellie. Pick an activity.";
      case "phonics":
        return "Phonics. Tap a letter. Hear it, practice it, then take a quiz.";
      case "sight":
        return "Sight words. Tap a letter for one sound. Slide to blend. Then say the word.";
      case "stories":
        return "Stories. Pick Easy or Longer, then pick a short tale. Look at the picture, or tap Read aloud.";
      case "story": {
        const story = getStoryById(activeStoryId);
        const content = getStoryLevelContent(story);
        const title = content.title || (story && story.title) || "This story";
        const levelName =
          STORY_LEVEL_SPEAK[content.level] || STORY_LEVEL_SPEAK.beginner;
        return `${title}. ${levelName} level. Look at the picture. Tap Read aloud to listen. Tap I finished when you're done.`;
      }
      case "report":
        return "Report card. Here are your stars for letters, words, and stories.";
      case "welcome":
        return "Welcome! Progress saves on this device. Tap Start, Open file for a backup, or Sign in with Google to sync.";
      case "name":
        return "What is your name? Type it, then tap Let's read.";
      case "phonicsQuiz":
        return "Listen. Which letter makes this sound?";
      default:
        return "";
    }
  }

  /**
   * Speak a short instruction. Once per screen visit unless `force` (help icon).
   * Cancels prior TTS and stops phoneme audio via speakText.
   */
  function speakInstruction(key, opts) {
    const force = !!(opts && opts.force);
    const line = instructionLine(key);
    if (!line) return null;

    if (!force && lastAutoSpokenInstructionKey === key) return null;
    if (!force) lastAutoSpokenInstructionKey = key;

    if (!getSelectedVoice()) {
      pendingInstructionText = line;
      return null;
    }
    pendingInstructionText = null;
    const speakOpts = {};
    if (opts && typeof opts.onend === "function") speakOpts.onend = opts.onend;
    if (opts && typeof opts.onerror === "function") speakOpts.onerror = opts.onerror;
    return speakText(
      line,
      Object.keys(speakOpts).length ? speakOpts : undefined
    );
  }

  function flushPendingInstruction() {
    if (!pendingInstructionText || !getSelectedVoice()) return;
    const line = pendingInstructionText;
    pendingInstructionText = null;
    speakText(line);
  }

  function speakWholeWord(word) {
    speakText(word.toLowerCase());
  }

  function loadVoices() {
    voices = speechSynthesis.getVoices();
    applyVoiceFilters();
    flushPendingInstruction();
  }

  async function loadWordsFromJson() {
    try {
      const res = await fetch("data/words.json", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const list = data.sightWords;
      if (Array.isArray(list) && list.length) {
        sightWords = list.map((item) =>
          typeof item === "string" ? { word: item } : item
        );
        return;
      }
    } catch (_) {
      /* offline / missing */
    }
    sightWords = DEFAULT_WORDS.slice();
  }

  async function loadStoriesFromJson() {
    try {
      const res = await fetch("data/stories.json", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const list = data.stories;
      if (Array.isArray(list) && list.length) {
        stories = list.filter((s) => s && s.id && s.title);
        return;
      }
    } catch (_) {
      /* offline / missing */
    }
    stories = [];
  }

  function getStoryById(id) {
    const key = String(id || "").trim();
    return stories.find((s) => s.id === key) || null;
  }

  function setStoryReadingUi(reading) {
    storyReading = !!reading;
    if (els.storyStopRead) els.storyStopRead.hidden = !storyReading;
    if (els.storyReadAloud) {
      els.storyReadAloud.disabled = storyReading;
    }
  }

  function clearStoryKaraokeTimers() {
    for (const id of storyKaraokeTimerIds) {
      clearTimeout(id);
      clearInterval(id);
    }
    storyKaraokeTimerIds = [];
  }

  function clearStoryKaraokeHighlight() {
    clearStoryKaraokeTimers();
    if (storyKaraokeActiveEl) {
      storyKaraokeActiveEl.classList.remove("is-reading");
      storyKaraokeActiveEl = null;
    }
    document.querySelectorAll(".story-word.is-reading").forEach((el) => {
      el.classList.remove("is-reading");
    });
  }

  function setStoryKaraokeWord(el) {
    if (!el || storyKaraokeActiveEl === el) return;
    if (storyKaraokeActiveEl) {
      storyKaraokeActiveEl.classList.remove("is-reading");
    }
    storyKaraokeActiveEl = el;
    el.classList.add("is-reading");
    try {
      const reduceMotion =
        typeof matchMedia === "function" &&
        matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "nearest",
        inline: "nearest",
      });
    } catch (_) {}
  }

  /** Split text into word spans; punctuation stays attached to visible tokens. */
  function buildKaraokeMarkup(text) {
    const str = String(text || "");
    const words = [];
    const frag = document.createDocumentFragment();
    const re = /(\S+)(\s*)/g;
    let m;
    while ((m = re.exec(str))) {
      const token = m[1];
      const start = m.index;
      const end = start + token.length;
      const span = document.createElement("span");
      span.className = "story-word";
      span.textContent = token;
      frag.appendChild(span);
      words.push({ el: span, start, end });
      if (m[2]) frag.appendChild(document.createTextNode(m[2]));
    }
    return { frag, words, text: str };
  }

  function findKaraokeWordAtChar(words, charIndex) {
    if (!words || !words.length) return null;
    const idx = Math.max(0, Number(charIndex) || 0);
    for (const w of words) {
      if (idx >= w.start && idx < w.end) return w.el;
    }
    // Whitespace / gaps: prefer the upcoming word (typical boundary alignment).
    for (const w of words) {
      if (w.start >= idx) return w.el;
    }
    return words[words.length - 1].el;
  }

  /**
   * Render title / paragraphs / moral as karaoke word spans for read-aloud.
   * Spoken chunk text matches on-screen text so boundary charIndex maps cleanly.
   */
  function prepareStoryKaraoke(content) {
    clearStoryKaraokeHighlight();
    const tracks = [];
    if (!content) return tracks;

    if (els.storyTitle && content.title) {
      const built = buildKaraokeMarkup(content.title);
      els.storyTitle.textContent = "";
      els.storyTitle.appendChild(built.frag);
      tracks.push({ text: built.text, words: built.words });
    }

    if (els.storyBody) {
      els.storyBody.innerHTML = "";
      els.storyBody.classList.toggle(
        "is-beginner",
        content.level === "beginner"
      );
      els.storyBody.dataset.storyLevel = content.level;
      content.paragraphs.forEach((line) => {
        const built = buildKaraokeMarkup(line);
        const p = document.createElement("p");
        p.appendChild(built.frag);
        els.storyBody.appendChild(p);
        tracks.push({ text: built.text, words: built.words });
      });
    }

    if (els.storyMoral) {
      if (content.moral) {
        const moralText = `Lesson: ${content.moral}`;
        const built = buildKaraokeMarkup(moralText);
        els.storyMoral.hidden = false;
        els.storyMoral.textContent = "";
        els.storyMoral.appendChild(built.frag);
        tracks.push({ text: built.text, words: built.words });
      } else {
        els.storyMoral.hidden = true;
        els.storyMoral.textContent = "";
      }
    }

    return tracks;
  }

  function stopStoryReading(opts) {
    storyReadGen += 1;
    storyReading = false;
    try {
      speechSynthesis.cancel();
    } catch (_) {}
    clearStoryKaraokeHighlight();
    setStoryReadingUi(false);
    if (
      !(opts && opts.skipRestore) &&
      activeStoryId &&
      els.storyBody &&
      els.storyBody.querySelector(".story-word")
    ) {
      updateStoryReaderUI();
    }
  }

  function markStoryOpened(id) {
    const rec = getStoryProgress(id);
    if (!rec.opened) {
      rec.opened = true;
      persistProgress();
      updateProgressUI();
    }
  }

  function markStoryFinished(id) {
    // End karaoke/read-aloud tracking without speechSynthesis.cancel —
    // the Finished button speaks a cue first and must not be cut off.
    storyReadGen += 1;
    storyReading = false;
    clearStoryKaraokeHighlight();
    setStoryReadingUi(false);
    const rec = getStoryProgress(id);
    const level = getStoryReadingLevel();
    const wasFinished = !!rec.finished;
    const wasLevelFinished = !!rec.finishedLevels[level];
    rec.opened = true;
    rec.finished = true;
    rec.finishedLevels[level] = true;
    if (!wasFinished || !wasLevelFinished) {
      persistProgress();
      updateProgressUI();
      if (!wasFinished) playFeedbackSfx("success");
    }
    updateStoriesListUI();
    updateStoryReaderUI();
  }

  function speakStoryAloud(story) {
    if (!story) return;
    const content = getStoryLevelContent(story);
    const tracks = prepareStoryKaraoke(content);
    if (!tracks.length) return;

    storyReadGen += 1;
    const token = storyReadGen;
    try {
      speechSynthesis.cancel();
    } catch (_) {}
    setStoryReadingUi(true);

    let i = 0;
    const finishReading = () => {
      if (token !== storyReadGen) return;
      clearStoryKaraokeHighlight();
      setStoryReadingUi(false);
      if (els.storyBody && els.storyBody.querySelector(".story-word")) {
        updateStoryReaderUI();
      }
    };

    const speakNext = () => {
      if (token !== storyReadGen) return;
      if (i >= tracks.length) {
        finishReading();
        return;
      }

      const track = tracks[i++];
      let boundarySeen = false;
      let fallbackIdx = 0;
      let localTimerIds = [];

      const clearLocalTimers = () => {
        for (const id of localTimerIds) {
          clearTimeout(id);
          clearInterval(id);
          const pos = storyKaraokeTimerIds.indexOf(id);
          if (pos >= 0) storyKaraokeTimerIds.splice(pos, 1);
        }
        localTimerIds = [];
      };

      const trackTimer = (id) => {
        localTimerIds.push(id);
        storyKaraokeTimerIds.push(id);
        return id;
      };

      const highlightAtChar = (charIndex) => {
        const el = findKaraokeWordAtChar(track.words, charIndex);
        if (el) setStoryKaraokeWord(el);
      };

      const startFallbackHighlight = () => {
        if (boundarySeen || token !== storyReadGen || !track.words.length) return;
        fallbackIdx = 0;
        setStoryKaraokeWord(track.words[0].el);
        const rate =
          typeof state.rate === "number" && state.rate > 0 ? state.rate : 1;
        const msPerWord = Math.max(160, Math.round(320 / rate));
        trackTimer(
          setInterval(() => {
            if (token !== storyReadGen || boundarySeen) {
              clearLocalTimers();
              return;
            }
            fallbackIdx += 1;
            if (fallbackIdx >= track.words.length) {
              clearLocalTimers();
              return;
            }
            setStoryKaraokeWord(track.words[fallbackIdx].el);
          }, msPerWord)
        );
      };

      const utterance = speakText(track.text, {
        append: i > 1,
        onboundary: (ev) => {
          if (token !== storyReadGen) return;
          if (ev && ev.name && ev.name !== "word") return;
          boundarySeen = true;
          clearLocalTimers();
          highlightAtChar(ev && typeof ev.charIndex === "number" ? ev.charIndex : 0);
        },
        onend: () => {
          clearLocalTimers();
          if (token !== storyReadGen) return;
          speakNext();
        },
        onerror: (ev) => {
          clearLocalTimers();
          if (token !== storyReadGen) return;
          if (ev && ev.error === "interrupted") return;
          clearStoryKaraokeHighlight();
          setStoryReadingUi(false);
          if (els.storyBody && els.storyBody.querySelector(".story-word")) {
            updateStoryReaderUI();
          }
        },
      });

      if (!utterance) {
        clearLocalTimers();
        finishReading();
        return;
      }

      // Safari / Firefox often omit word boundary events — fall back after a beat.
      trackTimer(
        setTimeout(() => {
          if (token !== storyReadGen || boundarySeen) return;
          startFallbackHighlight();
        }, 420)
      );
    };

    speakNext();
  }

  function updateStoriesListUI() {
    if (!els.storiesList) return;
    els.storiesList.innerHTML = "";
    if (!stories.length) {
      const empty = document.createElement("p");
      empty.className = "lead";
      empty.textContent = "Stories could not be loaded.";
      els.storiesList.appendChild(empty);
      return;
    }
    stories.forEach((story) => {
      const prog = getStoryProgress(story.id);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "story-card" + (prog.finished ? " is-finished" : "");
      btn.setAttribute("role", "listitem");
      btn.setAttribute("aria-label", story.title);
      btn.dataset.speak = story.title;

      const img = document.createElement("img");
      img.className = "story-card-thumb";
      img.src = story.image || "";
      img.alt = story.imageAlt || story.title;
      img.loading = "lazy";

      const text = document.createElement("div");
      const h3 = document.createElement("h3");
      h3.textContent = story.title;
      const p = document.createElement("p");
      p.textContent = story.blurb || "A short tale to read with Ellie.";
      text.appendChild(h3);
      text.appendChild(p);
      if (prog.finished) {
        const badge = document.createElement("span");
        badge.className = "story-card-badge";
        badge.textContent = "Finished!";
        text.appendChild(badge);
      }

      btn.appendChild(img);
      btn.appendChild(text);
      btn.addEventListener("click", () => {
        openStory(story.id);
      });
      els.storiesList.appendChild(btn);
    });
  }

  function updateStoryLevelPickersUI() {
    const level = getStoryReadingLevel();
    document.querySelectorAll(".story-level-picker").forEach((picker) => {
      picker.querySelectorAll("[data-level]").forEach((btn) => {
        const btnLevel = normalizeStoryLevel(btn.getAttribute("data-level"));
        const active = btnLevel === level;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
    });
  }

  function updateStoryReaderUI() {
    const story = getStoryById(activeStoryId);
    if (!story) return;
    const content = getStoryLevelContent(story);
    clearStoryKaraokeHighlight();
    updateStoryLevelPickersUI();

    if (els.storyImage) {
      els.storyImage.src = story.image || "";
      els.storyImage.alt = story.imageAlt || content.title || story.title;
    }
    if (els.storyTitle) els.storyTitle.textContent = content.title || story.title;
    if (els.storyMeta) {
      const levelHint =
        content.level === "beginner" ? "Easy words" : "Longer story";
      els.storyMeta.textContent = story.author
        ? `A fable by ${story.author} · ${levelHint}`
        : `A classic fable · ${levelHint}`;
    }
    if (els.storyBody) {
      els.storyBody.innerHTML = "";
      els.storyBody.classList.toggle("is-beginner", content.level === "beginner");
      els.storyBody.dataset.storyLevel = content.level;
      content.paragraphs.forEach((line) => {
        const p = document.createElement("p");
        p.textContent = line;
        els.storyBody.appendChild(p);
      });
    }
    if (els.storyMoral) {
      if (content.moral) {
        els.storyMoral.hidden = false;
        els.storyMoral.textContent = `Lesson: ${content.moral}`;
      } else {
        els.storyMoral.hidden = true;
        els.storyMoral.textContent = "";
      }
    }
    if (els.storyCredit) {
      els.storyCredit.textContent =
        content.level === "beginner"
          ? "Easy text written for new readers. Illustration by Milo Winter via Project Gutenberg / Wikimedia Commons."
          : "Public-domain text adapted from The Æsop for Children (1919). Illustration by Milo Winter via Project Gutenberg / Wikimedia Commons.";
    }
    if (els.storyFinished) {
      const prog = getStoryProgress(story.id);
      const levelFinished = !!prog.finishedLevels[content.level];
      els.storyFinished.disabled = levelFinished;
      const label = els.storyFinished.querySelector("span:last-child");
      if (label) label.textContent = levelFinished ? "Finished!" : "I finished!";
    }
  }

  function openStory(id) {
    const story = getStoryById(id);
    if (!story) return;
    activeStoryId = story.id;
    markStoryOpened(story.id);
    stopStoryReading();
    updateStoryReaderUI();
    showScreen("story");
  }

  function clampWordIndex() {
    if (sightWords.length && state.sightWordIndex >= sightWords.length) {
      state.sightWordIndex = sightWords.length - 1;
    }
  }

  function showScreen(name, opts) {
    if (name !== "sight" && name !== "phonics") stopSayWordListening();
    if (name !== "phonics") {
      phonicsQuizMode = false;
      phonicsListenMode = false;
    }
    if (name !== "story") stopStoryReading();
    const changed = name !== activeScreenName;
    activeScreenName = name;
    if (changed) lastAutoSpokenInstructionKey = "";
    document.querySelectorAll("[data-screen]").forEach((el) => {
      el.hidden = el.getAttribute("data-screen") !== name;
    });
    if (name === "home") updateProgressUI();
    const silent = opts && opts.silent;
    const welcomeOpen = els.welcomeModal && !els.welcomeModal.hidden;
    const nameOpen = els.nameModal && !els.nameModal.hidden;
    if (!silent && changed && !welcomeOpen && !nameOpen) {
      speakInstruction(name);
    }
  }

  function normalizeHeardText(raw) {
    return String(raw || "")
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function heardMatchesTarget(heard, target) {
    const h = normalizeHeardText(heard);
    const t = normalizeHeardText(target);
    if (!h || !t) return false;
    if (h === t) return true;
    const parts = h.split(" ");
    if (parts.includes(t)) return true;
    // Common filler kids/adults add before answering.
    const stripped = h
      .replace(/^(the word|it is|it's|i said|um+|uh+)\s+/i, "")
      .trim();
    return stripped === t || stripped.split(" ").includes(t);
  }

  function setEllieMood(mood) {
    const nodes = [els.sightEllie, els.homeEllie, els.phonicsEllie].filter(
      Boolean
    );
    for (const node of nodes) {
      node.classList.remove("is-listen", "is-cheer", "is-think");
      if (mood) node.classList.add(`is-${mood}`);
    }
  }

  function stopSfxAudio() {
    if (!activeSfxAudio) return;
    try {
      activeSfxAudio.pause();
      activeSfxAudio.currentTime = 0;
    } catch (_) {}
    activeSfxAudio = null;
  }

  /** Play achievement (`correct`) or try-again (`wrong`) cue. */
  function playFeedbackSfx(kind) {
    const id = kind === "success" ? "correct" : kind === "miss" ? "wrong" : "";
    if (!id) return;
    let audio = sfxAudioCache.get(id);
    if (!audio) {
      audio = new Audio(`${SFX_BASE}${id}.mp3`);
      audio.preload = "auto";
      sfxAudioCache.set(id, audio);
    }
    stopSfxAudio();
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (_) {}
    activeSfxAudio = audio;
    const p = audio.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }

  function setSayWordStatus(message, kind) {
    if (!els.sayWordStatus) return;
    els.sayWordStatus.textContent = message || "";
    els.sayWordStatus.className = "say-word-status" + (kind ? ` is-${kind}` : "");
    if (kind === "listening") setEllieMood("listen");
    else if (kind === "success") {
      setEllieMood("cheer");
      playFeedbackSfx("success");
    } else if (kind === "miss") {
      setEllieMood("think");
      playFeedbackSfx("miss");
    } else if (!kind) setEllieMood("");
  }

  function setHeardText(box, text, opts) {
    if (!box) return;
    const listening = !!(opts && opts.listening);
    const placeholder =
      (opts && opts.placeholder) || "Tap the mic and say it";
    const value = String(text || "").trim();
    const empty = !value;
    box.textContent = empty ? placeholder : value;
    box.classList.toggle("is-empty", empty);
    box.classList.toggle("is-listening", listening);
  }

  function clearHeardText(box, placeholder) {
    setHeardText(box, "", {
      placeholder: placeholder || "Tap the mic and say it",
    });
  }

  function setListenHint(el, active) {
    if (!el) return;
    el.classList.toggle("is-active", !!active);
    el.setAttribute("aria-hidden", active ? "false" : "true");
  }

  function setMicButtonListening(btn, listening, idleLabel, listenLabel) {
    if (!btn) return;
    btn.setAttribute("aria-pressed", listening ? "true" : "false");
    const label = btn.querySelector(".say-mic-label");
    if (label) {
      label.textContent = listening
        ? listenLabel || "Listening…"
        : idleLabel || "Say it";
    }
  }

  function setSayWordListeningUi(listening) {
    sayWordListening = listening;
    setMicButtonListening(
      els.sayWordBtn,
      listening,
      "Say the word",
      "Listening…"
    );
    setListenHint(els.sayWordListenHint, listening);
    if (els.sayWordHeard) {
      els.sayWordHeard.classList.toggle("is-listening", !!listening);
    }
  }

  function stopSayWordListening() {
    if (activeRecognition) {
      try {
        activeRecognition.onresult = null;
        activeRecognition.onerror = null;
        activeRecognition.onend = null;
        activeRecognition.abort();
      } catch (_) {}
      activeRecognition = null;
    }
    if (sayWordListening) setSayWordListeningUi(false);
    if (phonicsListenMode) {
      phonicsListenMode = false;
      setPhonicsListeningUi(false);
    }
  }

  function collectRecognitionHypotheses(event) {
    const out = [];
    if (!event || !event.results) return out;
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (!result || !result.isFinal) continue;
      for (let j = 0; j < result.length; j++) {
        const alt = result[j];
        if (alt && alt.transcript) out.push(alt.transcript);
      }
    }
    return out;
  }

  function getRecognitionDisplayText(event) {
    if (!event || !event.results) return "";
    let text = "";
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const alt = result && result[0];
      if (alt && alt.transcript) text += alt.transcript;
    }
    return text.trim();
  }

  function setPhonicsListeningUi(listening) {
    setMicButtonListening(els.phonicsSayBtn, listening, "Say it", "Listening…");
    setListenHint(els.phonicsListenHint, listening);
    if (els.phonicsHeard) {
      els.phonicsHeard.classList.toggle("is-listening", !!listening);
    }
  }

  function startSayWordListening() {
    const entry = getWordEntry(state.sightWordIndex);
    const target = (entry.word || "").trim();
    if (!target) return;

    if (!SpeechRecognitionAPI) {
      setSayWordStatus(
        "Speech recognition isn’t available in this browser. Try Chrome or Edge.",
        "error"
      );
      return;
    }

    if (sayWordListening) {
      stopSayWordListening();
      setSayWordStatus("Canceled.", "");
      return;
    }

    stopPhonemeAudio();
    try {
      speechSynthesis.cancel();
    } catch (_) {}
    stopSayWordListening();

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;
    recognition.continuous = false;

    if (SpeechGrammarListAPI) {
      try {
        const list = new SpeechGrammarListAPI();
        const safe = normalizeHeardText(target).replace(/[^a-z0-9]/g, "");
        if (safe) {
          list.addFromString(
            `#JSGF V1.0; grammar word; public <word> = ${safe} ;`,
            1
          );
          recognition.grammars = list;
        }
      } catch (_) {
        /* grammar optional */
      }
    }

    activeRecognition = recognition;
    clearHeardText(
      els.sayWordHeard,
      "Listening… say the word"
    );
    setSayWordListeningUi(true);
    setSayWordStatus("Listening… say the word clearly.", "listening");

    let matchSettled = false;
    recognition.onresult = (event) => {
      if (matchSettled) return;

      const display = getRecognitionDisplayText(event);
      if (display) {
        setHeardText(els.sayWordHeard, display, { listening: true });
      }

      const hypotheses = collectRecognitionHypotheses(event);
      if (!hypotheses.length) return;

      const matched = hypotheses.some((h) => heardMatchesTarget(h, target));
      const best = hypotheses[0] ? normalizeHeardText(hypotheses[0]) : "";
      if (best) {
        setHeardText(els.sayWordHeard, best, { listening: false });
      }

      if (matched) {
        matchSettled = true;
        setSayWordStatus("Yay! Ellie heard it — you got it!", "success");
        markSightWordMastered(target);
        try {
          recognition.stop();
        } catch (_) {}
      } else if (best) {
        setSayWordStatus(`Ellie heard “${best}”. Try again!`, "miss");
      } else {
        setSayWordStatus("Ellie didn’t catch that. Try again!", "miss");
      }
    };

    recognition.onerror = (event) => {
      const err = (event && event.error) || "";
      if (err === "aborted") return;
      if (err === "not-allowed" || err === "service-not-allowed") {
        setSayWordStatus(
          "Microphone permission is needed to check your reading.",
          "error"
        );
      } else if (err === "no-speech") {
        setSayWordStatus("No speech heard. Tap and try again.", "miss");
      } else if (err === "audio-capture") {
        setSayWordStatus("No microphone found.", "error");
      } else if (err === "network") {
        setSayWordStatus(
          "Speech check needs a network connection in this browser.",
          "error"
        );
      } else {
        setSayWordStatus("Couldn’t listen right now. Try again.", "error");
      }
    };

    recognition.onend = () => {
      activeRecognition = null;
      setSayWordListeningUi(false);
    };

    try {
      recognition.start();
    } catch (_) {
      activeRecognition = null;
      setSayWordListeningUi(false);
      setSayWordStatus("Couldn’t start the microphone. Try again.", "error");
    }
  }

  function getPhonicsEntry(i) {
    const idx = Math.min(
      Math.max(0, i | 0),
      Math.max(0, PHONICS_LETTERS.length - 1)
    );
    return PHONICS_LETTERS[idx];
  }

  function setPhonicsStatus(message, kind) {
    if (!els.phonicsStatus) return;
    els.phonicsStatus.textContent = message || "";
    els.phonicsStatus.className =
      "phonics-status" + (kind ? ` is-${kind}` : "");
    if (kind === "listening") setEllieMood("listen");
    else if (kind === "success") {
      setEllieMood("cheer");
      playFeedbackSfx("success");
    } else if (kind === "miss") {
      setEllieMood("think");
      playFeedbackSfx("miss");
    }
  }

  function playPhonicsSound() {
    const entry = getPhonicsEntry(state.phonicsIndex);
    if (!entry) return;
    stopSayWordListening();
    playPhoneme(entry.phoneme, entry.letter.toLowerCase());
    bumpPhonics(entry.id, "heard");
    setPhonicsStatus(`That’s the sound for ${entry.letter}!`, "");
  }

  function markPhonicsPracticed() {
    const entry = getPhonicsEntry(state.phonicsIndex);
    if (!entry) return;
    bumpPhonics(entry.id, "practiced");
    setPhonicsStatus(`Great practice on ${entry.letter}!`, "success");
    setEllieMood("cheer");
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function startPhonicsQuiz() {
    const entry = getPhonicsEntry(state.phonicsIndex);
    if (!entry || !els.phonicsQuiz || !els.phonicsQuizChoices) return;
    phonicsQuizMode = true;
    stopSayWordListening();
    bumpPhonics(entry.id, "heard");

    const distractors = shuffle(
      PHONICS_LETTERS.filter((L) => L.id !== entry.id)
    ).slice(0, 2);
    const choices = shuffle([entry, ...distractors]);
    els.phonicsQuiz.hidden = false;
    els.phonicsQuizChoices.innerHTML = "";
    choices.forEach((L) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = L.letter;
      btn.addEventListener("click", () => {
        if (L.id === entry.id) {
          bumpPhonics(entry.id, "quizWins");
          setPhonicsStatus(`Yes! ${entry.letter} makes that sound!`, "success");
          phonicsQuizMode = false;
          els.phonicsQuiz.hidden = true;
        } else {
          setPhonicsStatus(`Not ${L.letter}. Listen again and try!`, "miss");
          playPhoneme(entry.phoneme, entry.letter.toLowerCase());
        }
      });
      els.phonicsQuizChoices.appendChild(btn);
    });
    setPhonicsStatus("Listen, then pick the letter!", "listening");
    // Speak the quiz cue first, then play the phoneme (avoid overlapping TTS/MP3).
    let phonemeStarted = false;
    const playQuizPhoneme = () => {
      if (phonemeStarted || !phonicsQuizMode) return;
      phonemeStarted = true;
      playPhoneme(entry.phoneme, entry.letter.toLowerCase());
    };
    const uttered = speakInstruction("phonicsQuiz", {
      force: true,
      onend: playQuizPhoneme,
      onerror: (ev) => {
        if (ev && ev.error === "interrupted") return;
        playQuizPhoneme();
      },
    });
    if (!uttered) playQuizPhoneme();
  }

  function startPhonicsSayListening() {
    const entry = getPhonicsEntry(state.phonicsIndex);
    if (!entry) return;
    if (!SpeechRecognitionAPI) {
      setPhonicsStatus(
        "Speech isn’t available here — tap “I can say it!” instead.",
        "error"
      );
      return;
    }
    if (sayWordListening && phonicsListenMode) {
      stopSayWordListening();
      setPhonicsStatus("Canceled.", "");
      return;
    }

    stopPhonemeAudio();
    try {
      speechSynthesis.cancel();
    } catch (_) {}
    stopSayWordListening();

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;
    recognition.continuous = false;

    const accept = [
      entry.letter.toLowerCase(),
      entry.id,
      entry.example.toLowerCase().replace(/-/g, " "),
      entry.example.toLowerCase().replace(/-/g, ""),
    ];

    phonicsListenMode = true;
    activeRecognition = recognition;
    sayWordListening = true;
    clearHeardText(els.phonicsHeard, "Listening… say the letter");
    setPhonicsListeningUi(true);
    setPhonicsStatus(
      `Say “${entry.letter}” or “${entry.example}”…`,
      "listening"
    );

    recognition.onresult = (event) => {
      const display = getRecognitionDisplayText(event);
      if (display) {
        setHeardText(els.phonicsHeard, display, { listening: true });
      }

      const hypotheses = collectRecognitionHypotheses(event);
      if (!hypotheses.length) return;

      const matched = hypotheses.some((h) => {
        const n = normalizeHeardText(h);
        return accept.some(
          (a) => n === a || n.split(" ").includes(a) || n.includes(a)
        );
      });
      const best = hypotheses[0] ? normalizeHeardText(hypotheses[0]) : "";
      if (best) {
        setHeardText(els.phonicsHeard, best, { listening: false });
      }

      if (matched) {
        bumpPhonics(entry.id, "practiced");
        setPhonicsStatus(`Ellie heard you — nice ${entry.letter}!`, "success");
      } else {
        setPhonicsStatus(
          best
            ? `Heard “${best}”. Try “${entry.letter}” or “${entry.example}”.`
            : "Try again!",
          "miss"
        );
      }
    };

    recognition.onerror = (event) => {
      const err = (event && event.error) || "";
      if (err === "aborted") return;
      if (err === "not-allowed" || err === "service-not-allowed") {
        setPhonicsStatus("Microphone permission is needed.", "error");
      } else if (err === "no-speech") {
        setPhonicsStatus("No speech heard. Try again.", "miss");
      } else {
        setPhonicsStatus("Couldn’t listen. Try again.", "error");
      }
    };

    recognition.onend = () => {
      activeRecognition = null;
      sayWordListening = false;
      phonicsListenMode = false;
      setPhonicsListeningUi(false);
    };

    try {
      recognition.start();
    } catch (_) {
      activeRecognition = null;
      sayWordListening = false;
      phonicsListenMode = false;
      setPhonicsListeningUi(false);
      setPhonicsStatus("Couldn’t start the microphone.", "error");
    }
  }

  function updatePhonicsUI(opts) {
    const keepQuiz = opts && opts.keepQuiz;
    const entry = getPhonicsEntry(state.phonicsIndex);
    if (!entry) return;

    const letterChanged = state.phonicsIndex !== lastPhonicsUiIndex;
    lastPhonicsUiIndex = state.phonicsIndex;
    if (letterChanged) {
      stopSayWordListening();
      clearHeardText(els.phonicsHeard, "Tap the mic and say it");
      if (!keepQuiz) setPhonicsStatus("", "");
    }

    if (els.phonicsLetterBig) els.phonicsLetterBig.textContent = entry.letter;
    if (els.phonicsEmoji) {
      els.phonicsEmoji.textContent = entry.emoji || "";
      els.phonicsEmoji.hidden = !entry.emoji;
    }
    if (els.phonicsExample) {
      els.phonicsExample.textContent = `as in ${entry.example}`;
    }

    if (els.phonicsGrid) {
      els.phonicsGrid.innerHTML = "";
      PHONICS_LETTERS.forEach((L, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "phonics-letter";
        if (idx === state.phonicsIndex) btn.classList.add("is-active");
        if (isPhonicsMastered(L.id)) btn.classList.add("is-mastered");
        const stars = phonicsStars(getPhonicsRecord(L.id));
        btn.innerHTML = `${L.letter}<span class="phonics-letter-stars">${starsLabel(stars)}</span>`;
        btn.setAttribute(
          "aria-label",
          `${L.letter}, ${stars} of 3 stars${isPhonicsMastered(L.id) ? ", mastered" : ""}`
        );
        btn.addEventListener("click", () => {
          state.phonicsIndex = idx;
          phonicsQuizMode = false;
          persistProgress();
          updatePhonicsUI();
        });
        els.phonicsGrid.appendChild(btn);
      });
    }

    if (!keepQuiz && els.phonicsQuiz) {
      els.phonicsQuiz.hidden = true;
      phonicsQuizMode = false;
    }

    if (!SpeechRecognitionAPI && els.phonicsSayBtn) {
      els.phonicsSayBtn.disabled = true;
    }
  }

  function gradeFromPercent(pct) {
    if (pct >= 90) return { letter: "A+", title: "Reading superstar!" };
    if (pct >= 80) return { letter: "A", title: "Awesome work!" };
    if (pct >= 70) return { letter: "B", title: "Great progress!" };
    if (pct >= 55) return { letter: "C", title: "Keep going!" };
    if (pct >= 35) return { letter: "D", title: "You’re learning!" };
    return { letter: "E", title: "Just getting started!" };
  }

  function updateReportCardUI() {
    const { overallPct, phonicsPct, sightPct, storiesPct } = sectionPercents();
    const grade = gradeFromPercent(overallPct);
    if (els.reportGradeBadge) els.reportGradeBadge.textContent = grade.letter;
    if (els.reportGradeTitle) els.reportGradeTitle.textContent = grade.title;
    if (els.reportGradeSummary) {
      els.reportGradeSummary.textContent = `Overall ${overallPct}% · Phonics ${phonicsPct}% · Sight words ${sightPct}% · Stories ${storiesPct}%`;
    }

    if (els.reportLetterGrid) {
      els.reportLetterGrid.innerHTML = "";
      PHONICS_LETTERS.forEach((L) => {
        const stars = phonicsStars(getPhonicsRecord(L.id));
        const cell = document.createElement("div");
        cell.className =
          "report-letter" + (isPhonicsMastered(L.id) ? " is-mastered" : "");
        cell.innerHTML = `${L.letter}<span class="report-letter-stars">${starsLabel(stars)}</span>`;
        els.reportLetterGrid.appendChild(cell);
      });
    }

    if (els.reportWordList) {
      els.reportWordList.innerHTML = "";
      sightWords.forEach((w) => {
        const key = sightWordKey(w.word);
        if (!key) return;
        const li = document.createElement("li");
        li.textContent = key;
        if (isSightWordMastered(key)) li.classList.add("is-mastered");
        els.reportWordList.appendChild(li);
      });
    }

    if (els.reportStoryList) {
      els.reportStoryList.innerHTML = "";
      stories.forEach((story) => {
        const li = document.createElement("li");
        li.textContent = story.title;
        if (getStoryProgress(story.id).finished) li.classList.add("is-mastered");
        els.reportStoryList.appendChild(li);
      });
    }
  }

  function updateHomeGreeting() {
    els.homeGreeting.textContent = state.userName
      ? `Hi, ${state.userName}! Pick an activity with Ellie.`
      : "Pick an activity with Ellie.";
    if (els.ellieBubble) {
      els.ellieBubble.textContent = state.userName
        ? `Hi, ${state.userName}! I’m Ellie — let’s read together!`
        : "Hi! I’m Ellie — let’s read together!";
    }
  }

  function updateSightWordUI() {
    const entry = getWordEntry(state.sightWordIndex);
    const letters = lettersForEntry(entry);
    const wordDisplay = sightWordKey(entry.word);

    els.sightWordTitle.textContent = wordDisplay || "—";
    refreshSightWordMasteryUi();

    els.letterRow.innerHTML = "";
    letters.forEach((ch, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "letter-tile";
      if (String(ch).length > 1) btn.classList.add("letter-tile--chunk");
      btn.textContent = ch;
      const phonemeId = phonemeIdForGrapheme(entry, idx);
      btn.setAttribute(
        "aria-label",
        phonemeId
          ? `Sound for ${ch}`
          : String(ch).length > 1
            ? `Letter group ${ch}`
            : `Letter ${ch}`
      );
      btn.dataset.index = String(idx);
      btn.dataset.phoneme = phonemeId;
      btn.addEventListener("click", () => {
        setActiveLetter(idx);
        speakGraphemeSound(entry, idx);
      });
      els.letterRow.appendChild(btn);
    });

    const max = Math.max(0, letters.length - 1);
    els.scrubSlider.max = String(max);
    state.scrubIndex = Math.min(state.scrubIndex, max);
    els.scrubSlider.value = String(state.scrubIndex);
    setActiveLetter(state.scrubIndex);

    stopSayWordListening();
    setEllieMood("");
    clearHeardText(
      els.sayWordHeard,
      "Tap the mic and say the word"
    );
    if (!SpeechRecognitionAPI) {
      els.sayWordBtn.disabled = true;
      setSayWordStatus(
        "Speech recognition isn’t available in this browser.",
        "error"
      );
    } else {
      els.sayWordBtn.disabled = !wordDisplay;
      setSayWordStatus("", "");
    }
  }

  function setActiveLetter(index) {
    const tiles = els.letterRow.querySelectorAll(".letter-tile");
    tiles.forEach((t, i) => {
      t.classList.toggle("letter-tile--active", i === index);
    });
    state.scrubIndex = index;
    els.scrubSlider.value = String(index);
  }

  async function handleProgressFile(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      applyProgressData(data);
      els.welcomeModal.hidden = true;
      syncControlsFromState();
      updateHomeGreeting();
      updateProgressUI();
      updateStoryLevelPickersUI();
      if (!els.sightScreen.hidden) updateSightWordUI();
      applyVoiceFilters();
      if (!state.userName.trim()) {
        els.nameModal.hidden = false;
        els.nameInput.value = "";
        els.nameInput.focus();
        speakInstruction("name", { force: true });
      } else {
        els.nameModal.hidden = true;
        speakInstruction("home", { force: true });
      }
    } catch (_) {
      alert("Could not read that JSON file. Please pick a valid export.");
    }
  }

  function bindEvents() {
    els.welcomeOpenFile.addEventListener("click", () => {
      speakCue("Open file");
      els.welcomeImportInput.click();
    });

    els.welcomeStartFresh.addEventListener("click", () => {
      resetStateForFreshStart();
      persistProgress();
      syncControlsFromState();
      applyVoiceFilters();
      els.welcomeModal.hidden = true;
      els.nameModal.hidden = false;
      els.nameInput.value = state.userName || "";
      els.nameInput.focus();
      updateHomeGreeting();
      updateProgressUI();
      updateStoryLevelPickersUI();
      speakInstruction("name", { force: true });
    });

    els.welcomeImportInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (file) handleProgressFile(file);
    });

    els.nameForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = els.nameInput.value.trim();
      if (!name) return;
      state.userName = name;
      persistUserName(name);
      persistProgress();
      els.nameModal.hidden = true;
      updateHomeGreeting();
      lastAutoSpokenInstructionKey = "";
      speakInstruction("home", { force: true });
    });

    els.importBtn.addEventListener("click", () => {
      speakCue("Load");
      els.importInput.click();
    });

    els.importInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (file) handleProgressFile(file);
    });

    els.openSettings.addEventListener("click", () => {
      speakCue("Voice");
      syncControlsFromState();
      applyVoiceFilters();
      els.settingsModal.hidden = false;
    });

    els.closeSettings.addEventListener("click", () => {
      els.settingsModal.hidden = true;
    });

    els.settingsModal.addEventListener("click", (e) => {
      if (e.target === els.settingsModal) els.settingsModal.hidden = true;
    });

    els.settingsSave.addEventListener("click", () => {
      state.region = els.regionSelect.value;
      state.onlineOnly = els.onlineToggle.checked;
      state.gender = els.genderSelect.value;
      state.rate = parseFloat(els.rateRange.value) || 0.95;
      state.pitch = parseFloat(els.pitchRange.value) || 1;
      const v = getSelectedVoice();
      if (v) state.voiceName = v.name;
      const previewLine = els.settingsPreviewText.value.trim();
      if (previewLine) persistPreviewText(previewLine);
      persistProgress();
      els.settingsModal.hidden = true;
    });

    els.settingsPreview.addEventListener("click", () => {
      const previewLine = els.settingsPreviewText.value.trim();
      if (!previewLine) return;
      persistPreviewText(previewLine);
      const rate = parseFloat(els.rateRange.value) || state.rate;
      const pitch = parseFloat(els.pitchRange.value) || state.pitch;
      speakText(previewLine, { rate, pitch });
    });

    ["regionSelect", "onlineToggle", "genderSelect"].forEach((id) => {
      els[id].addEventListener("change", applyVoiceFilters);
    });

    els.rateRange.addEventListener("input", () => {
      els.rateValue.textContent = els.rateRange.value;
    });
    els.pitchRange.addEventListener("input", () => {
      els.pitchValue.textContent = els.pitchRange.value;
    });

    els.activitySightWords.addEventListener("click", () => {
      showScreen("sight");
      updateSightWordUI();
    });

    els.activityPhonics.addEventListener("click", () => {
      showScreen("phonics");
      updatePhonicsUI();
    });

    if (els.activityStories) {
      els.activityStories.addEventListener("click", () => {
        showScreen("stories");
        updateStoryLevelPickersUI();
        updateStoriesListUI();
      });
    }

    document.querySelectorAll(".story-level-picker").forEach((picker) => {
      picker.querySelectorAll("[data-level]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const level = normalizeStoryLevel(btn.getAttribute("data-level"));
          setStoryReadingLevel(level, { forcePersist: true });
          const label = STORY_LEVEL_SPEAK[level] || level;
          speakCue(label);
        });
      });
    });

    els.activityReportCard.addEventListener("click", () => {
      showScreen("report");
      updateReportCardUI();
    });

    if (els.storyBackToList) {
      els.storyBackToList.addEventListener("click", () => {
        stopStoryReading();
        showScreen("stories");
        updateStoryLevelPickersUI();
        updateStoriesListUI();
      });
    }

    if (els.storyReadAloud) {
      els.storyReadAloud.addEventListener("click", () => {
        const story = getStoryById(activeStoryId);
        if (story) speakStoryAloud(story);
      });
    }

    if (els.storyStopRead) {
      els.storyStopRead.addEventListener("click", () => {
        stopStoryReading();
        speakCue("Stop");
      });
    }

    if (els.storyFinished) {
      els.storyFinished.addEventListener("click", () => {
        if (!activeStoryId) return;
        speakCue("I finished");
        markStoryFinished(activeStoryId);
      });
    }

    document.querySelectorAll(".js-back-home").forEach((btn) => {
      btn.addEventListener("click", () => {
        stopSayWordListening();
        stopStoryReading();
        showScreen("home");
        updateProgressUI();
      });
    });

    document.querySelectorAll("[data-speak-help]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-speak-help");
        if (key) speakInstruction(key, { force: true });
      });
    });

    const hearHomeAgain = () => speakInstruction("home", { force: true });
    if (els.ellieBubble) {
      els.ellieBubble.addEventListener("click", hearHomeAgain);
      els.ellieBubble.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          hearHomeAgain();
        }
      });
    }
    if (els.homeEllie) {
      els.homeEllie.addEventListener("click", hearHomeAgain);
    }

    els.prevWord.addEventListener("click", () => {
      if (state.sightWordIndex <= 0) return;
      state.sightWordIndex--;
      state.scrubIndex = 0;
      persistProgress();
      updateSightWordUI();
    });

    els.nextWord.addEventListener("click", () => {
      if (state.sightWordIndex >= sightWords.length - 1) return;
      state.sightWordIndex++;
      state.scrubIndex = 0;
      persistProgress();
      updateSightWordUI();
    });

    els.prevPhonicsLetter.addEventListener("click", () => {
      if (state.phonicsIndex <= 0) return;
      state.phonicsIndex--;
      persistProgress();
      updatePhonicsUI();
    });

    els.nextPhonicsLetter.addEventListener("click", () => {
      if (state.phonicsIndex >= PHONICS_LETTERS.length - 1) return;
      state.phonicsIndex++;
      persistProgress();
      updatePhonicsUI();
    });

    els.phonicsPlaySound.addEventListener("click", () => playPhonicsSound());
    els.phonicsISaidIt.addEventListener("click", () => markPhonicsPracticed());
    els.phonicsSayBtn.addEventListener("click", () => startPhonicsSayListening());
    els.phonicsStartQuiz.addEventListener("click", () => startPhonicsQuiz());

    els.sayWordBtn.addEventListener("click", () => {
      startSayWordListening();
    });

    els.sightWordTitle.addEventListener("click", () => {
      stopSayWordListening();
      const entry = getWordEntry(state.sightWordIndex);
      if (entry.word) speakWholeWord(entry.word);
    });

    /** Last scrub index that played a phoneme (Lotty-style: one sound per letter). */
    let lastScrubPhonemeIndex = -1;
    els.scrubSlider.addEventListener("input", () => {
      const i = parseInt(els.scrubSlider.value, 10) || 0;
      setActiveLetter(i);
      if (i === lastScrubPhonemeIndex) return;
      lastScrubPhonemeIndex = i;
      const entry = getWordEntry(state.sightWordIndex);
      const letters = lettersForEntry(entry);
      if (letters[i]) speakGraphemeSound(entry, i);
    });
    els.scrubSlider.addEventListener("change", () => {
      lastScrubPhonemeIndex = -1;
    });

    els.exportBtn.addEventListener("click", () => {
      speakCue("Save");
      const payload = {
        ...buildProgressPayload(),
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `reading-progress-${state.userName || "learner"}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  function cacheElements() {
    els.welcomeModal = $("welcomeModal");
    els.welcomeOpenFile = $("welcomeOpenFile");
    els.welcomeStartFresh = $("welcomeStartFresh");
    els.welcomeImportInput = $("welcomeImportInput");
    els.nameModal = $("nameModal");
    els.nameForm = $("nameForm");
    els.nameInput = $("nameInput");
    els.homeGreeting = $("homeGreeting");
    els.settingsModal = $("settingsModal");
    els.openSettings = $("openSettings");
    els.closeSettings = $("closeSettings");
    els.settingsSave = $("settingsSave");
    els.settingsPreview = $("settingsPreview");
    els.settingsPreviewText = $("settingsPreviewText");
    els.regionSelect = $("regionSelect");
    els.onlineToggle = $("onlineToggle");
    els.genderSelect = $("genderSelect");
    els.voiceSelect = $("voiceSelect");
    els.rateRange = $("rateRange");
    els.pitchRange = $("pitchRange");
    els.rateValue = $("rateValue");
    els.pitchValue = $("pitchValue");
    els.activitySightWords = $("activitySightWords");
    els.activityPhonics = $("activityPhonics");
    els.activityStories = $("activityStories");
    els.activityReportCard = $("activityReportCard");
    els.storiesReportText = $("storiesReportText");
    els.storiesProgressBar = $("storiesProgressBar");
    els.storiesProgressFill = $("storiesProgressFill");
    els.storiesList = $("storiesList");
    els.storiesLevelPicker = $("storiesLevelPicker");
    els.storyLevelPicker = $("storyLevelPicker");
    els.storyBackToList = $("storyBackToList");
    els.storyImage = $("storyImage");
    els.storyTitle = $("storyTitle");
    els.storyMeta = $("storyMeta");
    els.storyBody = $("storyBody");
    els.storyMoral = $("storyMoral");
    els.storyReadAloud = $("storyReadAloud");
    els.storyStopRead = $("storyStopRead");
    els.storyFinished = $("storyFinished");
    els.storyCredit = $("storyCredit");
    els.reportStoryList = $("reportStoryList");
    els.sightScreen = $("sightScreen");
    els.sightWordTitle = $("sightWordTitle");
    els.sightWordProgress = $("sightWordProgress");
    els.letterRow = $("letterRow");
    els.scrubSlider = $("scrubSlider");
    els.prevWord = $("prevWord");
    els.nextWord = $("nextWord");
    els.sayWordBtn = $("sayWordBtn");
    els.sayWordStatus = $("sayWordStatus");
    els.sayWordHeard = $("sayWordHeard");
    els.sayWordListenHint = $("sayWordListenHint");
    els.sightEllie = $("sightEllie");
    els.homeEllie = $("homeEllie");
    els.ellieBubble = $("ellieBubble");
    els.overallProgressLabel = $("overallProgressLabel");
    els.overallProgressBar = $("overallProgressBar");
    els.overallProgressFill = $("overallProgressFill");
    els.phonicsReportText = $("phonicsReportText");
    els.phonicsProgressBar = $("phonicsProgressBar");
    els.phonicsProgressFill = $("phonicsProgressFill");
    els.sightReportText = $("sightReportText");
    els.sightProgressBar = $("sightProgressBar");
    els.sightProgressFill = $("sightProgressFill");
    els.phonicsGrid = $("phonicsGrid");
    els.phonicsLetterBig = $("phonicsLetterBig");
    els.phonicsEmoji = $("phonicsEmoji");
    els.phonicsExample = $("phonicsExample");
    els.phonicsPlaySound = $("phonicsPlaySound");
    els.phonicsISaidIt = $("phonicsISaidIt");
    els.phonicsSayBtn = $("phonicsSayBtn");
    els.phonicsStatus = $("phonicsStatus");
    els.phonicsHeard = $("phonicsHeard");
    els.phonicsListenHint = $("phonicsListenHint");
    els.phonicsQuiz = $("phonicsQuiz");
    els.phonicsQuizChoices = $("phonicsQuizChoices");
    els.phonicsStartQuiz = $("phonicsStartQuiz");
    els.phonicsEllie = $("phonicsEllie");
    els.prevPhonicsLetter = $("prevPhonicsLetter");
    els.nextPhonicsLetter = $("nextPhonicsLetter");
    els.reportGradeBadge = $("reportGradeBadge");
    els.reportGradeTitle = $("reportGradeTitle");
    els.reportGradeSummary = $("reportGradeSummary");
    els.reportLetterGrid = $("reportLetterGrid");
    els.reportWordList = $("reportWordList");
    els.exportBtn = $("exportBtn");
    els.importBtn = $("importBtn");
    els.importInput = $("importInput");
    els.cloudAuthBtn = $("cloudAuthBtn");
    els.cloudAuthCaption = $("cloudAuthCaption");
  }

  async function init() {
    cacheElements();
    loadPersistedProfile();
    const hasSavedProgress = loadPersistedProgress();
    bindEvents();
    bindCloudAuth();

    await loadWordsFromJson();
    await loadStoriesFromJson();
    clampWordIndex();
    preloadPhonemeAudio();

    speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    syncControlsFromState();
    updateHomeGreeting();
    updateProgressUI();
    updateStoryLevelPickersUI();

    if (hasSavedProgress) {
      els.welcomeModal.hidden = true;
      if (!state.userName.trim()) {
        els.nameModal.hidden = false;
        els.nameInput.value = "";
        els.nameInput.focus();
      } else {
        els.nameModal.hidden = true;
      }
    } else {
      els.welcomeModal.hidden = false;
      els.nameModal.hidden = true;
    }

    showScreen("home", { silent: true });
    if (!els.welcomeModal.hidden) {
      speakInstruction("welcome", { force: true });
    } else if (!els.nameModal.hidden) {
      speakInstruction("name", { force: true });
    } else {
      speakInstruction("home", { force: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
