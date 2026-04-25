(function () {
  "use strict";

  const DEFAULT_WORDS = [
    { word: "the" },
    { word: "and" },
    { word: "a" },
    { word: "to" },
    { word: "is" },
    { word: "you" },
    { word: "it" },
    { word: "in" },
    { word: "said" },
    { word: "for" },
    { word: "up" },
    { word: "look" },
    { word: "go" },
    { word: "we" },
    { word: "can" },
    { word: "see" },
    { word: "my" },
    { word: "like" },
    { word: "at" },
    { word: "play" },
  ];

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

  function resetStateForFreshStart() {
    state.userName = "";
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
    if (data.userName != null) state.userName = String(data.userName);
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

  function speakWordBuildupToGrapheme(entry, graphemeIndex) {
    const fragment = wordPrefixThroughGrapheme(entry, graphemeIndex);
    if (fragment) speakText(fragment.toLowerCase());
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

    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.rate = state.rate;
    u.pitch = state.pitch;
    if (opts && typeof opts.rate === "number") u.rate = opts.rate;
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
      btn.setAttribute(
        "aria-label",
        String(ch).length > 1 ? `Letter group ${ch}` : `Letter ${ch}`
      );
      btn.dataset.index = String(idx);
      btn.addEventListener("click", () => {
        setActiveLetter(idx);
        speakWordBuildupToGrapheme(entry, idx);
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
      els.nameInput.value = "";
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
      els.settingsModal.hidden = true;
    });

    els.settingsPreview.addEventListener("click", () => {
      speakText("Hello! I will help you read.");
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

    els.speakWordBtn.addEventListener("click", () => {
      const entry = getWordEntry(state.sightWordIndex);
      if (entry.word) speakWholeWord(entry.word);
    });

    let scrubTimer = null;
    els.scrubSlider.addEventListener("input", () => {
      const i = parseInt(els.scrubSlider.value, 10) || 0;
      const tiles = els.letterRow.querySelectorAll(".letter-tile");
      tiles.forEach((t, idx) => {
        t.classList.toggle("letter-tile--active", idx === i);
      });
      state.scrubIndex = i;
      if (scrubTimer) clearTimeout(scrubTimer);
      scrubTimer = setTimeout(() => {
        const entry = getWordEntry(state.sightWordIndex);
        const letters = lettersForEntry(entry);
        if (letters[i]) speakWordBuildupToGrapheme(entry, i);
        scrubTimer = null;
      }, 120);
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
    els.speakWordBtn = $("speakWordBtn");
    els.exportBtn = $("exportBtn");
    els.importBtn = $("importBtn");
    els.importInput = $("importInput");
  }

  async function init() {
    cacheElements();
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
