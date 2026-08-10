(function () {
  "use strict";

  const LS_USER_NAME = "learntoread_userName";
  const LS_PREVIEW_TEXT = "learntoread_previewText";
  const LS_PROGRESS = "learntoread_progress";
  const DEFAULT_PREVIEW_TEXT = "Hello! I will help you read.";
  /** Current progress payload schema (multi-profile). */
  const PROGRESS_VERSION = 4;
  /** Debounce window for uploading progress to Firestore after local changes. */
  const CLOUD_UPLOAD_DEBOUNCE_MS = 1500;
  /** Parental gate: adult must tap this word among decoys. */
  const PARENTAL_GATE_CODE_WORD = "elephant";
  const PARENTAL_GATE_DECOYS = ["banana", "rainbow", "cookie", "pencil"];

  /** Optional Ellie accent themes (avatar color). */
  const ELLIE_COLOR_KEYS = ["pink", "mint", "sky", "sun", "grape", "coral"];
  const ELLIE_COLOR_SWATCH = {
    pink: "#ff6b8a",
    mint: "#3ecfbe",
    sky: "#6bb7ff",
    sun: "#ffc94a",
    grape: "#a78bfa",
    coral: "#ff8a6a",
  };

  /** K–12 grade keys shown in onboarding. */
  const GRADE_KEYS = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

  /** Touch-friendly age bands → representative age + approximate grade. */
  const AGE_BANDS = [
    { id: "4-5", label: "Ages 4–5", age: 5, grade: "K" },
    { id: "6-7", label: "Ages 6–7", age: 6, grade: "1" },
    { id: "8-9", label: "Ages 8–9", age: 8, grade: "3" },
    { id: "10-12", label: "Ages 10–12", age: 11, grade: "5" },
    { id: "13+", label: "Ages 13+", age: 13, grade: "8" },
  ];

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

  /** Visual scaffolds for sight words (hide after a few practices). */
  const SIGHT_WORD_EMOJIS = {
    hat: "🎩",
    the: "👉",
    and: "➕",
    a: "🅰️",
    to: "➡️",
    is: "🟰",
    you: "🫵",
    it: "📦",
    in: "📥",
    said: "💬",
    for: "🎁",
    up: "⬆️",
    look: "👀",
    go: "🚶",
    we: "👥",
    can: "💪",
    see: "👀",
    my: "💙",
    like: "❤️",
    at: "📍",
    play: "🎮",
  };
  const SIGHT_EMOJI_HIDE_AFTER = 3;

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

  /**
   * Magic-e (silent e) long vowel sounds: cake/grapes → ey, bike → ay, etc.
   * Used when a word is split as V + Ce (matching sight-word style like like → I + KE).
   */
  const MAGIC_E_LONG_VOWEL = {
    a: "ey",
    e: "iy",
    i: "ay",
    o: "ow",
    u: "yuw",
  };

  /** Single consonants that can sit between the vowel and silent e (not w/y). */
  const MAGIC_E_CONSONANTS = "bcdfghjklmnpqrstvz";

  /**
   * Common words that look like VCe but keep a short/irregular vowel.
   * (Keeps cat/hop-style shorts unaffected; only blocks false magic-e hits.)
   */
  const MAGIC_E_EXCEPTIONS = new Set([
    "are",
    "have",
    "give",
    "live",
    "love",
    "come",
    "some",
    "done",
    "gone",
    "none",
    "were",
    "where",
    "there",
    "here",
    "one",
    "once",
    "else",
    "false",
    "move",
    "prove",
    "above",
    "whose",
    "lose",
    "sure",
  ]);

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

  /**
   * Speech-to-text spellings of isolated letter *sounds* (phonemes).
   * Used for phonics mic mastery — not letter names or example words.
   */
  const PHONEME_SPEECH_ALIASES = {
    ae: ["ae", "a", "ah", "aa", "aeh", "short a"],
    eh: ["eh", "e", "ehh", "short e"],
    ih: ["ih", "i", "ihh", "short i"],
    aa: ["aa", "ah", "o", "aw", "ahh", "short o"],
    ah: ["ah", "uh", "u", "uhh", "short u"],
    b: ["b", "buh", "bah", "bu", "bih", "ba"],
    k: ["k", "kuh", "cuh", "ka", "kah", "keh", "c", "ck"],
    d: ["d", "duh", "dah", "dih", "da"],
    f: ["f", "fff", "ff", "fuh", "fah", "ph"],
    g: ["g", "guh", "gah", "gih", "ga"],
    hh: ["h", "hh", "huh", "hah", "hhh", "ha"],
    jh: ["j", "jh", "juh", "jah", "jih", "ja", "dge"],
    l: ["l", "lll", "ll", "luh", "lah", "ul"],
    m: ["m", "mmm", "mm", "muh", "mah"],
    n: ["n", "nnn", "nn", "nuh", "nah"],
    p: ["p", "puh", "pah", "pih", "pa"],
    kw: ["kw", "qu", "qw", "q", "kwa", "kuhwuh"],
    r: ["r", "rrr", "rr", "ruh", "rah", "er"],
    s: ["s", "sss", "ss", "suh", "sah"],
    t: ["t", "tuh", "tah", "tih", "ta"],
    v: ["v", "vvv", "vv", "vuh", "vah"],
    w: ["w", "wuh", "wah", "www", "wu", "wh"],
    ks: ["ks", "x", "ccks", "kuhs"],
    y: ["y", "yuh", "yah", "yih", "yu", "ya"],
    z: ["z", "zzz", "zz", "zuh", "zah"],
  };

  /** Spoken letter *names* that must not count as saying the sound. */
  const LETTER_NAME_SPEECH = {
    a: ["ay", "aye", "ei"],
    b: ["be", "bee", "bea"],
    c: ["see", "sea", "cee", "ce"],
    d: ["dee", "de", "dea"],
    e: ["ee", "ea", "eee"],
    f: ["ef", "eff"],
    g: ["gee", "jee", "ge"],
    h: ["aitch", "aitch", "haitch"],
    i: ["eye", "aye", "ai"],
    j: ["jay", "jaye"],
    k: ["kay", "cay"],
    l: ["el", "ell", "elle"],
    m: ["em", "emm"],
    n: ["en", "enn"],
    o: ["oh", "owe"],
    p: ["pee", "pe"],
    q: ["cue", "queue", "kyu", "kyoo"],
    r: ["are"],
    s: ["ess", "es"],
    t: ["tee", "tea", "te"],
    u: ["you", "yu", "yew"],
    v: ["vee", "ve"],
    w: ["double u", "double you", "doubleyou", "doubleyu"],
    x: ["ex", "eks"],
    y: ["why", "wye"],
    z: ["zee", "zed", "zea"],
  };

  /** Kid-facing prompt for “say the sound” (one clear spelling). */
  const PHONEME_SOUND_HINT = {
    ae: "ah",
    eh: "eh",
    ih: "ih",
    aa: "ah",
    ah: "uh",
    b: "buh",
    k: "kuh",
    d: "duh",
    f: "fff",
    g: "guh",
    hh: "huh",
    jh: "juh",
    l: "lll",
    m: "mmm",
    n: "nnn",
    p: "puh",
    kw: "kw",
    r: "rrr",
    s: "sss",
    t: "tuh",
    v: "vvv",
    w: "wuh",
    ks: "ks",
    y: "yuh",
    z: "zzz",
  };

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
  /** @type {{ id: string, onset: string, coda: string, vowels: string[], words: string[] }[]} */
  let vowelFamilies = [];
  /** @type {{ word: string, display: string }[]} */
  let flashcardWords = [];
  let stories = [];
  let activeStoryId = "";
  let storyPageIndex = 0;
  let storyReading = false;
  let storyReadGen = 0;
  let storyKaraokeActiveEl = null;
  let storyKaraokeTimerIds = [];
  /** @type {object | null} */
  let storyBlendEntry = null;
  let storyBlendScrubIndex = -1;
  let storyBlendLastPhonemeIndex = -1;

  const STORY_LEVELS = ["beginner", "advanced"];
  const STORY_LEVEL_SPEAK = {
    beginner: "Easy",
    advanced: "Longer",
  };
  /** Paragraphs per story page (Easy packs short lines; Longer packs denser ones). */
  const STORY_PAGE_SIZE = {
    beginner: 2,
    advanced: 1,
  };

  const state = {
    userName: "",
    previewText: DEFAULT_PREVIEW_TEXT,
    sightWordIndex: 0,
    vowelFamilyIndex: 0,
    vowelVowelIndex: 0,
    flashcardWordIndex: 0,
    phonicsIndex: 0,
    phonicsMastery: {},
    sightMastery: {},
    sightPracticeCounts: {},
    vowelFamilyPracticed: {},
    vowelWordMastery: {},
    flashcardMastery: {},
    storiesProgress: {},
    storyReadingLevel: "beginner",
    profileAge: null,
    profileGrade: "",
    ellieColor: "pink",
    region: "",
    onlineOnly: true,
    gender: "both",
    voiceName: "",
    rate: 0.95,
    pitch: 1.05,
    scrubIndex: -1,
  };

  /** Tiny glue words skipped when the story-word deck gets large. */
  const FLASHCARD_STOP_WORDS = new Set([
    "a",
    "an",
    "the",
    "to",
    "of",
    "and",
    "or",
    "for",
    "with",
    "as",
    "by",
    "from",
    "at",
  ]);

  /** Story character / proper names float to the front of the deck. */
  const FLASHCARD_NAME_PRIORITY = [
    "nan",
    "pip",
    "dot",
    "hare",
    "tortoise",
    "lion",
    "mouse",
    "fox",
    "wolf",
  ];

  /** Multi-profile store keyed by profile id. */
  const profilesStore = {
    activeProfileId: "",
    /** @type {Record<string, object>} */
    profiles: {},
  };

  const els = {};

  /** @type {object | null} Firebase Auth user when signed in. */
  let cloudUser = null;
  let cloudUploadTimer = null;
  let cloudSyncPaused = false;
  let cloudAuthSpeakPending = false;
  /** @type {null | (() => void)} Called after successful parental gate. */
  let parentalGateOnSuccess = null;
  /** Pending grade/age choice while onboarding (before Continue). */
  let pendingLevelChoice = { grade: "", age: null, ageBandId: "" };

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

  function loadPersistedPreviewText() {
    try {
      const p = localStorage.getItem(LS_PREVIEW_TEXT);
      if (p != null && String(p).trim()) state.previewText = String(p).trim();
    } catch (_) {}
    if (!state.previewText) state.previewText = DEFAULT_PREVIEW_TEXT;
  }

  function newProfileId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeGrade(grade) {
    const g = String(grade || "").trim().toUpperCase();
    if (g === "K" || g === "KINDERGARTEN") return "K";
    if (GRADE_KEYS.includes(g)) return g;
    const n = parseInt(g, 10);
    if (Number.isFinite(n) && n >= 1 && n <= 12) return String(n);
    return "";
  }

  function normalizeEllieColor(color) {
    const key = String(color || "").trim().toLowerCase();
    return ELLIE_COLOR_KEYS.includes(key) ? key : "pink";
  }

  function normalizeAge(age) {
    const n = typeof age === "number" ? age : parseInt(age, 10);
    if (!Number.isFinite(n) || n < 3 || n > 19) return null;
    return n | 0;
  }

  /** Map K–12 (or age) to default story reading level. */
  function storyLevelForGradeOrAge(grade, age) {
    const g = normalizeGrade(grade);
    if (g === "K" || g === "1") return "beginner";
    if (g) return "advanced";
    const a = normalizeAge(age);
    if (a != null) return a <= 6 ? "beginner" : "advanced";
    return "beginner";
  }

  function profileHasLevel(profile) {
    if (!profile) return false;
    return !!(normalizeGrade(profile.grade) || normalizeAge(profile.age) != null);
  }

  function emptyLearningFields() {
    return {
      sightWordIndex: 0,
      vowelFamilyIndex: 0,
      flashcardWordIndex: 0,
      phonicsIndex: 0,
      phonicsMastery: {},
      sightMastery: {},
      sightPracticeCounts: {},
      vowelFamilyPracticed: {},
      vowelWordMastery: {},
      flashcardMastery: {},
      storiesProgress: {},
      storyReadingLevel: "beginner",
    };
  }

  function createEmptyProfile(opts) {
    const o = opts || {};
    const now = new Date().toISOString();
    return {
      id: o.id || newProfileId(),
      name: String(o.name || "").trim(),
      age: normalizeAge(o.age),
      grade: normalizeGrade(o.grade),
      ellieColor: normalizeEllieColor(o.ellieColor),
      createdAt: o.createdAt || now,
      updatedAt: o.updatedAt || now,
      ...emptyLearningFields(),
      storyReadingLevel:
        o.storyReadingLevel != null
          ? normalizeStoryLevel(o.storyReadingLevel)
          : storyLevelForGradeOrAge(o.grade, o.age),
    };
  }

  function listProfilesSorted() {
    return Object.values(profilesStore.profiles).sort((a, b) => {
      const ta = Date.parse(a.createdAt) || 0;
      const tb = Date.parse(b.createdAt) || 0;
      if (ta !== tb) return ta - tb;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }

  function getActiveProfile() {
    return profilesStore.profiles[profilesStore.activeProfileId] || null;
  }

  function ensureActiveProfile() {
    if (getActiveProfile()) return getActiveProfile();
    const list = listProfilesSorted();
    if (list.length) {
      profilesStore.activeProfileId = list[0].id;
      return list[0];
    }
    const p = createEmptyProfile({ name: "" });
    profilesStore.profiles[p.id] = p;
    profilesStore.activeProfileId = p.id;
    return p;
  }

  function applyEllieTheme(color) {
    const key = normalizeEllieColor(color);
    state.ellieColor = key;
    const body = document.body;
    if (!body) return;
    ELLIE_COLOR_KEYS.forEach((c) => {
      body.classList.remove(`ellie-theme-${c}`);
    });
    if (key !== "pink") body.classList.add(`ellie-theme-${key}`);
  }

  function gradeLabel(grade) {
    const g = normalizeGrade(grade);
    if (!g) return "";
    return g === "K" ? "Grade K" : `Grade ${g}`;
  }

  function profileLevelLabel(profile) {
    if (!profile) return "";
    const g = gradeLabel(profile.grade);
    if (g) return g;
    const age = normalizeAge(profile.age);
    if (age != null) return `Age ${age}`;
    return "";
  }

  function syncActiveProfileFromState() {
    const p = getActiveProfile();
    if (!p) return;
    p.name = String(state.userName || "").trim();
    p.age = normalizeAge(state.profileAge);
    p.grade = normalizeGrade(state.profileGrade);
    p.ellieColor = normalizeEllieColor(state.ellieColor);
    p.sightWordIndex = state.sightWordIndex | 0;
    p.vowelFamilyIndex = state.vowelFamilyIndex | 0;
    p.flashcardWordIndex = state.flashcardWordIndex | 0;
    p.phonicsIndex = state.phonicsIndex | 0;
    p.phonicsMastery = state.phonicsMastery || {};
    p.sightMastery = state.sightMastery || {};
    p.sightPracticeCounts = state.sightPracticeCounts || {};
    p.vowelFamilyPracticed = state.vowelFamilyPracticed || {};
    p.vowelWordMastery = state.vowelWordMastery || {};
    p.flashcardMastery = state.flashcardMastery || {};
    p.storiesProgress = state.storiesProgress || {};
    p.storyReadingLevel = getStoryReadingLevel();
    p.updatedAt = new Date().toISOString();
  }

  function loadProfileIntoState(profile) {
    const p = profile || ensureActiveProfile();
    state.userName = String(p.name || "").trim();
    state.profileAge = normalizeAge(p.age);
    state.profileGrade = normalizeGrade(p.grade);
    state.ellieColor = normalizeEllieColor(p.ellieColor);
    state.sightWordIndex = Math.max(0, p.sightWordIndex | 0);
    state.vowelFamilyIndex = Math.max(0, p.vowelFamilyIndex | 0);
    state.vowelVowelIndex = 0;
    state.flashcardWordIndex = Math.max(0, p.flashcardWordIndex | 0);
    state.phonicsIndex = Math.max(0, p.phonicsIndex | 0);
    state.phonicsMastery =
      p.phonicsMastery && typeof p.phonicsMastery === "object"
        ? { ...p.phonicsMastery }
        : {};
    state.sightMastery =
      p.sightMastery && typeof p.sightMastery === "object"
        ? { ...p.sightMastery }
        : {};
    state.sightPracticeCounts =
      p.sightPracticeCounts && typeof p.sightPracticeCounts === "object"
        ? { ...p.sightPracticeCounts }
        : {};
    state.vowelFamilyPracticed =
      p.vowelFamilyPracticed && typeof p.vowelFamilyPracticed === "object"
        ? { ...p.vowelFamilyPracticed }
        : {};
    state.vowelWordMastery =
      p.vowelWordMastery && typeof p.vowelWordMastery === "object"
        ? { ...p.vowelWordMastery }
        : {};
    state.flashcardMastery =
      p.flashcardMastery && typeof p.flashcardMastery === "object"
        ? { ...p.flashcardMastery }
        : {};
    state.storiesProgress =
      p.storiesProgress && typeof p.storiesProgress === "object"
        ? { ...p.storiesProgress }
        : {};
    state.storyReadingLevel = normalizeStoryLevel(p.storyReadingLevel);
    state.scrubIndex = -1;
    persistUserName(state.userName);
    applyEllieTheme(state.ellieColor);
    if (sightWords.length) {
      state.sightWordIndex = Math.min(
        state.sightWordIndex,
        Math.max(0, sightWords.length - 1)
      );
    }
    clampVowelFamilyIndex();
    clampFlashcardIndex();
    state.phonicsIndex = Math.min(
      state.phonicsIndex,
      Math.max(0, PHONICS_LETTERS.length - 1)
    );
  }

  function applyDeviceSettingsFromPayload(data) {
    if (!data || typeof data !== "object") return;
    if (data.voiceName != null) state.voiceName = String(data.voiceName);
    if (data.region != null) state.region = String(data.region);
    if (typeof data.onlineOnly === "boolean") state.onlineOnly = data.onlineOnly;
    if (data.gender != null) state.gender = String(data.gender);
    if (typeof data.rate === "number") state.rate = data.rate;
    if (typeof data.pitch === "number") state.pitch = data.pitch;
  }

  function resetLearningStateOnly() {
    state.sightWordIndex = 0;
    state.vowelFamilyIndex = 0;
    state.vowelVowelIndex = 0;
    state.flashcardWordIndex = 0;
    state.phonicsIndex = 0;
    state.phonicsMastery = {};
    state.sightMastery = {};
    state.sightPracticeCounts = {};
    state.vowelFamilyPracticed = {};
    state.vowelWordMastery = {};
    state.flashcardMastery = {};
    state.storiesProgress = {};
    state.storyReadingLevel = "beginner";
    state.scrubIndex = -1;
  }

  function resetDeviceVoiceSettings() {
    state.region = "";
    state.onlineOnly = true;
    state.gender = "both";
    state.voiceName = "";
    state.rate = 0.95;
    state.pitch = 1.05;
  }

  /**
   * Migrate legacy v3 (or flatter) single-user progress into a profiles map.
   * @returns {{ activeProfileId: string, profiles: Record<string, object> }}
   */
  function migrateLegacyProgressToProfiles(data) {
    let legacyName = "";
    try {
      const u = localStorage.getItem(LS_USER_NAME);
      if (u != null) legacyName = String(u).trim();
    } catch (_) {}
    const name =
      (data && data.userName != null && String(data.userName).trim()) ||
      legacyName ||
      "Reader";
    const profile = createEmptyProfile({
      name,
      age: data && data.profileAge != null ? data.profileAge : null,
      grade: data && data.profileGrade != null ? data.profileGrade : "",
      ellieColor: data && data.ellieColor != null ? data.ellieColor : "pink",
      storyReadingLevel:
        data && data.storyReadingLevel != null
          ? data.storyReadingLevel
          : "beginner",
    });
    if (data && typeof data === "object") {
      if (Number.isFinite(data.sightWordIndex))
        profile.sightWordIndex = Math.max(0, data.sightWordIndex | 0);
      if (Number.isFinite(data.vowelFamilyIndex))
        profile.vowelFamilyIndex = Math.max(0, data.vowelFamilyIndex | 0);
      if (Number.isFinite(data.flashcardWordIndex))
        profile.flashcardWordIndex = Math.max(0, data.flashcardWordIndex | 0);
      if (Number.isFinite(data.phonicsIndex))
        profile.phonicsIndex = Math.max(0, data.phonicsIndex | 0);
      if (data.phonicsMastery && typeof data.phonicsMastery === "object") {
        profile.phonicsMastery = { ...data.phonicsMastery };
      }
      if (data.sightMastery && typeof data.sightMastery === "object") {
        profile.sightMastery = { ...data.sightMastery };
      }
      if (
        data.sightPracticeCounts &&
        typeof data.sightPracticeCounts === "object"
      ) {
        profile.sightPracticeCounts = { ...data.sightPracticeCounts };
      }
      if (
        data.vowelFamilyPracticed &&
        typeof data.vowelFamilyPracticed === "object"
      ) {
        profile.vowelFamilyPracticed = { ...data.vowelFamilyPracticed };
      }
      if (data.vowelWordMastery && typeof data.vowelWordMastery === "object") {
        profile.vowelWordMastery = { ...data.vowelWordMastery };
      }
      if (data.flashcardMastery && typeof data.flashcardMastery === "object") {
        profile.flashcardMastery = { ...data.flashcardMastery };
      }
      if (data.storiesProgress && typeof data.storiesProgress === "object") {
        profile.storiesProgress = { ...data.storiesProgress };
      }
    }
    return { activeProfileId: profile.id, profiles: { [profile.id]: profile } };
  }

  function normalizeProfilesMap(rawProfiles) {
    const out = {};
    if (!rawProfiles || typeof rawProfiles !== "object") return out;
    const entries = Array.isArray(rawProfiles)
      ? rawProfiles.map((p) => [p && p.id, p])
      : Object.entries(rawProfiles);
    entries.forEach(([key, raw]) => {
      if (!raw || typeof raw !== "object") return;
      const id = String(raw.id || key || "").trim() || newProfileId();
      const p = createEmptyProfile({
        id,
        name: raw.name,
        age: raw.age,
        grade: raw.grade,
        ellieColor: raw.ellieColor,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        storyReadingLevel: raw.storyReadingLevel,
      });
      if (Number.isFinite(raw.sightWordIndex))
        p.sightWordIndex = Math.max(0, raw.sightWordIndex | 0);
      if (Number.isFinite(raw.vowelFamilyIndex))
        p.vowelFamilyIndex = Math.max(0, raw.vowelFamilyIndex | 0);
      if (Number.isFinite(raw.flashcardWordIndex))
        p.flashcardWordIndex = Math.max(0, raw.flashcardWordIndex | 0);
      if (Number.isFinite(raw.phonicsIndex))
        p.phonicsIndex = Math.max(0, raw.phonicsIndex | 0);
      if (raw.phonicsMastery && typeof raw.phonicsMastery === "object") {
        p.phonicsMastery = { ...raw.phonicsMastery };
      }
      if (raw.sightMastery && typeof raw.sightMastery === "object") {
        p.sightMastery = { ...raw.sightMastery };
      }
      if (
        raw.sightPracticeCounts &&
        typeof raw.sightPracticeCounts === "object"
      ) {
        p.sightPracticeCounts = { ...raw.sightPracticeCounts };
      }
      if (
        raw.vowelFamilyPracticed &&
        typeof raw.vowelFamilyPracticed === "object"
      ) {
        p.vowelFamilyPracticed = { ...raw.vowelFamilyPracticed };
      }
      if (raw.vowelWordMastery && typeof raw.vowelWordMastery === "object") {
        p.vowelWordMastery = { ...raw.vowelWordMastery };
      }
      if (raw.flashcardMastery && typeof raw.flashcardMastery === "object") {
        p.flashcardMastery = { ...raw.flashcardMastery };
      }
      if (raw.storiesProgress && typeof raw.storiesProgress === "object") {
        p.storiesProgress = { ...raw.storiesProgress };
      }
      out[id] = p;
    });
    return out;
  }

  function adoptProfilesStore(activeProfileId, profiles) {
    profilesStore.profiles = profiles && typeof profiles === "object" ? profiles : {};
    profilesStore.activeProfileId = String(activeProfileId || "");
    ensureActiveProfile();
    loadProfileIntoState(getActiveProfile());
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
      storyPageIndex = 0;
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
   * Supports leveled `pages`, `levels` packs, and legacy flat `paragraphs`.
   */
  function getStoryLevelContent(story, level) {
    if (!story) {
      return {
        level: "beginner",
        title: "",
        paragraphs: [],
        moral: "",
        pages: [],
      };
    }
    const lvl = normalizeStoryLevel(level || getStoryReadingLevel());
    const levels =
      story.levels && typeof story.levels === "object" ? story.levels : null;
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

    const resolvedLevel = pack
      ? levels && levels[lvl]
        ? lvl
        : levels && levels.beginner
          ? "beginner"
          : "advanced"
      : "advanced";

    const title = String(
      (pack && pack.title) || story.title || ""
    ).trim();
    const moral = String(
      (pack && pack.moral) || story.moral || ""
    ).trim();

    const explicitPages = buildStoryPages(story, resolvedLevel);
    const paragraphs = explicitPages.length
      ? explicitPages.flatMap((p) => p.paragraphs)
      : (Array.isArray(pack && pack.paragraphs)
          ? pack.paragraphs
          : Array.isArray(story.paragraphs)
            ? story.paragraphs
            : []
        )
          .map((p) => String(p || "").trim())
          .filter(Boolean);

    return {
      level: resolvedLevel,
      title,
      paragraphs,
      moral,
      pages: explicitPages,
      coverImage: String(story.image || "").trim(),
      coverImageAlt: String(story.imageAlt || "").trim(),
    };
  }

  function normalizePageParagraphs(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map((p) => String(p || "").trim()).filter(Boolean);
  }

  /** Prefer explicit story.pages; otherwise chunk legacy paragraphs. */
  function buildStoryPages(story, level) {
    const lvl = normalizeStoryLevel(level);
    const cover = String((story && story.image) || "").trim();
    const coverAlt = String((story && story.imageAlt) || "").trim();

    if (story && Array.isArray(story.pages) && story.pages.length) {
      return story.pages.map((page) => {
        const paras =
          normalizePageParagraphs(page && page[lvl]).length
            ? normalizePageParagraphs(page[lvl])
            : normalizePageParagraphs(page && page.beginner);
        return {
          paragraphs: paras,
          image: String((page && page.image) || cover).trim(),
          imageAlt: String((page && page.imageAlt) || coverAlt).trim(),
        };
      });
    }

    const levels =
      story && story.levels && typeof story.levels === "object"
        ? story.levels
        : null;
    const pack =
      (levels && levels[lvl]) ||
      (levels && levels.beginner) ||
      null;
    const paragraphs = normalizePageParagraphs(
      (pack && pack.paragraphs) || (story && story.paragraphs)
    );
    return chunkStoryParagraphs(
      paragraphs,
      storyPageSizeForLevel(lvl)
    ).map((paras) => ({
      paragraphs: paras,
      image: cover,
      imageAlt: coverAlt,
    }));
  }

  function storyPageSizeForLevel(level) {
    const key = normalizeStoryLevel(level);
    return Math.max(1, STORY_PAGE_SIZE[key] | 0);
  }

  function chunkStoryParagraphs(paragraphs, pageSize) {
    const list = Array.isArray(paragraphs) ? paragraphs : [];
    const size = Math.max(1, pageSize | 0);
    const pages = [];
    for (let i = 0; i < list.length; i += size) {
      pages.push(list.slice(i, i + size));
    }
    if (!pages.length) pages.push([]);
    return pages;
  }

  function getStoryPages(content) {
    if (content && Array.isArray(content.pages) && content.pages.length) {
      return content.pages;
    }
    return chunkStoryParagraphs(
      content && content.paragraphs,
      storyPageSizeForLevel(content && content.level)
    ).map((paras) => ({
      paragraphs: paras,
      image: String((content && content.coverImage) || "").trim(),
      imageAlt: String((content && content.coverImageAlt) || "").trim(),
    }));
  }

  function clampStoryPageIndex(pageCount) {
    const max = Math.max(0, (pageCount | 0) - 1);
    if (!Number.isFinite(storyPageIndex) || storyPageIndex < 0) {
      storyPageIndex = 0;
    }
    if (storyPageIndex > max) storyPageIndex = max;
    return storyPageIndex;
  }

  /** Current page slice of a story level (moral only on the last page). */
  function getStoryPageContent(content) {
    const pages = getStoryPages(content);
    clampStoryPageIndex(pages.length);
    const current = pages[storyPageIndex] || {
      paragraphs: [],
      image: "",
      imageAlt: "",
    };
    const isLast = storyPageIndex >= pages.length - 1;
    return {
      level: content.level,
      title: content.title,
      paragraphs: current.paragraphs || [],
      moral: isLast ? content.moral : "",
      image:
        current.image ||
        (content && content.coverImage) ||
        "",
      imageAlt:
        current.imageAlt ||
        (content && content.coverImageAlt) ||
        content.title ||
        "",
      pageIndex: storyPageIndex,
      pageCount: pages.length,
      isFirst: storyPageIndex <= 0,
      isLast,
    };
  }

  function updateStoryPageNavUI(page) {
    const count = (page && page.pageCount) | 0;
    const show = count > 1;
    const isLast = !!(page && page.isLast);
    if (els.storyPageNav) els.storyPageNav.hidden = !show;
    if (els.storyContinueWrap) {
      els.storyContinueWrap.hidden = !show || isLast;
    }
    if (!show) return;
    const idx = ((page && page.pageIndex) | 0) + 1;
    if (els.storyPageLabel) {
      els.storyPageLabel.textContent = `Page ${idx} of ${count}`;
    }
    if (els.storyPrevPage) {
      els.storyPrevPage.disabled = !!(page && page.isFirst);
    }
    if (els.storyNextPage) {
      els.storyNextPage.disabled = isLast;
    }
  }

  function goStoryPage(delta) {
    const story = getStoryById(activeStoryId);
    if (!story) return;
    const content = getStoryLevelContent(story);
    const pages = getStoryPages(content);
    const next = (storyPageIndex | 0) + (delta | 0);
    if (next < 0 || next >= pages.length) return;
    stopStoryReading({ skipRestore: true });
    storyPageIndex = next;
    updateStoryReaderUI();
    speakCue(delta < 0 ? "Previous" : "Next");
  }

  function countStoriesFinished() {
    if (!stories.length) return 0;
    return stories.filter((s) => getStoryProgress(s.id).finished).length;
  }

  function sectionPercents() {
    const phonicsTotal = PHONICS_LETTERS.length || 1;
    const sightTotal = Math.max(1, sightWords.length);
    const flashTotal = Math.max(1, flashcardWords.length);
    const storiesTotal = Math.max(1, stories.length);
    const phonicsPct = Math.round(
      (countPhonicsMastered() / phonicsTotal) * 100
    );
    const sightPct = Math.round((countSightMastered() / sightTotal) * 100);
    const flashcardsPct = Math.round(
      (countFlashcardMastered() / flashTotal) * 100
    );
    const storiesPct = Math.round(
      (countStoriesFinished() / storiesTotal) * 100
    );
    const overallPct = Math.round(
      (phonicsPct + sightPct + storiesPct + flashcardsPct) / 4
    );
    return { phonicsPct, sightPct, storiesPct, flashcardsPct, overallPct };
  }

  function setProgressBar(barEl, fillEl, pct) {
    const value = Math.max(0, Math.min(100, pct | 0));
    if (fillEl) fillEl.style.width = `${value}%`;
    if (barEl) barEl.setAttribute("aria-valuenow", String(value));
  }

  function updateProgressUI() {
    const { phonicsPct, sightPct, storiesPct, flashcardsPct, overallPct } =
      sectionPercents();
    const phonicsDone = countPhonicsMastered();
    const sightDone = countSightMastered();
    const flashDone = countFlashcardMastered();
    const storiesDone = countStoriesFinished();
    const vowelDone = countVowelFamiliesPracticed();
    const vowelTotal = Math.max(1, vowelFamilies.length);
    const vowelPct = Math.round((vowelDone / vowelTotal) * 100);

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
    setProgressBar(els.vowelProgressBar, els.vowelProgressFill, vowelPct);
    setProgressBar(
      els.storiesProgressBar,
      els.storiesProgressFill,
      storiesPct
    );
    setProgressBar(
      els.flashcardsProgressBar,
      els.flashcardsProgressFill,
      flashcardsPct
    );

    if (els.phonicsReportText) {
      els.phonicsReportText.textContent = `${phonicsDone} of ${PHONICS_LETTERS.length} letter sounds mastered`;
    }
    if (els.sightReportText) {
      els.sightReportText.textContent = `${sightDone} of ${sightWords.length} words mastered`;
    }
    if (els.vowelReportText) {
      els.vowelReportText.textContent = `${vowelDone} of ${vowelFamilies.length} families practiced`;
    }
    if (els.flashcardsReportText) {
      els.flashcardsReportText.textContent = `${flashDone} of ${flashcardWords.length} words mastered`;
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

  function emojiForSightWord(entry) {
    if (!entry) return "";
    const fromEntry = String(entry.emoji || "").trim();
    if (fromEntry) return fromEntry;
    const key = sightWordKey(entry.word);
    return (key && SIGHT_WORD_EMOJIS[key]) || "";
  }

  function getSightPracticeCount(word) {
    const key = sightWordKey(word);
    if (!key) return 0;
    return Math.max(0, (state.sightPracticeCounts || {})[key] | 0);
  }

  function shouldShowSightEmoji(word) {
    return getSightPracticeCount(word) < SIGHT_EMOJI_HIDE_AFTER;
  }

  /** Count a successful spoken practice toward fading the emoji scaffold. */
  function bumpSightPractice(word) {
    const key = sightWordKey(word);
    if (!key) return;
    if (!state.sightPracticeCounts || typeof state.sightPracticeCounts !== "object") {
      state.sightPracticeCounts = {};
    }
    const next = (state.sightPracticeCounts[key] | 0) + 1;
    state.sightPracticeCounts[key] = next;
    persistProgress();
    updateSightWordEmojiUI();
  }

  function updateSightWordEmojiUI() {
    if (!els.sightWordEmojiBtn || !els.sightWordEmoji) return;
    const entry = getWordEntry(state.sightWordIndex);
    const emoji = emojiForSightWord(entry);
    const show = !!(emoji && shouldShowSightEmoji(entry.word));
    els.sightWordEmoji.textContent = emoji;
    els.sightWordEmojiBtn.hidden = !show;
    els.sightWordEmojiBtn.setAttribute(
      "aria-label",
      show ? `Picture hint for ${sightWordKey(entry.word) || "word"}` : ""
    );
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

  function flashcardWordKey(word) {
    return sightWordKey(word);
  }

  function isFlashcardMastered(word) {
    const key = flashcardWordKey(word);
    return !!(key && state.flashcardMastery[key]);
  }

  function countFlashcardMastered() {
    if (!flashcardWords.length) return 0;
    return flashcardWords.filter((w) => isFlashcardMastered(w.word)).length;
  }

  function getFlashcardEntry(i) {
    if (!flashcardWords.length) return { word: "", display: "" };
    return flashcardWords[
      Math.min(Math.max(0, i), flashcardWords.length - 1)
    ];
  }

  function clampFlashcardIndex() {
    if (!flashcardWords.length) {
      state.flashcardWordIndex = 0;
      return;
    }
    state.flashcardWordIndex = Math.min(
      Math.max(0, state.flashcardWordIndex | 0),
      flashcardWords.length - 1
    );
  }

  function refreshFlashcardMasteryUi() {
    const entry = getFlashcardEntry(state.flashcardWordIndex);
    const key = flashcardWordKey(entry.word);
    const mastered = isFlashcardMastered(key);

    if (els.flashcardWordTitle) {
      els.flashcardWordTitle.classList.toggle("is-mastered", mastered);
      if (key) {
        els.flashcardWordTitle.setAttribute(
          "aria-label",
          mastered ? "Hear word (mastered)" : "Hear word"
        );
      }
    }
    if (els.flashcardKnowBtn) {
      const label = els.flashcardKnowBtn.querySelector("span:last-child");
      if (label) label.textContent = mastered ? "Known!" : "I know it!";
      els.flashcardKnowBtn.disabled = mastered;
    }
    if (!els.flashcardWordProgress) return;
    if (!flashcardWords.length) {
      els.flashcardWordProgress.textContent = "No story words yet";
      return;
    }
    els.flashcardWordProgress.textContent = mastered
      ? `Word ${state.flashcardWordIndex + 1} of ${flashcardWords.length} · Mastered!`
      : `Word ${state.flashcardWordIndex + 1} of ${flashcardWords.length}`;
  }

  function updateFlashcardUI() {
    clampFlashcardIndex();
    const entry = getFlashcardEntry(state.flashcardWordIndex);
    if (els.flashcardWordTitle) {
      els.flashcardWordTitle.textContent = entry.display || entry.word || "—";
    }
    refreshFlashcardMasteryUi();
  }

  function markFlashcardMastered(word) {
    const key = flashcardWordKey(word);
    if (!key) return false;
    let newly = false;
    if (!state.flashcardMastery[key]) {
      state.flashcardMastery[key] = true;
      newly = true;
      persistProgress();
      updateProgressUI();
    }
    refreshFlashcardMasteryUi();
    return newly;
  }

  function hearCurrentFlashcard() {
    const entry = getFlashcardEntry(state.flashcardWordIndex);
    if (!entry.word) return;
    speakWholeWord(entry.word);
  }

  /**
   * Build a kid-friendly flashcard deck from Easy (beginner) story page text.
   * Letters-only tokens length >= 2, case-insensitive dedupe; tiny stop words
   * dropped when the raw set is large. Names first, then frequency, then A–Z.
   */
  function extractStoryFlashcardWords(storyList) {
    const freq = new Map();
    const list = Array.isArray(storyList) ? storyList : [];
    for (const story of list) {
      if (!story || !Array.isArray(story.pages)) continue;
      for (const page of story.pages) {
        const lines = page && Array.isArray(page.beginner) ? page.beginner : [];
        for (const line of lines) {
          const tokens = String(line || "").match(/[A-Za-z']+/g) || [];
          for (const token of tokens) {
            const cleaned = wordForSpeech(token).replace(/'/g, "");
            if (!/^[a-z]{2,}$/.test(cleaned)) continue;
            freq.set(cleaned, (freq.get(cleaned) || 0) + 1);
          }
        }
      }
    }
    let keys = [...freq.keys()];
    if (keys.length > 60) {
      keys = keys.filter((w) => !FLASHCARD_STOP_WORDS.has(w));
    }
    const nameRank = new Map(
      FLASHCARD_NAME_PRIORITY.map((name, i) => [name, i])
    );
    keys.sort((a, b) => {
      const aName = nameRank.has(a);
      const bName = nameRank.has(b);
      if (aName && bName) return nameRank.get(a) - nameRank.get(b);
      if (aName) return -1;
      if (bName) return 1;
      const freqDiff = (freq.get(b) || 0) - (freq.get(a) || 0);
      if (freqDiff) return freqDiff;
      return a.localeCompare(b);
    });
    return keys.map((word) => ({
      word,
      display: word.charAt(0).toUpperCase() + word.slice(1),
    }));
  }

  function rebuildFlashcardDeck() {
    flashcardWords = extractStoryFlashcardWords(stories);
    clampFlashcardIndex();
  }

  function bumpPhonics(id, field) {
    const rec = getPhonicsRecord(id);
    rec[field] = (rec[field] | 0) + 1;
    persistProgress();
    updateProgressUI();
    updatePhonicsUI({ keepQuiz: phonicsQuizMode });
  }

  function buildProgressPayload() {
    ensureActiveProfile();
    syncActiveProfileFromState();
    const active = getActiveProfile();
    return {
      version: PROGRESS_VERSION,
      savedAt: new Date().toISOString(),
      activeProfileId: profilesStore.activeProfileId,
      profiles: profilesStore.profiles,
      // Convenience mirrors for active profile (export / older tools).
      userName: state.userName,
      profileAge: state.profileAge,
      profileGrade: state.profileGrade,
      ellieColor: state.ellieColor,
      sightWordIndex: state.sightWordIndex,
      vowelFamilyIndex: state.vowelFamilyIndex,
      flashcardWordIndex: state.flashcardWordIndex,
      phonicsIndex: state.phonicsIndex,
      phonicsMastery: state.phonicsMastery,
      sightMastery: state.sightMastery,
      sightPracticeCounts: state.sightPracticeCounts,
      vowelFamilyPracticed: state.vowelFamilyPracticed,
      vowelWordMastery: state.vowelWordMastery,
      flashcardMastery: state.flashcardMastery,
      storiesProgress: state.storiesProgress,
      storyReadingLevel: getStoryReadingLevel(),
      voiceName: state.voiceName,
      region: state.region,
      onlineOnly: state.onlineOnly,
      gender: state.gender,
      rate: state.rate,
      pitch: state.pitch,
      // Keep a pointer for readers that only inspect top-level name.
      activeProfileName: active ? active.name : state.userName,
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

  function mergeCountMaps(a, b) {
    const out = {};
    const keys = new Set([
      ...Object.keys(a && typeof a === "object" ? a : {}),
      ...Object.keys(b && typeof b === "object" ? b : {}),
    ]);
    keys.forEach((k) => {
      out[k] = Math.max(
        (a && a[k]) | 0,
        (b && b[k]) | 0
      );
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
      vowelFamilyIndex: Math.max(
        local.vowelFamilyIndex | 0,
        remote.vowelFamilyIndex | 0
      ),
      flashcardWordIndex: Math.max(
        local.flashcardWordIndex | 0,
        remote.flashcardWordIndex | 0
      ),
      phonicsIndex: Math.max(local.phonicsIndex | 0, remote.phonicsIndex | 0),
      phonicsMastery: mergePhonicsMasteryMaps(
        local.phonicsMastery,
        remote.phonicsMastery
      ),
      sightMastery: mergeSightMasteryMaps(local.sightMastery, remote.sightMastery),
      sightPracticeCounts: mergeCountMaps(
        local.sightPracticeCounts,
        remote.sightPracticeCounts
      ),
      vowelFamilyPracticed: mergeSightMasteryMaps(
        local.vowelFamilyPracticed,
        remote.vowelFamilyPracticed
      ),
      vowelWordMastery: mergeSightMasteryMaps(
        local.vowelWordMastery,
        remote.vowelWordMastery
      ),
      flashcardMastery: mergeSightMasteryMaps(
        local.flashcardMastery,
        remote.flashcardMastery
      ),
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
    // Keep Google sync hidden until we turn it back on for parents.
    els.cloudAuthBtn.hidden = true;
    const cloud = getEllieCloud();
    const ready = !!(cloud && cloud.isConfigured && cloud.isConfigured());
    els.cloudAuthBtn.classList.toggle("icon-btn--needs-setup", !ready);
    if (!ready) {
      els.cloudAuthBtn.classList.remove("icon-btn--signed-in");
      els.cloudAuthBtn.title =
        "Google sync needs setup. Grown-ups: tap for instructions.";
      els.cloudAuthBtn.setAttribute(
        "aria-label",
        "Google sync needs setup. Tap for instructions."
      );
      els.cloudAuthBtn.dataset.speak = "Google setup";
      if (els.cloudAuthCaption) els.cloudAuthCaption.textContent = "Google";
      return;
    }
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

  function explainGoogleSetup() {
    speakCue("Ask a grown-up to finish Google setup");
    alert(
      "Google sync isn’t set up yet.\n\n" +
        "Grown-ups: create a Firebase web app, enable Google sign-in + Firestore, " +
        "then put the web config into firebase-config.js (see README). " +
        "Add this site’s domain (e.g. read.ensign.quest) under Authentication → Settings → Authorized domains.\n\n" +
        "Until then, progress still saves in this browser, and Settings → Save JSON works as a backup."
    );
  }

  function bindCloudAuth() {
    updateCloudAuthUI();
    const cloud = getEllieCloud();
    if (cloud && cloud.isConfigured && cloud.isConfigured()) {
      try {
        cloud.ensureInit();
        cloud.onAuthChange(async (user) => {
          cloudUser = user || null;
          updateCloudAuthUI();
          if (user) {
            await syncCloudWithLocal(user);
          } else {
            cloudAuthSpeakPending = false;
          }
        });
      } catch (err) {
        console.warn("Ellie cloud sync: auth bind failed", err);
      }
    }

    if (!els.cloudAuthBtn || els.cloudAuthBtn.dataset.bound === "1") return;
    els.cloudAuthBtn.dataset.bound = "1";
    els.cloudAuthBtn.addEventListener("click", async () => {
      const live = getEllieCloud();
      const ready = !!(live && live.isConfigured && live.isConfigured());
      if (!ready) {
        explainGoogleSetup();
        return;
      }
      if (cloudUser) {
        speakCue("Sign out");
        try {
          await live.signOutUser();
        } catch (err) {
          console.warn("Ellie cloud sync: sign-out failed", err);
        }
        return;
      }
      speakCue("Google");
      cloudAuthSpeakPending = true;
      try {
        await live.signInWithGoogle();
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
        const msg =
          code === "auth/unauthorized-domain"
            ? "This website domain isn’t allowed in Firebase yet. Add read.ensign.quest under Authentication → Settings → Authorized domains."
            : code === "auth/popup-blocked"
              ? "The sign-in popup was blocked. Allow popups for this site and try again."
              : "Could not sign in with Google. Check Firebase Auth setup and authorized domains.";
        speakCue("Try again");
        alert(msg);
      }
    });
  }

  function whenCloudReady(cb) {
    if (getEllieCloud()) {
      cb();
      return;
    }
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (getEllieCloud() || tries > 50) {
        clearInterval(timer);
        cb();
      }
    }, 50);
  }

  function refreshUiAfterProgressApply() {
    syncControlsFromState();
    applyEllieTheme(state.ellieColor);
    updateHomeGreeting();
    updateProgressUI();
    updateStoryLevelPickersUI();
    if (els.sightScreen && !els.sightScreen.hidden) updateSightWordUI();
    if (els.vowelsScreen && !els.vowelsScreen.hidden) updateVowelWordsUI();
    if (els.flashcardsScreen && !els.flashcardsScreen.hidden) updateFlashcardUI();
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
      const needsMigrate =
        !data.profiles ||
        typeof data.profiles !== "object" ||
        (data.version | 0) < PROGRESS_VERSION;
      applyProgressData(data, { persist: false });
      if (needsMigrate) persistProgress();
      return true;
    } catch (_) {
      return false;
    }
  }

  function resetStateForFreshStart() {
    resetDeviceVoiceSettings();
    const p = createEmptyProfile({ name: state.userName || "" });
    profilesStore.profiles = { [p.id]: p };
    profilesStore.activeProfileId = p.id;
    loadProfileIntoState(p);
  }

  function applyProgressData(data, opts) {
    const shouldPersist = !opts || opts.persist !== false;
    if (!data || typeof data !== "object") return;

    applyDeviceSettingsFromPayload(data);

    if (data.profiles && typeof data.profiles === "object") {
      const profiles = normalizeProfilesMap(data.profiles);
      let activeId = String(data.activeProfileId || "").trim();
      if (!profiles[activeId]) {
        activeId = Object.keys(profiles)[0] || "";
      }
      if (!activeId) {
        const migrated = migrateLegacyProgressToProfiles(data);
        adoptProfilesStore(migrated.activeProfileId, migrated.profiles);
      } else {
        adoptProfilesStore(activeId, profiles);
      }
    } else {
      const migrated = migrateLegacyProgressToProfiles(data);
      adoptProfilesStore(migrated.activeProfileId, migrated.profiles);
    }

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

  /** Digraph / letter longest-match split (no magic-e handling). */
  function segmentGraphemesBasic(raw) {
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

  /** True when stem is a simple magic-e word (…VCe), e.g. cake, grape, bike. */
  function isMagicEStem(stem) {
    if (!stem || stem.length < 3 || MAGIC_E_EXCEPTIONS.has(stem)) return false;
    if (stem[stem.length - 1] !== "e") return false;
    const cons = stem[stem.length - 2];
    const vowel = stem[stem.length - 3];
    if (!MAGIC_E_LONG_VOWEL[vowel]) return false;
    if (!MAGIC_E_CONSONANTS.includes(cons)) return false;
    // Avoid vowel digraphs (house → …use with ou; please → …ase with ea).
    if (stem.length >= 4 && "aeiou".includes(stem[stem.length - 4])) return false;
    return true;
  }

  /**
   * Parse trailing magic-e (+ optional plural s): grapes → grape + s.
   * @returns {{ prefix: string, vowel: string, cons: string, pluralS: boolean } | null}
   */
  function parseMagicE(lower) {
    if (!lower || MAGIC_E_EXCEPTIONS.has(lower)) return null;
    let pluralS = false;
    let stem = lower;
    if (
      stem.length >= 5 &&
      stem.endsWith("s") &&
      !stem.endsWith("ss") &&
      isMagicEStem(stem.slice(0, -1))
    ) {
      pluralS = true;
      stem = stem.slice(0, -1);
    }
    if (!isMagicEStem(stem)) return null;
    return {
      prefix: stem.slice(0, -3),
      vowel: stem[stem.length - 3],
      cons: stem[stem.length - 2],
      pluralS,
    };
  }

  /** Consonant sound for a Ce chunk (soft c/g before silent e). */
  function magicEConsPhoneme(cons) {
    const c = String(cons || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    if (!c) return "";
    if (c === "c") return "s";
    if (c === "g") return "jh";
    return DEFAULT_GRAPHEME_PHONEME[c] || "";
  }

  /**
   * Letters + phoneme ids for a bare word (story blend, missing JSON fields).
   * Magic-e: grapes → G R A PE S / g r ey p s (silent e not sounded alone).
   */
  function phonicsForWord(raw) {
    const word = (raw || "").trim();
    if (!word) return { letters: [], phonemes: [] };
    const lower = word.toLowerCase().replace(/\s+/g, "");
    const magic = parseMagicE(lower);
    if (magic) {
      const prefixRaw = word.slice(0, magic.prefix.length);
      const prefixLetters = segmentGraphemesBasic(prefixRaw);
      const vowelAt = magic.prefix.length;
      const letters = [
        ...prefixLetters,
        word.slice(vowelAt, vowelAt + 1).toUpperCase(),
        word.slice(vowelAt + 1, vowelAt + 3).toUpperCase(),
      ];
      const phonemes = [
        ...prefixLetters.map((g) => defaultPhonemeForGrapheme(g)),
        MAGIC_E_LONG_VOWEL[magic.vowel],
        magicEConsPhoneme(magic.cons),
      ];
      if (magic.pluralS) {
        letters.push(word.slice(-1).toUpperCase());
        phonemes.push("s");
      }
      return { letters, phonemes };
    }
    const letters = segmentGraphemesBasic(word);
    return {
      letters,
      phonemes: letters.map((g) => defaultPhonemeForGrapheme(g)),
    };
  }

  function segmentWordIntoGraphemes(raw) {
    return phonicsForWord(raw).letters;
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
    return phonicsForWord(w).letters;
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
    // Silent-e chunk (KE, PE, CE): sound the consonant, not short /ɛ/.
    if (g.length === 2 && g[1] === "e") {
      return magicEConsPhoneme(g[0]);
    }
    if (g.length > 1) {
      const last = g[g.length - 1];
      if (DEFAULT_GRAPHEME_PHONEME[last]) return DEFAULT_GRAPHEME_PHONEME[last];
    }
    return DEFAULT_GRAPHEME_PHONEME[g[0]] || "";
  }

  /**
   * Phoneme id for a letter tile (from words.json or magic-e / phonics defaults).
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
    const inferred = phonicsForWord(entry.word || "");
    if (
      inferred.letters.length === letters.length &&
      inferred.letters.every((g, i) => g === letters[i])
    ) {
      return inferred.phonemes[idx] || "";
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
        return "Sight words. Tap a letter for one sound. Start the slider on the left, then slide to blend. Then say the word.";
      case "vowels":
        return "Vowel words. Same letters, new vowel. Tap a, e, i, o, or u to change the middle letter. Tap the word to hear it. Then say it.";
      case "flashcards":
        return "Story words. Tap the big word to hear it. Tap I know it when you can read it. Use Next for another word.";
      case "stories":
        return "Stories. Pick Easy or Longer, then pick a First Words or Fables tale. Look at the picture, or tap Read aloud.";
      case "story": {
        const story = getStoryById(activeStoryId);
        const content = getStoryLevelContent(story);
        const page = getStoryPageContent(content);
        const title = content.title || (story && story.title) || "This story";
        const levelName =
          STORY_LEVEL_SPEAK[content.level] || STORY_LEVEL_SPEAK.beginner;
        if (page.pageIndex > 0) {
          return `Page ${page.pageIndex + 1} of ${page.pageCount}. Look at the picture. Tap a word to break it into sounds. Tap Read aloud to hear this page.`;
        }
        return `${title}. ${levelName} level. Look at the picture. Tap a word to blend its sounds. Turn the pages as you read. Tap Read aloud to listen. Tap I finished when you're done.`;
      }
      case "report":
        return "Report card. Here are your stars for letters, words, and stories.";
      case "welcome":
        return "Welcome! Progress saves on this device. Tap Start, or Open file for a backup.";
      case "name":
        return "What is your name? Type it, then tap Next.";
      case "level":
        return "Grown-ups: pick a school grade from K to 12, or an age band. Then tap Let's read.";
      case "profiles":
        return "Who's reading? Tap your name. Grown-ups can add or delete readers.";
      case "phonicsQuiz":
        return "Listen. Which letter makes this sound?";
      case "parentalGate":
        return `Ask a grown-up. Grown-ups, tap the word ${PARENTAL_GATE_CODE_WORD}.`;
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

  /** Strip edge punctuation so a tapped token like "fox." speaks as "fox". */
  function wordForSpeech(token) {
    return String(token || "")
      .replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, "")
      .replace(/’/g, "'")
      .trim()
      .toLowerCase();
  }

  function speakPhonicsExample() {
    const entry = getPhonicsEntry(state.phonicsIndex);
    if (!entry || !entry.example) return;
    stopSayWordListening();
    speakText(String(entry.example).toLowerCase());
  }

  const STORY_WORD_DOUBLE_MS = 320;
  const STORY_WORD_LONG_MS = 480;
  let storyWordClickTimer = null;
  let storyWordLongTimer = null;
  let storyWordIgnoreClick = false;

  function speakStoryWordOnly(wordEl) {
    const toSpeak = wordForSpeech(wordEl && wordEl.textContent);
    if (!toSpeak) return;
    if (storyReading) stopStoryReading({ skipRestore: true });
    speakText(toSpeak);
  }

  function clearStoryWordLongPress() {
    if (storyWordLongTimer) {
      clearTimeout(storyWordLongTimer);
      storyWordLongTimer = null;
    }
  }

  function clearStoryWordClickDelay() {
    if (storyWordClickTimer) {
      clearTimeout(storyWordClickTimer);
      storyWordClickTimer = null;
    }
  }

  function speakTappedStoryWord(wordEl) {
    speakStoryWordOnly(wordEl);
  }

  function entryForStoryWord(rawWord) {
    const key = sightWordKey(wordForSpeech(rawWord));
    if (!key) return { word: "" };
    const known = sightWords.find((w) => sightWordKey(w.word) === key);
    if (known) return known;
    return { word: key };
  }

  function hideStoryWordBlend() {
    storyBlendEntry = null;
    storyBlendScrubIndex = -1;
    storyBlendLastPhonemeIndex = -1;
    if (els.storyBlendModal) els.storyBlendModal.hidden = true;
    document.querySelectorAll(".story-word.is-blend-target").forEach((el) => {
      el.classList.remove("is-blend-target");
    });
  }

  function setStoryBlendActiveLetter(index) {
    if (!els.storyBlendLetters) return;
    const letterIndex = Number.isFinite(index) ? index | 0 : -1;
    const tiles = els.storyBlendLetters.querySelectorAll(".letter-tile");
    tiles.forEach((t, i) => {
      t.classList.toggle(
        "letter-tile--active",
        letterIndex >= 0 && i === letterIndex
      );
    });
    storyBlendScrubIndex = letterIndex;
    if (els.storyBlendSlider) {
      els.storyBlendSlider.value = String(
        scrubValueFromLetterIndex(letterIndex)
      );
    }
  }

  function renderStoryBlendUI(entry) {
    if (
      !els.storyBlendModal ||
      !els.storyBlendLetters ||
      !els.storyBlendSlider
    ) {
      return;
    }
    const letters = lettersForEntry(entry);
    const wordDisplay = sightWordKey(entry.word) || "—";
    if (els.storyBlendWord) {
      els.storyBlendWord.textContent = wordDisplay;
      els.storyBlendWord.setAttribute(
        "aria-label",
        `Hear whole word ${wordDisplay}`
      );
    }
    els.storyBlendLetters.innerHTML = "";
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
      btn.addEventListener("click", () => {
        setStoryBlendActiveLetter(idx);
        speakGraphemeSound(entry, idx);
      });
      els.storyBlendLetters.appendChild(btn);
    });
    els.storyBlendSlider.min = "0";
    els.storyBlendSlider.max = String(letters.length);
    storyBlendScrubIndex = -1;
    storyBlendLastPhonemeIndex = -1;
    setStoryBlendActiveLetter(-1);
    els.storyBlendModal.hidden = false;
  }

  function openStoryWordBlend(wordEl) {
    const toSpeak = wordForSpeech(wordEl && wordEl.textContent);
    if (!toSpeak || !els.storyBlendModal) return;
    if (storyReading) stopStoryReading({ skipRestore: true });

    document.querySelectorAll(".story-word.is-blend-target").forEach((el) => {
      el.classList.remove("is-blend-target");
    });
    wordEl.classList.add("is-blend-target");

    const entry = entryForStoryWord(toSpeak);
    storyBlendEntry = entry;
    renderStoryBlendUI(entry);
    speakText(toSpeak);
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

  async function loadVowelWordsFromJson() {
    try {
      const res = await fetch("data/vowel-words.json", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const list = data.families;
      if (Array.isArray(list) && list.length) {
        const normalized = list
          .map((item) => normalizeVowelFamily(item))
          .filter(Boolean);
        if (normalized.length) {
          vowelFamilies = normalized;
          clampVowelFamilyIndex();
          return;
        }
      }
    } catch (_) {
      /* offline / missing */
    }
    vowelFamilies = DEFAULT_VOWEL_FAMILIES.map((item) =>
      normalizeVowelFamily(item)
    ).filter(Boolean);
    clampVowelFamilyIndex();
  }

  async function loadStoriesFromJson() {
    try {
      const res = await fetch("data/stories.json", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const list = data.stories;
      if (Array.isArray(list) && list.length) {
        stories = list.filter((s) => s && s.id && s.title);
        rebuildFlashcardDeck();
        return;
      }
    } catch (_) {
      /* offline / missing */
    }
    stories = [];
    rebuildFlashcardDeck();
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
   * Render paragraphs / moral as karaoke word spans for read-aloud.
   * Title is only shown and spoken on the first page.
   */
  function prepareStoryKaraoke(content) {
    clearStoryKaraokeHighlight();
    hideStoryWordBlend();
    const tracks = [];
    if (!content) return tracks;

    const showTitle = !!(content.title && (content.isFirst || content.pageIndex === 0));
    const titleRow = els.storyTitle && els.storyTitle.closest(".lead-row");
    if (els.storyTitle) {
      if (showTitle) {
        const built = buildKaraokeMarkup(content.title);
        els.storyTitle.hidden = false;
        if (titleRow) titleRow.hidden = false;
        els.storyTitle.textContent = "";
        els.storyTitle.appendChild(built.frag);
        // Do not speak the title on every Read aloud — kids already heard it
        // when opening the story. Keep it tappable on page 1 only.
      } else {
        els.storyTitle.hidden = true;
        els.storyTitle.textContent = content.title || "";
        if (titleRow) titleRow.hidden = true;
      }
    }

    if (els.storyLevelPicker) {
      // Level choice belongs on page 1; later pages are just the story.
      els.storyLevelPicker.hidden = !showTitle;
    }
    if (els.storyMeta) {
      els.storyMeta.hidden = !showTitle;
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
    const page = getStoryPageContent(content);
    const tracks = prepareStoryKaraoke(page);
    updateStoryPageNavUI(page);
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

    const CATEGORY_ORDER = ["primer", "bible", "bom", "fable"];
    const CATEGORY_LABELS = {
      primer: "First Words",
      bible: "Bible",
      bom: "Book of Mormon",
      fable: "Fables",
      other: "Stories",
    };
    const CATEGORY_NOTES = {
      primer: "Books 1–12 · grow with each story",
    };
    const groups = { primer: [], bible: [], bom: [], fable: [], other: [] };
    stories.forEach((story) => {
      const cat = String(story.category || "").trim();
      if (cat === "primer" || cat === "bible" || cat === "bom" || cat === "fable") groups[cat].push(story);
      else groups.other.push(story);
    });
    const primerOrder = (story) => {
      const n = Number(story.seriesOrder);
      if (Number.isFinite(n)) return n;
      const m = String(story.id || "").match(/primer-(\d+)/i);
      return m ? Number(m[1]) : 999;
    };
    groups.primer.sort((a, b) => primerOrder(a) - primerOrder(b) || String(a.id).localeCompare(String(b.id)));

    const appendStoryCard = (story, grid) => {
      const prog = getStoryProgress(story.id);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "story-card" + (prog.finished ? " is-finished" : "");
      btn.setAttribute("aria-label", story.title);
      btn.dataset.speak = story.title;

      const img = document.createElement("img");
      img.className = "story-card-thumb";
      img.src = story.image || "";
      img.alt = story.imageAlt || story.title;
      img.loading = "lazy";

      const h3 = document.createElement("h3");
      h3.textContent = story.title;
      const p = document.createElement("p");
      p.textContent = prog.finished
        ? "Finished!"
        : story.blurb || "A short tale to read with Ellie.";

      const bar = document.createElement("div");
      bar.className = "progress-bar progress-bar--thin";
      bar.setAttribute("role", "progressbar");
      bar.setAttribute("aria-valuemin", "0");
      bar.setAttribute("aria-valuemax", "100");
      const pct = prog.finished ? 100 : 0;
      bar.setAttribute("aria-valuenow", String(pct));
      const fill = document.createElement("div");
      fill.className = "progress-bar-fill";
      fill.style.width = pct + "%";
      bar.appendChild(fill);

      btn.appendChild(img);
      btn.appendChild(h3);
      btn.appendChild(p);
      btn.appendChild(bar);
      btn.addEventListener("click", () => {
        openStory(story.id);
      });
      grid.appendChild(btn);
    };

    [...CATEGORY_ORDER, "other"].forEach((cat) => {
      const list = groups[cat];
      if (!list.length) return;
      const block = document.createElement("div");
      block.className = "stories-category-block";

      const heading = document.createElement("h3");
      heading.className = "stories-category";
      heading.textContent = CATEGORY_LABELS[cat] || "Stories";
      block.appendChild(heading);
      if (CATEGORY_NOTES[cat]) {
        const note = document.createElement("p");
        note.className = "stories-category-note";
        note.textContent = CATEGORY_NOTES[cat];
        block.appendChild(note);
      }

      const grid = document.createElement("div");
      grid.className = "stories-category-grid";
      list.forEach((story) => appendStoryCard(story, grid));
      block.appendChild(grid);
      els.storiesList.appendChild(block);
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
    const page = getStoryPageContent(content);
    updateStoryLevelPickersUI();

    if (els.storyImage) {
      const src = page.image || story.image || "";
      els.storyImage.src = src;
      els.storyImage.alt =
        page.imageAlt || story.imageAlt || content.title || story.title || "";
      if (els.storyImage.closest) {
        const wrap = els.storyImage.closest(".story-illustration-wrap");
        if (wrap) wrap.hidden = !src;
      }
    }
    if (els.storyMeta) {
      const levelHint =
        content.level === "beginner" ? "Easy words" : "Longer story";
      const pageHint =
        page.pageCount > 1
          ? ` · Page ${page.pageIndex + 1} of ${page.pageCount}`
          : "";
      els.storyMeta.textContent = story.author
        ? `A fable by ${story.author} · ${levelHint}${pageHint}`
        : `A classic fable · ${levelHint}${pageHint}`;
    }
    // Keep karaoke-ready word spans so tap-to-speak works in Easy + Longer.
    prepareStoryKaraoke(page);
    updateStoryPageNavUI(page);
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
    storyPageIndex = 0;
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
    if (name !== "sight" && name !== "phonics" && name !== "vowels") {
      stopSayWordListening();
    }
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
    const levelOpen = els.levelModal && !els.levelModal.hidden;
    const profilesOpen = els.profilePickerModal && !els.profilePickerModal.hidden;
    if (!silent && changed && !welcomeOpen && !nameOpen && !levelOpen && !profilesOpen) {
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

  function stripSpeechFillers(heard) {
    return normalizeHeardText(heard)
      .replace(
        /^(the sound|the letter|it is|it's|i said|um+|uh+)\s+/i,
        ""
      )
      .trim();
  }

  function phonicsSoundHint(entry) {
    if (!entry) return "";
    const phoneme = normalizePhonemeId(entry.phoneme);
    return (
      PHONEME_SOUND_HINT[phoneme] ||
      (PHONEME_SPEECH_ALIASES[phoneme] && PHONEME_SPEECH_ALIASES[phoneme][0]) ||
      phoneme ||
      ""
    );
  }

  function phonicsSoundAcceptList(entry) {
    if (!entry) return [];
    const phoneme = normalizePhonemeId(entry.phoneme);
    const aliases = PHONEME_SPEECH_ALIASES[phoneme] || [];
    const out = new Set();
    if (phoneme) out.add(phoneme);
    for (const a of aliases) {
      const n = normalizeHeardText(a);
      if (n) out.add(n);
    }
    const hint = phonicsSoundHint(entry);
    if (hint) out.add(normalizeHeardText(hint));
    return [...out];
  }

  /**
   * Phonics mic mastery: match the letter *sound*, not the letter name
   * or the example word (e.g. “ball”).
   */
  function heardMatchesLetterSound(heard, entry) {
    if (!entry) return false;
    const raw = stripSpeechFillers(heard);
    if (!raw) return false;

    const letterKey = String(entry.id || entry.letter || "")
      .toLowerCase()
      .trim();
    const nameRejects = (LETTER_NAME_SPEECH[letterKey] || []).map((n) =>
      normalizeHeardText(n)
    );
    if (nameRejects.includes(raw)) return false;

    const example = normalizeHeardText(
      String(entry.example || "").replace(/-/g, " ")
    );
    const exampleCompact = example.replace(/\s+/g, "");
    if (example && (raw === example || raw === exampleCompact)) return false;
    if (example && raw.split(" ").includes(example)) return false;

    const accept = phonicsSoundAcceptList(entry);
    if (!accept.length) return false;

    // Exact phrase or whole-token match only (never substring — “ball” must
    // not match “b”).
    if (accept.includes(raw)) return true;
    const tokens = raw.split(" ").filter(Boolean);
    return tokens.some((tok) => accept.includes(tok));
  }

  function setEllieMood(mood) {
    const nodes = [
      els.sightEllie,
      els.homeEllie,
      els.phonicsEllie,
      els.flashcardEllie,
      els.vowelEllie,
    ].filter(Boolean);
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
    setMicButtonListening(
      els.phonicsSayBtn,
      listening,
      "Say the sound",
      "Listening…"
    );
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
        bumpSightPractice(target);
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
        "Speech isn’t available here — tap “I can!” instead.",
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

    const soundHint = phonicsSoundHint(entry);
    const soundAccept = phonicsSoundAcceptList(entry);

    if (SpeechGrammarListAPI && soundAccept.length) {
      try {
        const list = new SpeechGrammarListAPI();
        const terms = soundAccept
          .map((a) => a.replace(/[^a-z0-9]/g, ""))
          .filter(Boolean);
        if (terms.length) {
          list.addFromString(
            `#JSGF V1.0; grammar sound; public <sound> = ${terms.join(" | ")} ;`,
            1
          );
          recognition.grammars = list;
        }
      } catch (_) {
        /* grammar optional */
      }
    }

    phonicsListenMode = true;
    activeRecognition = recognition;
    sayWordListening = true;
    clearHeardText(els.phonicsHeard, "Listening… say the sound");
    setPhonicsListeningUi(true);
    setPhonicsStatus(
      soundHint
        ? `Say the sound for ${entry.letter} — like “${soundHint}”…`
        : `Say the sound for ${entry.letter}…`,
      "listening"
    );

    recognition.onresult = (event) => {
      const display = getRecognitionDisplayText(event);
      if (display) {
        setHeardText(els.phonicsHeard, display, { listening: true });
      }

      const hypotheses = collectRecognitionHypotheses(event);
      if (!hypotheses.length) return;

      const matched = hypotheses.some((h) => heardMatchesLetterSound(h, entry));
      const best = hypotheses[0] ? normalizeHeardText(hypotheses[0]) : "";
      if (best) {
        setHeardText(els.phonicsHeard, best, { listening: false });
      }

      if (matched) {
        bumpPhonics(entry.id, "practiced");
        setPhonicsStatus(
          `Ellie heard the ${entry.letter} sound — great!`,
          "success"
        );
      } else {
        const tip = soundHint ? ` Try the sound “${soundHint}”.` : "";
        setPhonicsStatus(
          best ? `Heard “${best}”.${tip}` : `Try the sound again!${tip}`,
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

    if (els.phonicsLetterBig) {
      els.phonicsLetterBig.textContent = entry.letter;
      els.phonicsLetterBig.setAttribute(
        "aria-label",
        `Hear the sound for ${entry.letter}`
      );
    }
    if (els.phonicsEmoji) {
      els.phonicsEmoji.textContent = entry.emoji || "";
      els.phonicsEmoji.hidden = !entry.emoji;
    }
    if (els.phonicsExample) {
      els.phonicsExample.textContent = `as in ${entry.example}`;
    }
    if (els.phonicsCue) {
      els.phonicsCue.setAttribute(
        "aria-label",
        entry.example ? `Hear ${entry.example}` : "Hear example word"
      );
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
          playPhonicsSound();
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
    const { overallPct, phonicsPct, sightPct, storiesPct, flashcardsPct } =
      sectionPercents();
    const grade = gradeFromPercent(overallPct);
    if (els.reportGradeBadge) els.reportGradeBadge.textContent = grade.letter;
    if (els.reportGradeTitle) els.reportGradeTitle.textContent = grade.title;
    if (els.reportGradeSummary) {
      els.reportGradeSummary.textContent = `Overall ${overallPct}% · Phonics ${phonicsPct}% · Sight words ${sightPct}% · Story words ${flashcardsPct}% · Stories ${storiesPct}%`;
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
    if (els.openProfilesCaption) {
      const short = state.userName ? String(state.userName).slice(0, 8) : "Who?";
      els.openProfilesCaption.textContent = short;
    }
    if (els.openProfiles) {
      els.openProfiles.title = state.userName
        ? `Who’s reading? (now ${state.userName})`
        : "Who’s reading?";
    }
  }

  function anyOnboardingModalOpen() {
    return (
      (els.welcomeModal && !els.welcomeModal.hidden) ||
      (els.nameModal && !els.nameModal.hidden) ||
      (els.levelModal && !els.levelModal.hidden)
    );
  }

  function hideOnboardingModals() {
    if (els.welcomeModal) els.welcomeModal.hidden = true;
    if (els.nameModal) els.nameModal.hidden = true;
    if (els.levelModal) els.levelModal.hidden = true;
  }

  function openNameModal(opts) {
    hideOnboardingModals();
    if (els.profilePickerModal) els.profilePickerModal.hidden = true;
    els.nameModal.hidden = false;
    els.nameInput.value = state.userName || "";
    els.nameInput.focus();
    if (opts && opts.forceSpeak) speakInstruction("name", { force: true });
  }

  function renderGradeGrid() {
    if (!els.gradeGrid) return;
    els.gradeGrid.innerHTML = "";
    GRADE_KEYS.forEach((g) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.grade = g;
      const main = document.createElement("span");
      main.className = "grade-label";
      main.textContent = g === "K" ? "K" : g;
      const sub = document.createElement("span");
      sub.className = "grade-sub";
      sub.textContent = g === "K" ? "Kinder" : `Grade ${g}`;
      btn.appendChild(main);
      btn.appendChild(sub);
      btn.setAttribute(
        "aria-label",
        g === "K" ? "Kindergarten" : `Grade ${g}`
      );
      btn.classList.toggle("is-selected", pendingLevelChoice.grade === g);
      btn.addEventListener("click", () => {
        pendingLevelChoice.grade = g;
        pendingLevelChoice.ageBandId = "";
        const band = AGE_BANDS.find((b) => b.grade === g);
        if (band) pendingLevelChoice.age = band.age;
        renderGradeGrid();
        renderAgeBands();
        speakCue(g === "K" ? "Kindergarten" : `Grade ${g}`);
      });
      els.gradeGrid.appendChild(btn);
    });
  }

  function renderAgeBands() {
    if (!els.ageBandRow) return;
    els.ageBandRow.innerHTML = "";
    AGE_BANDS.forEach((band) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.ageBand = band.id;
      btn.textContent = band.label;
      btn.setAttribute("aria-label", band.label);
      btn.classList.toggle("is-selected", pendingLevelChoice.ageBandId === band.id);
      btn.addEventListener("click", () => {
        pendingLevelChoice.ageBandId = band.id;
        pendingLevelChoice.age = band.age;
        pendingLevelChoice.grade = band.grade;
        renderGradeGrid();
        renderAgeBands();
        speakCue(band.label);
      });
      els.ageBandRow.appendChild(btn);
    });
  }

  function renderEllieColorRow() {
    if (!els.ellieColorRow) return;
    els.ellieColorRow.innerHTML = "";
    const selected = normalizeEllieColor(
      pendingLevelChoice.ellieColor || state.ellieColor
    );
    ELLIE_COLOR_KEYS.forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.ellieColor = key;
      btn.style.setProperty("--swatch", ELLIE_COLOR_SWATCH[key] || ELLIE_COLOR_SWATCH.pink);
      btn.setAttribute("aria-label", `${key} Ellie`);
      btn.classList.toggle("is-selected", selected === key);
      btn.addEventListener("click", () => {
        pendingLevelChoice.ellieColor = key;
        applyEllieTheme(key);
        renderEllieColorRow();
        speakCue(key);
      });
      els.ellieColorRow.appendChild(btn);
    });
  }

  function openLevelModal(opts) {
    if (!els.levelModal) return;
    if (els.nameModal) els.nameModal.hidden = true;
    if (els.welcomeModal) els.welcomeModal.hidden = true;
    pendingLevelChoice = {
      grade: normalizeGrade(state.profileGrade),
      age: normalizeAge(state.profileAge),
      ageBandId: "",
      ellieColor: normalizeEllieColor(state.ellieColor),
    };
    if (pendingLevelChoice.age != null && !pendingLevelChoice.ageBandId) {
      const match = AGE_BANDS.find((b) => b.age === pendingLevelChoice.age);
      if (match) pendingLevelChoice.ageBandId = match.id;
    }
    renderGradeGrid();
    renderAgeBands();
    renderEllieColorRow();
    els.levelModal.hidden = false;
    if (opts && opts.forceSpeak) speakInstruction("level", { force: true });
  }

  function completeLevelOnboarding() {
    const grade = normalizeGrade(pendingLevelChoice.grade);
    const age = normalizeAge(pendingLevelChoice.age);
    if (!grade && age == null) {
      speakCue("Pick a grade or age");
      return false;
    }
    state.profileGrade = grade;
    state.profileAge = age;
    state.ellieColor = normalizeEllieColor(
      pendingLevelChoice.ellieColor || state.ellieColor
    );
    applyEllieTheme(state.ellieColor);
    const level = storyLevelForGradeOrAge(grade, age);
    state.storyReadingLevel = level;
    const p = ensureActiveProfile();
    p.grade = grade;
    p.age = age;
    p.ellieColor = state.ellieColor;
    p.storyReadingLevel = level;
    persistProgress();
    if (els.levelModal) els.levelModal.hidden = true;
    updateHomeGreeting();
    updateProgressUI();
    updateStoryLevelPickersUI();
    lastAutoSpokenInstructionKey = "";
    speakInstruction("home", { force: true });
    return true;
  }

  function switchToProfile(profileId, opts) {
    const id = String(profileId || "").trim();
    if (!id || !profilesStore.profiles[id]) return false;
    syncActiveProfileFromState();
    profilesStore.activeProfileId = id;
    loadProfileIntoState(profilesStore.profiles[id]);
    persistProgress();
    stopSayWordListening();
    stopStoryReading();
    if (els.profilePickerModal) els.profilePickerModal.hidden = true;
    showScreen("home", { silent: true });
    refreshUiAfterProgressApply();
    if (els.sightScreen && !els.sightScreen.hidden) updateSightWordUI();
    if (!(opts && opts.silent)) {
      lastAutoSpokenInstructionKey = "";
      speakInstruction("home", { force: true });
    }
    return true;
  }

  function beginAddProfileFlow() {
    syncActiveProfileFromState();
    const p = createEmptyProfile({ name: "" });
    profilesStore.profiles[p.id] = p;
    profilesStore.activeProfileId = p.id;
    loadProfileIntoState(p);
    persistProgress();
    if (els.profilePickerModal) els.profilePickerModal.hidden = true;
    refreshUiAfterProgressApply();
    openNameModal({ forceSpeak: true });
  }

  function deleteProfileById(profileId) {
    const id = String(profileId || "").trim();
    if (!id || !profilesStore.profiles[id]) return false;
    const count = Object.keys(profilesStore.profiles).length;
    if (count <= 1) {
      speakCue("Keep at least one reader");
      return false;
    }
    const wasActive = profilesStore.activeProfileId === id;
    delete profilesStore.profiles[id];
    if (wasActive) {
      const next = listProfilesSorted()[0];
      profilesStore.activeProfileId = next.id;
      loadProfileIntoState(next);
    }
    persistProgress();
    refreshUiAfterProgressApply();
    renderProfilePickerList();
    speakCue("Deleted");
    return true;
  }

  function renderProfilePickerList() {
    if (!els.profilePickerList) return;
    els.profilePickerList.innerHTML = "";
    listProfilesSorted().forEach((profile) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.gap = "10px";
      row.style.alignItems = "stretch";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "profile-card";
      if (profile.id === profilesStore.activeProfileId) {
        btn.classList.add("is-active");
      }
      btn.setAttribute("role", "listitem");
      const color = normalizeEllieColor(profile.ellieColor);
      const avatar = document.createElement("span");
      avatar.className = "profile-card-avatar";
      avatar.style.background = ELLIE_COLOR_SWATCH[color] || ELLIE_COLOR_SWATCH.pink;
      const initial = (profile.name || "?").trim().charAt(0).toUpperCase() || "?";
      avatar.textContent = initial;
      const meta = document.createElement("span");
      meta.className = "profile-card-meta";
      const nameEl = document.createElement("span");
      nameEl.className = "profile-card-name";
      nameEl.textContent = profile.name || "New reader";
      const levelEl = document.createElement("span");
      levelEl.className = "profile-card-level";
      const lvl = profileLevelLabel(profile);
      const storySpeak =
        STORY_LEVEL_SPEAK[normalizeStoryLevel(profile.storyReadingLevel)] ||
        "Easy";
      levelEl.textContent = lvl ? `${lvl} · ${storySpeak}` : storySpeak;
      meta.appendChild(nameEl);
      meta.appendChild(levelEl);
      btn.appendChild(avatar);
      btn.appendChild(meta);
      btn.addEventListener("click", () => {
        speakCue(profile.name || "Reader");
        switchToProfile(profile.id);
        if (els.profilePickerModal) els.profilePickerModal.hidden = true;
      });

      const del = document.createElement("button");
      del.type = "button";
      del.className = "profile-card-delete";
      del.title = "Delete reader (grown-ups)";
      del.setAttribute("aria-label", `Delete ${profile.name || "reader"}`);
      del.innerHTML =
        '<svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-trash"/></svg>';
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        openParentalGate({
          kidMsg: "Ellie says deleting a reader is for grown-ups.",
          onSuccess: () => {
            const ok = window.confirm(
              `Delete ${profile.name || "this reader"} and their progress on this device?`
            );
            if (ok) deleteProfileById(profile.id);
          },
        });
      });

      row.appendChild(btn);
      row.appendChild(del);
      els.profilePickerList.appendChild(row);
    });
  }

  function openProfilePicker() {
    renderProfilePickerList();
    if (els.profilePickerModal) els.profilePickerModal.hidden = false;
    speakInstruction("profiles", { force: true });
  }

  function continueAfterNameOrLevel() {
    const active = getActiveProfile();
    if (!state.userName.trim()) {
      openNameModal({ forceSpeak: true });
      return;
    }
    if (!profileHasLevel(active) && !profileHasLevel({
      grade: state.profileGrade,
      age: state.profileAge,
    })) {
      openLevelModal({ forceSpeak: true });
      return;
    }
    hideOnboardingModals();
    updateHomeGreeting();
    speakInstruction("home", { force: true });
  }

  function updateSightWordUI() {
    const entry = getWordEntry(state.sightWordIndex);
    const letters = lettersForEntry(entry);
    const wordDisplay = sightWordKey(entry.word);

    els.sightWordTitle.textContent = wordDisplay || "—";
    refreshSightWordMasteryUi();
    updateSightWordEmojiUI();

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

    const letterCount = letters.length;
    // Slider: 0 = start (before first sound), 1..n = letters so the first letter
    // always gets an "enter" event when the thumb slides onto it.
    els.scrubSlider.min = "0";
    els.scrubSlider.max = String(letterCount);
    if (!Number.isFinite(state.scrubIndex) || state.scrubIndex < -1) {
      state.scrubIndex = -1;
    } else if (state.scrubIndex >= letterCount) {
      state.scrubIndex = Math.max(-1, letterCount - 1);
    }
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

  /** Slider value 0 = before sounds; 1..n map to letter indices 0..n-1. */
  function letterIndexFromScrubValue(scrubVal) {
    const v = parseInt(scrubVal, 10);
    if (!Number.isFinite(v) || v <= 0) return -1;
    return v - 1;
  }

  function scrubValueFromLetterIndex(letterIndex) {
    const idx = letterIndex | 0;
    return idx < 0 ? 0 : idx + 1;
  }

  function setActiveLetter(index) {
    const letterIndex = Number.isFinite(index) ? index | 0 : -1;
    const tiles = els.letterRow.querySelectorAll(".letter-tile");
    tiles.forEach((t, i) => {
      t.classList.toggle(
        "letter-tile--active",
        letterIndex >= 0 && i === letterIndex
      );
    });
    state.scrubIndex = letterIndex;
    els.scrubSlider.value = String(scrubValueFromLetterIndex(letterIndex));
  }

  async function handleProgressFile(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      applyProgressData(data);
      hideOnboardingModals();
      if (els.profilePickerModal) els.profilePickerModal.hidden = true;
      syncControlsFromState();
      updateHomeGreeting();
      updateProgressUI();
      updateStoryLevelPickersUI();
      if (els.sightScreen && !els.sightScreen.hidden) updateSightWordUI();
      applyVoiceFilters();
      continueAfterNameOrLevel();
    } catch (_) {
      alert("Could not read that JSON file. Please pick a valid export.");
    }
  }

  function shuffleArray(items) {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function closeParentalGate() {
    if (!els.parentalGateModal) return;
    els.parentalGateModal.hidden = true;
    if (els.parentalGateFeedback) els.parentalGateFeedback.textContent = "";
    if (els.parentalGateWords) els.parentalGateWords.innerHTML = "";
    parentalGateOnSuccess = null;
  }

  function openSettingsPanel() {
    syncControlsFromState();
    applyVoiceFilters();
    els.settingsModal.hidden = false;
  }

  function renderParentalGateWords() {
    if (!els.parentalGateWords) return;
    if (els.parentalGateCodeWord) {
      els.parentalGateCodeWord.textContent = PARENTAL_GATE_CODE_WORD;
    }
    const words = shuffleArray([
      PARENTAL_GATE_CODE_WORD,
      ...PARENTAL_GATE_DECOYS,
    ]);
    els.parentalGateWords.innerHTML = "";
    for (const word of words) {
      const label = word.charAt(0).toUpperCase() + word.slice(1);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.dataset.gateWord = word;
      btn.setAttribute("aria-label", `Tap ${label}`);
      btn.addEventListener("click", () => handleParentalGateChoice(word, btn));
      els.parentalGateWords.appendChild(btn);
    }
  }

  function handleParentalGateChoice(word, btn) {
    if (word === PARENTAL_GATE_CODE_WORD) {
      if (els.parentalGateFeedback) els.parentalGateFeedback.textContent = "";
      const onSuccess = parentalGateOnSuccess;
      parentalGateOnSuccess = null;
      if (els.parentalGateModal) els.parentalGateModal.hidden = true;
      if (els.parentalGateFeedback) els.parentalGateFeedback.textContent = "";
      if (els.parentalGateWords) els.parentalGateWords.innerHTML = "";
      if (typeof onSuccess === "function") onSuccess();
      else openSettingsPanel();
      return;
    }
    playFeedbackSfx("miss");
    if (els.parentalGateFeedback) {
      els.parentalGateFeedback.textContent = "Try again!";
    }
    if (btn) {
      btn.classList.remove("is-wrong");
      // Retrigger tilt animation on repeated wrong taps.
      void btn.offsetWidth;
      btn.classList.add("is-wrong");
    }
  }

  /**
   * @param {{ onSuccess?: () => void, kidMsg?: string } | undefined} opts
   */
  function openParentalGate(opts) {
    const onSuccess =
      opts && typeof opts.onSuccess === "function"
        ? opts.onSuccess
        : () => openSettingsPanel();
    if (!els.parentalGateModal) {
      onSuccess();
      return;
    }
    parentalGateOnSuccess = onSuccess;
    if (els.parentalGateKidMsg) {
      els.parentalGateKidMsg.textContent =
        (opts && opts.kidMsg) ||
        "Ellie says Settings is for parents only.";
    }
    if (els.parentalGateFeedback) els.parentalGateFeedback.textContent = "";
    renderParentalGateWords();
    els.parentalGateModal.hidden = false;
    speakInstruction("parentalGate", { force: true });
  }

  function bindEvents() {
    els.welcomeOpenFile.addEventListener("click", () => {
      speakCue("Open file");
      els.welcomeImportInput.click();
    });

    els.welcomeStartFresh.addEventListener("click", () => {
      speakCue("Start");
      resetStateForFreshStart();
      persistProgress();
      syncControlsFromState();
      applyVoiceFilters();
      updateHomeGreeting();
      updateProgressUI();
      updateStoryLevelPickersUI();
      openNameModal({ forceSpeak: true });
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
      speakCue("Next");
      state.userName = name;
      persistUserName(name);
      const p = ensureActiveProfile();
      p.name = name;
      persistProgress();
      updateHomeGreeting();
      els.nameModal.hidden = true;
      openLevelModal({ forceSpeak: true });
    });

    if (els.levelContinue) {
      els.levelContinue.addEventListener("click", () => {
        completeLevelOnboarding();
      });
    }

    if (els.openProfiles) {
      els.openProfiles.addEventListener("click", () => {
        speakCue("Who’s reading");
        openProfilePicker();
      });
    }

    if (els.closeProfilePicker) {
      els.closeProfilePicker.addEventListener("click", () => {
        speakCue("Done");
        if (els.profilePickerModal) els.profilePickerModal.hidden = true;
      });
    }

    if (els.profilePickerModal) {
      els.profilePickerModal.addEventListener("click", (e) => {
        if (e.target === els.profilePickerModal) {
          els.profilePickerModal.hidden = true;
        }
      });
    }

    if (els.profileAddBtn) {
      els.profileAddBtn.addEventListener("click", () => {
        openParentalGate({
          kidMsg: "Ellie says adding a reader is for grown-ups.",
          onSuccess: () => beginAddProfileFlow(),
        });
      });
    }

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
      openParentalGate({
        kidMsg: "Ellie says Settings is for parents only.",
        onSuccess: () => openSettingsPanel(),
      });
    });

    if (els.closeParentalGate) {
      els.closeParentalGate.addEventListener("click", () => {
        speakCue("Cancel");
        closeParentalGate();
      });
    }

    if (els.parentalGateModal) {
      els.parentalGateModal.addEventListener("click", (e) => {
        if (e.target === els.parentalGateModal) closeParentalGate();
      });
    }

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

    function openPhonicsActivity() {
      showScreen("phonics");
      updatePhonicsUI();
    }

    function openSightActivity() {
      showScreen("sight");
      updateSightWordUI();
    }

    function openStoriesActivity() {
      showScreen("stories");
      updateStoryLevelPickersUI();
      updateStoriesListUI();
    }

    function openFlashcardsActivity() {
      rebuildFlashcardDeck();
      showScreen("flashcards");
      updateFlashcardUI();
    }

    if (els.activitySightWords) {
      els.activitySightWords.addEventListener("click", () => {
        openSightActivity();
      });
    }

    if (els.activityPhonics) {
      els.activityPhonics.addEventListener("click", () => {
        openPhonicsActivity();
      });
    }

    if (els.activityStories) {
      els.activityStories.addEventListener("click", () => {
        openStoriesActivity();
      });
    }

    if (els.homeOpenPhonics) {
      els.homeOpenPhonics.addEventListener("click", () => openPhonicsActivity());
    }
    if (els.homeOpenSight) {
      els.homeOpenSight.addEventListener("click", () => openSightActivity());
    }
    if (els.homeOpenStories) {
      els.homeOpenStories.addEventListener("click", () => openStoriesActivity());
    }
    if (els.homeOpenFlashcards) {
      els.homeOpenFlashcards.addEventListener("click", () =>
        openFlashcardsActivity()
      );
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

    if (els.headerProgressBtn) {
      els.headerProgressBtn.addEventListener("click", () => {
        showScreen("report");
        updateReportCardUI();
      });
    }

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

    if (els.storyPrevPage) {
      els.storyPrevPage.addEventListener("click", () => goStoryPage(-1));
    }
    if (els.storyNextPage) {
      els.storyNextPage.addEventListener("click", () => goStoryPage(1));
    }
    if (els.storyContinue) {
      els.storyContinue.addEventListener("click", () => goStoryPage(1));
    }

    const storyWordRoots = [els.storyTitle, els.storyBody, els.storyMoral].filter(
      Boolean
    );
    storyWordRoots.forEach((root) => {
      root.addEventListener("pointerdown", (e) => {
        const wordEl = e.target.closest(".story-word");
        if (!wordEl || !root.contains(wordEl)) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        storyWordIgnoreClick = false;
        clearStoryWordLongPress();
        storyWordLongTimer = setTimeout(() => {
          storyWordLongTimer = null;
          storyWordIgnoreClick = true;
          clearStoryWordClickDelay();
          openStoryWordBlend(wordEl);
        }, STORY_WORD_LONG_MS);
      });
      root.addEventListener("pointerup", clearStoryWordLongPress);
      root.addEventListener("pointercancel", clearStoryWordLongPress);
      root.addEventListener("click", (e) => {
        const wordEl = e.target.closest(".story-word");
        if (!wordEl || !root.contains(wordEl)) return;
        if (storyWordIgnoreClick) {
          storyWordIgnoreClick = false;
          return;
        }
        clearStoryWordClickDelay();
        storyWordClickTimer = setTimeout(() => {
          storyWordClickTimer = null;
          speakTappedStoryWord(wordEl);
        }, STORY_WORD_DOUBLE_MS);
      });
      root.addEventListener("dblclick", (e) => {
        const wordEl = e.target.closest(".story-word");
        if (!wordEl || !root.contains(wordEl)) return;
        clearStoryWordLongPress();
        clearStoryWordClickDelay();
        storyWordIgnoreClick = true;
        openStoryWordBlend(wordEl);
      });
      root.addEventListener("contextmenu", (e) => {
        const wordEl = e.target.closest(".story-word");
        if (!wordEl || !root.contains(wordEl)) return;
        e.preventDefault();
      });
    });

    if (els.storyBlendClose) {
      els.storyBlendClose.addEventListener("click", () => {
        hideStoryWordBlend();
      });
    }
    if (els.storyBlendDone) {
      els.storyBlendDone.addEventListener("click", () => {
        hideStoryWordBlend();
      });
    }
    if (els.storyBlendModal) {
      els.storyBlendModal.addEventListener("click", (e) => {
        if (e.target === els.storyBlendModal) hideStoryWordBlend();
      });
    }
    if (els.storyBlendWord) {
      els.storyBlendWord.addEventListener("click", () => {
        if (storyBlendEntry && storyBlendEntry.word) {
          speakText(sightWordKey(storyBlendEntry.word));
        }
      });
    }
    if (els.storyBlendSlider) {
      els.storyBlendSlider.addEventListener("input", () => {
        if (!storyBlendEntry) return;
        const letterIdx = letterIndexFromScrubValue(els.storyBlendSlider.value);
        setStoryBlendActiveLetter(letterIdx);
        if (letterIdx < 0) {
          storyBlendLastPhonemeIndex = -1;
          return;
        }
        if (letterIdx === storyBlendLastPhonemeIndex) return;
        storyBlendLastPhonemeIndex = letterIdx;
        const letters = lettersForEntry(storyBlendEntry);
        if (letters[letterIdx]) speakGraphemeSound(storyBlendEntry, letterIdx);
      });
      els.storyBlendSlider.addEventListener("change", () => {
        storyBlendLastPhonemeIndex = -1;
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
        const alreadyHome = activeScreenName === "home";
        showScreen("home");
        updateProgressUI();
        // Short nav cue when already on home (showScreen only speaks on change).
        if (alreadyHome) speakCue("Home");
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
      state.scrubIndex = -1;
      persistProgress();
      updateSightWordUI();
    });

    els.nextWord.addEventListener("click", () => {
      if (state.sightWordIndex >= sightWords.length - 1) return;
      state.sightWordIndex++;
      state.scrubIndex = -1;
      persistProgress();
      updateSightWordUI();
    });

    if (els.prevFlashcard) {
      els.prevFlashcard.addEventListener("click", () => {
        if (state.flashcardWordIndex <= 0) return;
        state.flashcardWordIndex--;
        persistProgress();
        updateFlashcardUI();
      });
    }
    if (els.nextFlashcard) {
      els.nextFlashcard.addEventListener("click", () => {
        if (state.flashcardWordIndex >= flashcardWords.length - 1) return;
        state.flashcardWordIndex++;
        persistProgress();
        updateFlashcardUI();
      });
    }
    if (els.flashcardWordTitle) {
      els.flashcardWordTitle.addEventListener("click", () => {
        hearCurrentFlashcard();
      });
    }
    if (els.flashcardHearBtn) {
      els.flashcardHearBtn.addEventListener("click", () => {
        hearCurrentFlashcard();
      });
    }
    if (els.flashcardKnowBtn) {
      els.flashcardKnowBtn.addEventListener("click", () => {
        const entry = getFlashcardEntry(state.flashcardWordIndex);
        if (!entry.word || isFlashcardMastered(entry.word)) return;
        markFlashcardMastered(entry.word);
        setEllieMood("cheer");
        playFeedbackSfx("success");
        speakCue("I know it");
        if (state.flashcardWordIndex < flashcardWords.length - 1) {
          state.flashcardWordIndex++;
          persistProgress();
          updateFlashcardUI();
        } else {
          refreshFlashcardMasteryUi();
        }
      });
    }

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
    if (els.phonicsLetterBig) {
      els.phonicsLetterBig.addEventListener("click", () => playPhonicsSound());
    }
    els.phonicsISaidIt.addEventListener("click", () => markPhonicsPracticed());
    els.phonicsSayBtn.addEventListener("click", () => startPhonicsSayListening());
    els.phonicsStartQuiz.addEventListener("click", () => startPhonicsQuiz());
    if (els.phonicsCue) {
      els.phonicsCue.addEventListener("click", () => speakPhonicsExample());
    }

    els.sayWordBtn.addEventListener("click", () => {
      startSayWordListening();
    });

    function hearCurrentSightWord() {
      stopSayWordListening();
      const entry = getWordEntry(state.sightWordIndex);
      if (!entry.word) return;
      speakWholeWord(entry.word);
    }

    els.sightWordTitle.addEventListener("click", () => {
      hearCurrentSightWord();
    });
    if (els.sightWordEmojiBtn) {
      els.sightWordEmojiBtn.addEventListener("click", () => {
        hearCurrentSightWord();
      });
    }

    /** Last letter index that played a phoneme (Lotty-style: one sound per letter). */
    let lastScrubPhonemeIndex = -1;
    els.scrubSlider.addEventListener("input", () => {
      const letterIdx = letterIndexFromScrubValue(els.scrubSlider.value);
      setActiveLetter(letterIdx);
      if (letterIdx < 0) {
        lastScrubPhonemeIndex = -1;
        return;
      }
      if (letterIdx === lastScrubPhonemeIndex) return;
      lastScrubPhonemeIndex = letterIdx;
      const entry = getWordEntry(state.sightWordIndex);
      const letters = lettersForEntry(entry);
      if (letters[letterIdx]) speakGraphemeSound(entry, letterIdx);
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
    els.brandHome = $("brandHome");
    els.openProfiles = $("openProfiles");
    els.openProfilesCaption = $("openProfilesCaption");
    els.profilePickerModal = $("profilePickerModal");
    els.profilePickerList = $("profilePickerList");
    els.profilePickerLead = $("profilePickerLead");
    els.closeProfilePicker = $("closeProfilePicker");
    els.profileAddBtn = $("profileAddBtn");
    els.levelModal = $("levelModal");
    els.gradeGrid = $("gradeGrid");
    els.ageBandRow = $("ageBandRow");
    els.ellieColorRow = $("ellieColorRow");
    els.levelContinue = $("levelContinue");
    els.parentalGateModal = $("parentalGateModal");
    els.parentalGateWords = $("parentalGateWords");
    els.parentalGateFeedback = $("parentalGateFeedback");
    els.parentalGateCodeWord = $("parentalGateCodeWord");
    els.parentalGateKidMsg = $("parentalGateKidMsg");
    els.closeParentalGate = $("closeParentalGate");
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
    els.homeOpenPhonics = $("homeOpenPhonics");
    els.homeOpenSight = $("homeOpenSight");
    els.homeOpenStories = $("homeOpenStories");
    els.homeOpenFlashcards = $("homeOpenFlashcards");
    els.headerProgressBtn = $("headerProgressBtn");
    els.activityReportCard = $("activityReportCard");
    els.storiesReportText = $("storiesReportText");
    els.storiesProgressBar = $("storiesProgressBar");
    els.storiesProgressFill = $("storiesProgressFill");
    els.flashcardsReportText = $("flashcardsReportText");
    els.flashcardsProgressBar = $("flashcardsProgressBar");
    els.flashcardsProgressFill = $("flashcardsProgressFill");
    els.flashcardsScreen = $("flashcardsScreen");
    els.flashcardWordTitle = $("flashcardWordTitle");
    els.flashcardWordProgress = $("flashcardWordProgress");
    els.flashcardHearBtn = $("flashcardHearBtn");
    els.flashcardKnowBtn = $("flashcardKnowBtn");
    els.flashcardEllie = $("flashcardEllie");
    els.prevFlashcard = $("prevFlashcard");
    els.nextFlashcard = $("nextFlashcard");
    els.storiesList = $("storiesList");
    els.storiesLevelPicker = $("storiesLevelPicker");
    els.storyLevelPicker = $("storyLevelPicker");
    els.storyBackToList = $("storyBackToList");
    els.storyImage = $("storyImage");
    els.storyTitle = $("storyTitle");
    els.storyMeta = $("storyMeta");
    els.storyBody = $("storyBody");
    els.storyBlendModal = $("storyBlendModal");
    els.storyBlendWord = $("storyBlendWord");
    els.storyBlendClose = $("storyBlendClose");
    els.storyBlendDone = $("storyBlendDone");
    els.storyBlendLetters = $("storyBlendLetters");
    els.storyBlendSlider = $("storyBlendSlider");
    els.storyMoral = $("storyMoral");
    els.storyContinueWrap = $("storyContinueWrap");
    els.storyContinue = $("storyContinue");
    els.storyPageNav = $("storyPageNav");
    els.storyPageLabel = $("storyPageLabel");
    els.storyPrevPage = $("storyPrevPage");
    els.storyNextPage = $("storyNextPage");
    els.storyReadAloud = $("storyReadAloud");
    els.storyStopRead = $("storyStopRead");
    els.storyFinished = $("storyFinished");
    els.storyCredit = $("storyCredit");
    els.storyReader = $("storyReader");
    els.reportStoryList = $("reportStoryList");
    els.sightScreen = $("sightScreen");
    els.sightWordTitle = $("sightWordTitle");
    els.sightWordEmojiBtn = $("sightWordEmojiBtn");
    els.sightWordEmoji = $("sightWordEmoji");
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
    els.phonicsCue = $("phonicsCue");
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
    loadPersistedPreviewText();
    const hasSavedProgress = loadPersistedProgress();
    if (!hasSavedProgress) {
      // Seed empty store only after Start fresh / first profile create.
      profilesStore.profiles = {};
      profilesStore.activeProfileId = "";
    }
    bindEvents();
    whenCloudReady(() => bindCloudAuth());

    await loadWordsFromJson();
    await loadStoriesFromJson();
    clampWordIndex();
    clampFlashcardIndex();
    preloadPhonemeAudio();

    speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    syncControlsFromState();
    applyEllieTheme(state.ellieColor);
    updateHomeGreeting();
    updateProgressUI();
    updateStoryLevelPickersUI();

    hideOnboardingModals();
    if (els.levelModal) els.levelModal.hidden = true;
    if (els.profilePickerModal) els.profilePickerModal.hidden = true;

    if (hasSavedProgress) {
      els.welcomeModal.hidden = true;
      if (!state.userName.trim()) {
        openNameModal({ forceSpeak: false });
      } else if (
        !profileHasLevel({
          grade: state.profileGrade,
          age: state.profileAge,
        })
      ) {
        openLevelModal({ forceSpeak: false });
      }
    } else {
      els.welcomeModal.hidden = false;
    }

    showScreen("home", { silent: true });
    if (!els.welcomeModal.hidden) {
      speakInstruction("welcome", { force: true });
    } else if (els.nameModal && !els.nameModal.hidden) {
      speakInstruction("name", { force: true });
    } else if (els.levelModal && !els.levelModal.hidden) {
      speakInstruction("level", { force: true });
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
