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

  /** Short speakable hints for letter sounds (phonics-style for TTS). */
  const DEFAULT_LETTER_SOUNDS = {
    a: "ah",
    b: "buh",
    c: "kuh",
    d: "duh",
    e: "eh",
    f: "fff",
    g: "guh",
    h: "huh",
    i: "ih",
    j: "juh",
    k: "kuh",
    l: "lll",
    m: "mmm",
    n: "nnn",
    o: "oh",
    p: "puh",
    q: "kwuh",
    r: "rrr",
    s: "sss",
    t: "tuh",
    u: "uh",
    v: "vvv",
    w: "wuh",
    x: "ks",
    y: "yuh",
    z: "zzz",
  };

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

  function lettersForEntry(entry) {
    const w = (entry.word || "").toUpperCase();
    if (Array.isArray(entry.letters) && entry.letters.length) {
      return entry.letters.map(String);
    }
    return w.split("");
  }

  function soundForLetter(char, entry) {
    const c = String(char).toLowerCase();
    if (entry.sounds && typeof entry.sounds === "object") {
      const key = String(char).toLowerCase();
      if (entry.sounds[key] != null) return String(entry.sounds[key]);
    }
    if (DEFAULT_LETTER_SOUNDS[c]) return DEFAULT_LETTER_SOUNDS[c];
    return c;
  }

  function getSelectedVoice() {
    const idx = parseInt(els.voiceSelect.value, 10);
    if (!Number.isFinite(idx) || idx < 0) return null;
    return filteredVoices[idx] || null;
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

    if (state.voiceName) {
      const idx = filteredVoices.findIndex((v) => v.name === state.voiceName);
      if (idx >= 0) els.voiceSelect.value = String(idx);
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

  function speakLetterSound(char, entry) {
    const hint = soundForLetter(char, entry);
    speakText(hint, { rate: Math.min(1.1, state.rate + 0.05) });
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
      btn.textContent = ch;
      btn.setAttribute("aria-label", `Letter ${ch}`);
      btn.dataset.index = String(idx);
      btn.addEventListener("click", () => {
        setActiveLetter(idx);
        speakLetterSound(ch, entry);
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
        const ch = letters[i];
        if (ch) speakLetterSound(ch, entry);
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
