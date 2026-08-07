(function () {
  "use strict";

  const LS_USER_NAME = "learntoread_userName";
  const LS_PREVIEW_TEXT = "learntoread_previewText";
  const DEFAULT_PREVIEW_TEXT = "Hello! I will help you read.";

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

  const PHONEME_AUDIO_BASE = "sounds/phonemes/";
  const phonemeAudioCache = new Map();
  let activePhonemeAudio = null;

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

  const state = {
    userName: "",
    previewText: DEFAULT_PREVIEW_TEXT,
    sightWordIndex: 0,
    region: "",
    onlineOnly: true,
    gender: "both",
    voiceName: "",
    rate: 0.95,
    pitch: 1.05,
    scrubIndex: 0,
  };

  const els = {};

  function $(id) {
    return document.getElementById(id);
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

  function resetStateForFreshStart() {
    state.sightWordIndex = 0;
    state.scrubIndex = 0;
    state.region = "";
    state.onlineOnly = true;
    state.gender = "both";
    state.voiceName = "";
    state.rate = 0.95;
    state.pitch = 1.05;
  }

  function applyProgressData(data) {
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
    if (data.voiceName != null) state.voiceName = String(data.voiceName);
    if (data.region != null) state.region = String(data.region);
    if (typeof data.onlineOnly === "boolean")
      state.onlineOnly = data.onlineOnly;
    if (data.gender != null) state.gender = String(data.gender);
    if (typeof data.rate === "number") state.rate = data.rate;
    if (typeof data.pitch === "number") state.pitch = data.pitch;
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

  /**
   * Play an isolated letter-sound MP3 (human Wikimedia Commons recordings).
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
    if (!voice || !text) return;

    stopPhonemeAudio();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.rate = state.rate;
    u.pitch = state.pitch;
    if (opts && typeof opts.rate === "number") u.rate = opts.rate;
    if (opts && typeof opts.pitch === "number") u.pitch = opts.pitch;
    speechSynthesis.speak(u);
  }

  function speakWholeWord(word) {
    speakText(word.toLowerCase());
  }

  function loadVoices() {
    voices = speechSynthesis.getVoices();
    applyVoiceFilters();
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

  function clampWordIndex() {
    if (sightWords.length && state.sightWordIndex >= sightWords.length) {
      state.sightWordIndex = sightWords.length - 1;
    }
  }

  function showScreen(name) {
    document.querySelectorAll("[data-screen]").forEach((el) => {
      el.hidden = el.getAttribute("data-screen") !== name;
    });
  }

  function updateHomeGreeting() {
    els.homeGreeting.textContent = state.userName
      ? `Hi, ${state.userName}! Pick an activity.`
      : "Pick an activity.";
  }

  function updateSightWordUI() {
    const entry = getWordEntry(state.sightWordIndex);
    const letters = lettersForEntry(entry);
    const wordDisplay = (entry.word || "").toLowerCase();

    els.sightWordTitle.textContent = wordDisplay || "—";
    els.sightWordProgress.textContent = sightWords.length
      ? `Word ${state.sightWordIndex + 1} of ${sightWords.length}`
      : "No words loaded";

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
      if (!els.sightScreen.hidden) updateSightWordUI();
      applyVoiceFilters();
      if (!state.userName.trim()) {
        els.nameModal.hidden = false;
        els.nameInput.value = "";
        els.nameInput.focus();
      } else {
        els.nameModal.hidden = true;
      }
    } catch (_) {
      alert("Could not read that JSON file. Please pick a valid export.");
    }
  }

  function bindEvents() {
    els.welcomeOpenFile.addEventListener("click", () => {
      els.welcomeImportInput.click();
    });

    els.welcomeStartFresh.addEventListener("click", () => {
      resetStateForFreshStart();
      syncControlsFromState();
      applyVoiceFilters();
      els.welcomeModal.hidden = true;
      els.nameModal.hidden = false;
      els.nameInput.value = state.userName || "";
      els.nameInput.focus();
      updateHomeGreeting();
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
      els.nameModal.hidden = true;
      updateHomeGreeting();
    });

    els.importBtn.addEventListener("click", () => {
      els.importInput.click();
    });

    els.importInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (file) handleProgressFile(file);
    });

    els.openSettings.addEventListener("click", () => {
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

    els.backHome.addEventListener("click", () => {
      showScreen("home");
    });

    els.prevWord.addEventListener("click", () => {
      if (state.sightWordIndex <= 0) return;
      state.sightWordIndex--;
      state.scrubIndex = 0;
      updateSightWordUI();
    });

    els.nextWord.addEventListener("click", () => {
      if (state.sightWordIndex >= sightWords.length - 1) return;
      state.sightWordIndex++;
      state.scrubIndex = 0;
      updateSightWordUI();
    });

    els.sightWordTitle.addEventListener("click", () => {
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
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        userName: state.userName,
        sightWordIndex: state.sightWordIndex,
        voiceName: state.voiceName,
        region: state.region,
        onlineOnly: state.onlineOnly,
        gender: state.gender,
        rate: state.rate,
        pitch: state.pitch,
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
    els.backHome = $("backHome");
    els.sightScreen = $("sightScreen");
    els.sightWordTitle = $("sightWordTitle");
    els.sightWordProgress = $("sightWordProgress");
    els.letterRow = $("letterRow");
    els.scrubSlider = $("scrubSlider");
    els.prevWord = $("prevWord");
    els.nextWord = $("nextWord");
    els.exportBtn = $("exportBtn");
    els.importBtn = $("importBtn");
    els.importInput = $("importInput");
  }

  async function init() {
    cacheElements();
    loadPersistedProfile();
    bindEvents();

    await loadWordsFromJson();
    clampWordIndex();

    speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    syncControlsFromState();
    updateHomeGreeting();

    els.welcomeModal.hidden = false;
    els.nameModal.hidden = true;

    showScreen("home");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
