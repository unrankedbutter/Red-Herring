/*
 * RED HERRING — UI, persistence, economy, accounts and pixel effects.
 * Loads after puzzles.js, engine.js, backend.js and the data files.
 */
(function () {
  "use strict";

  const P = window.RedHerringPuzzles;
  const E = window.RedHerringEngine;
  const SHOP = window.RedHerringShopData || { items: [], presets: [] };
  const FISH_SVG = window.RedHerringFishSVG || function () { return ""; };

  const DAY_KEY = "red-herring:v1:day";
  const STATS_KEY = "red-herring:v1:stats";
  const SOUND_KEY = "red-herring:v1:sound";
  const FISH_KEY = "red-herring:v1:fish";
  const MIGRATED_KEY = "red-herring:v1:legacy-migrated";
  const DEV_KEY = "red-herring:v1:dev";
  // Remembers that today's daily was finished, which unlocks the arcade.
  const ARCADE_KEY = "red-herring:v1:arcade";
  // Last few arcade answers, so endless replays don't keep dealing the same word.
  const ARC_RECENT_KEY = "red-herring:v1:arcade-recent";
  // Daily results kept for the statistics screen. Old rounds are dropped so a
  // long-lived cloud save never grows without bound.
  const HISTORY_LIMIT = 150;
  // Device-local motion tier. Weak phones skip decorative effects; the core
  // flip/reveal feedback stays intact. Saved value overrides auto-detection.
  const PERF_KEY = "red-herring:v1:perf";
  // Add a code by adding one line to CODES below. Keys are uppercased for you.
  // once: true = one claim per profile/account. fish: N = exactly N fish.
  // uses: N = only N total claims worldwide. Omit it (or set unlimited: true)
  // for unlimited worldwide uses. unlockAll: true = every shop item.
  // dev: true = private temporary dev tools (never counted or globally limited).
  const FISH_BONUS = 1.2;
  const bonusFish = (amount) => Math.max(0, Math.round(amount * FISH_BONUS));
  // Codes pay exactly what they say. The 20% bonus is for daily/arcade rounds.
  const codeFish = (amount) => Math.max(0, Math.round(Number(amount) || 0));
  const codeLimit = (def) => {
    if (!def || def.unlimited === true) return null;
    const raw = def.uses != null ? def.uses : def.maxUses;
    if (raw == null || raw === "unlimited") return null;
    const n = Math.floor(Number(raw));
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const CODES = {
    RHDEV2026: {
      dev: true,
      message: "CODE ACCEPTED — DEV TOOLS READY"
    },
    RELEASE: {
      once: true,
      fish: 175,
      sound: "coin",
      message: (granted) => "+" + granted + " FISH · RELEASE CODE REDEEMED!"
    },
    BONUS: {
      once: true,
      fish: 125,
      sound: "coin",
      message: (granted) => "+" + granted + " FISH · BONUS CODE REDEEMED!"
    },
    GIVEMEEVERYTHINGPLEASE: {
      unlockAll: true,
      sound: "buy",
      message: "ALL SHOP ITEMS UNLOCKED!"
    }
  };
  const TOTAL_CARDS = 8;
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = reducedQuery.matches;
  let perfOverride = null;
  try {
    const savedPerf = localStorage.getItem(PERF_KEY);
    if (savedPerf === "on" || savedPerf === "off") perfOverride = savedPerf === "on";
  } catch (_) { /* private mode */ }
  function computeLowPower() {
    if (perfOverride != null) return perfOverride;
    const cores = navigator.hardwareConcurrency || 8;
    const memory = navigator.deviceMemory || 8;
    const saveData = navigator.connection && navigator.connection.saveData === true;
    return reduced || saveData || cores <= 4 || memory <= 4;
  }
  let lowPower = computeLowPower();
  let fishStarted = false;
  function applyMotionMode() {
    document.body.classList.toggle("low-power", lowPower);
  }
  if (reducedQuery.addEventListener) {
    reducedQuery.addEventListener("change", (event) => {
      reduced = event.matches;
      lowPower = computeLowPower();
      applyMotionMode();
      if (!lowPower && el.menu.classList.contains("is-active")) startFish();
    });
  }

  // Backend fallback keeps the game playable if backend.js fails to load.
  const B = window.RedHerringBackend || (function () {
    const DATA_KEY = "red-herring:v1:data:guest";
    const CODE_USES_KEY = "red-herring:v1:code-uses";
    const listeners = { auth: [], data: [] };
    let data = { fish: 0, fishCaught: 0, owned: ["classic", "classic-theme"], skin: "classic", theme: "classic-theme", themeV: 2, stats: {}, sound: "on" };
    try { data = Object.assign(data, JSON.parse(localStorage.getItem(DATA_KEY) || "{}")); } catch (_) { /* private mode */ }
    const emit = (kind, value) => listeners[kind].slice().forEach((cb) => { try { cb(value); } catch (_) { /* ignore */ } });
    const fail = (msg) => Promise.reject(new Error(msg));
    const claimCode = (code, options) => {
      const key = String(code || "INVALID").toUpperCase().replace(/[^A-Z0-9_-]/g, "") || "INVALID";
      const raw = options && options.limit;
      const limit = raw == null || raw === "unlimited" ? null : Math.floor(Number(raw));
      const cap = Number.isFinite(limit) && limit > 0 ? limit : null;
      let all = {};
      try { all = JSON.parse(localStorage.getItem(CODE_USES_KEY) || "{}") || {}; } catch (_) { /* private mode */ }
      const entry = all[key] && typeof all[key] === "object" ? all[key] : { count: 0, claims: {} };
      const claims = entry.claims && typeof entry.claims === "object" ? entry.claims : {};
      const identity = "guest";
      const once = !options || options.once !== false;
      const claimId = once ? identity : identity + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
      const count = Math.max(0, Math.floor(Number(entry.count) || 0));
      if (claims[claimId]) return Promise.resolve({ ok: false, reason: "already", count, source: "local" });
      if (cap != null && count >= cap) return Promise.resolve({ ok: false, reason: "limit", count, remaining: 0, source: "local" });
      entry.count = count + 1;
      claims[claimId] = true;
      entry.claims = claims;
      all[key] = entry;
      try { localStorage.setItem(CODE_USES_KEY, JSON.stringify(all)); } catch (_) { /* private mode */ }
      return Promise.resolve({ ok: true, count: entry.count, remaining: cap == null ? null : Math.max(0, cap - entry.count), source: "local" });
    };
    return {
      mode: "local",
      ready: Promise.resolve(),
      onAuth(cb) { listeners.auth.push(cb); cb(null); },
      onData(cb) { listeners.data.push(cb); cb(Object.assign({}, data)); },
      auth: {
        currentUser() { return null; },
        signUp() { return fail("ACCOUNTS ARE UNAVAILABLE"); },
        signIn() { return fail("ACCOUNTS ARE UNAVAILABLE"); },
        signInWithGoogle() { return fail("GOOGLE SIGN-IN NEEDS FIREBASE CONFIG"); },
        signOut() { return Promise.resolve(); },
        updateProfile() { return fail("ACCOUNTS ARE UNAVAILABLE"); }
      },
      getData() { return Object.assign({}, data); },
      updateData(patch) {
        data = Object.assign({}, data, patch || {});
        try { localStorage.setItem(DATA_KEY, JSON.stringify(data)); } catch (_) { /* private mode */ }
        emit("data", Object.assign({}, data));
        return Object.assign({}, data);
      },
      claimCode: claimCode
    };
  })();

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* private mode */ } }
  };

  const $ = (id) => document.getElementById(id);
  const el = {
    app: $("app"),
    menu: $("screen-menu"), game: $("screen-game"),
    menuDay: $("menu-day"), gameDay: $("game-day"),
    play: $("btn-play"), playLabel: $("play-label"),
    arcade: $("btn-arcade"), arcadeLabel: $("arcade-label"),
    arcadeOverlay: $("overlay-arcade"), arcadeIntro: $("arcade-intro"),
    arcadeSections: $("arcade-sections"), arcadeModes: $("arcade-modes"),
    arcadeTwists: $("arcade-twists"),
    arcadeModeTitle: $("arcade-mode-title"), arcadeBack: $("arcade-back"),
    arcadePractice: $("arcade-practice"), practiceWord: $("practice-word"),
    practiceTwist: $("practice-twist"), practiceDifficulty: $("practice-difficulty"),
    practiceStart: $("practice-start"),
    arcadeNote: document.querySelector(".arcade-note"),
    gameDayLabel: $("game-day-label"),
    rules: $("btn-rules"), settings: $("btn-settings"),
    shop: $("btn-shop"), account: $("btn-account"), stats: $("btn-stats"),
    back: $("btn-back"), soundGame: $("btn-sound-game"),
    score: $("score"), flipped: $("flipped-count"), burned: $("burned-count"),
    guesses: $("guess-count"), best: $("best"), message: $("message"),
    messageBar: document.querySelector(".message-bar"),
    deck: $("deck"), form: $("guess-form"), guess: $("guess"),
    giveUp: $("give-up"),
    countdown: $("countdown"), gameNextLabel: $("game-next-label"), toast: $("toast"),
    arcadeStatus: $("arcade-status"),
    timerBar: $("timer-bar"), timerLabel: $("timer-label"), timerClock: $("timer-clock"),
    timerFill: $("timer-fill"), timerWarning: $("timer-warning"), roundTwist: $("round-twist"),
    introOverlay: $("overlay-intro"), introCard: $("intro-card"), introKicker: $("intro-kicker"),
    introIcon: $("intro-icon"), introTitle: $("intro-title"), introSub: $("intro-sub"),
    introTwist: $("intro-twist"),
    introTwistIcon: $("intro-twist-icon"), introTwistName: $("intro-twist-name"),
    introTwistDesc: $("intro-twist-desc"), introCount: $("intro-count"),
    introFill: $("intro-fill"), introSkip: $("intro-skip"), introGo: $("intro-go"),
    fishLayer: $("fish-layer"), fishCount: $("fish-count"),
    menuStreak: $("menu-streak"), menuPlayed: $("menu-played"),
    menuRate: $("menu-rate"), menuBest: $("menu-best"),
    shopBadge: $("shop-fish-badge"), accountAvatar: $("account-avatar"),
    accountMode: $("account-mode"),
    resultOverlay: $("overlay-result"), resultPanel: document.querySelector(".result-panel"),
    resultReveal: $("result-reveal"), fishReward: $("fish-reward"),
    banner: $("result-banner"),
    resultAnswer: $("result-answer"), resultScore: $("result-score"),
    resultFish: $("result-fish"), breakdown: $("result-breakdown"),
    resultCells: $("result-cells"), resultCountdown: $("result-countdown"),
    resultNextLabel: $("result-next-label"), resultReplay: $("result-replay"),
    share: $("share"), shareLabel: $("share-label"), resultMenu: $("result-menu"),
    rulesOverlay: $("overlay-rules"), rulesScoring: $("rules-scoring"),
    cardOverlay: $("overlay-card"), zoomNum: $("zoom-num"), zoomText: $("zoom-text"),
    shopOverlay: $("overlay-shop"),
    shopFish: $("shop-fish"), shopTabs: $("shop-tabs"), shopItems: $("shop-items"),
    shopEventBanner: $("shop-event-banner"), shopSnow: $("shop-snow"),
    settingsOverlay: $("overlay-settings"),
    settingsTabs: $("settings-tabs"), settingsContent: $("settings-content"),
    accountOverlay: $("overlay-account"),
    accountBody: $("account-body"), devBar: $("dev-bar"),
    statsOverlay: $("overlay-stats"), statsBody: $("stats-body"),
    answerSlam: $("answer-slam"), answerSlamText: $("answer-slam-text")
  };

  const shopItems = SHOP.items || [];
  const presetAvatars = SHOP.presets || [];
  const themeIds = shopItems.filter((item) => item.type === "theme").map((item) => item.id);
  const patternIds = shopItems.filter((item) => item.type === "pattern").map((item) => item.id);
  const pad = (n) => String(n).padStart(2, "0");
  const signed = (n) => (n > 0 ? "+" : "") + n;
  // Repeated DOM text writes are a common source of mobile jank; skip no-ops.
  const setText = (node, value) => {
    if (!node) return;
    const text = String(value);
    if (node.textContent !== text) node.textContent = text;
  };
  const esc = (value) => String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  // Chunky 8-bit X with a shadow and bright corner chips for every overlay.
  const X_GLYPH =
    '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">' +
      '<rect x="0" y="0" width="4" height="4" fill="#000"/>' +
      '<rect x="12" y="0" width="4" height="4" fill="#000"/>' +
      '<rect x="0" y="12" width="4" height="4" fill="#000"/>' +
      '<rect x="12" y="12" width="4" height="4" fill="#000"/>' +
      '<rect x="1" y="1" width="3" height="3" fill="#ffffff" opacity=".85"/>' +
      '<rect x="12" y="1" width="3" height="3" fill="#ffffff" opacity=".85"/>' +
      '<rect x="1" y="12" width="3" height="3" fill="#ffffff" opacity=".85"/>' +
      '<rect x="12" y="12" width="3" height="3" fill="#ffffff" opacity=".85"/>' +
      '<rect x="3" y="3" width="3" height="3" fill="currentColor"/>' +
      '<rect x="10" y="3" width="3" height="3" fill="currentColor"/>' +
      '<rect x="5" y="5" width="3" height="3" fill="currentColor"/>' +
      '<rect x="8" y="5" width="3" height="3" fill="currentColor"/>' +
      '<rect x="6" y="6" width="4" height="4" fill="currentColor"/>' +
      '<rect x="5" y="8" width="3" height="3" fill="currentColor"/>' +
      '<rect x="8" y="8" width="3" height="3" fill="currentColor"/>' +
      '<rect x="3" y="10" width="3" height="3" fill="currentColor"/>' +
      '<rect x="10" y="10" width="3" height="3" fill="currentColor"/>' +
    '</svg>';

  const FISH_TYPES = {
    red: { value: 1, color: "#ff3d6e", glow: "#ff8fa8", sound: "catch", lines: ["PLINK! +1 FISH.", "A LITTLE RED WRIGGLER.", "TOO SLOW, HERRING!"] },
    blue: { value: 10, color: "#35f0ff", glow: "#8df7ff", sound: "catchBlue", lines: ["BLUE BONANZA! +10 FISH.", "TEN FISH! NICE CATCH.", "THE GOOD ONE GOT AWAY..."] },
    gold: { value: 3, color: "#ffd166", glow: "#fff0a8", sound: "catchGold", lines: ["RARE GOLDEN HERRING! +3 FISH.", "GOLD CATCH! +3 FISH.", "SHINY! +3 FISH."] },
    rainbow: { value: 25, color: "#ff7ae0", glow: "#ffffff", sound: "catchRainbow", lines: ["RAINBOW HERRING! +25 FISH!", "IMPOSSIBLE CATCH! +25 FISH.", "THE LEGEND IS REAL! +25 FISH."] }
  };

  // Card-back fish use the exact swatch colors from their card color.
  const SKIN_FISH = {
    classic: { body: "#ff5577", shadow: "#a32252", accent: "#ffe08a" },
    neon:    { body: "#35f0ff", shadow: "#ff3df2", accent: "#e7ffff" },
    ember:   { body: "#ff6b1a", shadow: "#2b0b00", accent: "#fff3c4" },
    ocean:   { body: "#35f0ff", shadow: "#0b5f8a", accent: "#e7ffff" },
    royal:   { body: "#7b4dff", shadow: "#2b0b5a", accent: "#ffd166" },
    matrix:  { body: "#39ff6a", shadow: "#04140b", accent: "#b9ffcf" },
    slate:   { body: "#9fb3c8", shadow: "#1a222b", accent: "#ffffff" },
    honey:   { body: "#ffb000", shadow: "#5a3000", accent: "#fff3c4" },
    violet:  { body: "#b06cff", shadow: "#2b0b5a", accent: "#f4d7ff" },
    chrome:  { body: "#d9f2ff", shadow: "#24384a", accent: "#ffffff" },
    copper:  { body: "#ff9d5c", shadow: "#4a1d0b", accent: "#ffe3bd" },
    frostbite: { body: "#bfefff", shadow: "#2b6f9e", accent: "#ffffff" },
    holly:   { body: "#1f9d55", shadow: "#0a2a16", accent: "#ff5577" },
    ginger:  { body: "#b9682e", shadow: "#3a1808", accent: "#fff3d6" }
  };

  /* ---------------- sound ---------------- */
  let soundOn = store.get(SOUND_KEY) !== "off";
  const Sfx = {
    ctx: null,
    boot() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    },
    tone(freq, dur, type, delay, vol, endFreq) {
      if (!soundOn) return;
      try {
        const ctx = this.boot();
        if (!ctx) return;
        const start = ctx.currentTime + (delay || 0);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type || "square";
        osc.frequency.setValueAtTime(freq, start);
        if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + dur);
        gain.gain.setValueAtTime(vol || 0.05, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur + 0.01);
      } catch (_) { /* audio unavailable */ }
    },
    play(name) {
      if (!soundOn) return;
      switch (name) {
        case "click": this.tone(660, 0.06, "square", 0, 0.035); break;
        case "flip":
          this.tone(240, 0.05, "triangle", 0, 0.03, 900);
          this.tone(1200, 0.035, "square", 0.045, 0.022);
          break;
        case "good": [523, 659, 784].forEach((f, i) => this.tone(f, 0.12, "square", i * 0.07)); break;
        case "bad": this.tone(180, 0.14, "sawtooth"); this.tone(110, 0.2, "sawtooth", 0.1); break;
        case "herring":
          [659, 880, 1175, 1568].forEach((f, i) => this.tone(f, 0.1, "square", i * 0.045, 0.035));
          this.tone(2093, 0.22, "triangle", 0.2, 0.02, 3136);
          break;
        case "reveal":
          this.tone(98, 0.42, "sine", 0, 0.05, 55);
          [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.15, i % 2 ? "triangle" : "square", 0.06 + i * 0.07, 0.03));
          break;
        case "revealBad":
          this.tone(110, 0.4, "sawtooth", 0, 0.04, 65);
          [392, 330, 262].forEach((f, i) => this.tone(f, 0.16, "square", 0.05 + i * 0.09, 0.032));
          break;
        case "reward":
          [784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, 0.09, "square", 0.04 + i * 0.055, 0.03));
          this.tone(2093, 0.18, "triangle", 0.28, 0.018);
          break;
        case "wrong": this.tone(150, 0.18, "square"); break;
        case "win": [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.16, "square", i * 0.09)); break;
        case "open": this.tone(330, 0.07, "square"); this.tone(440, 0.09, "square", 0.06); break;
        case "catch": [784, 988, 1319].forEach((f, i) => this.tone(f, 0.08, "square", i * 0.05, 0.04)); break;
        case "catchBlue":
          [1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f, 0.1, "triangle", i * 0.045, 0.034));
          this.tone(1568, 0.22, "sine", 0.16, 0.024, 3136);
          break;
        case "catchGold":
          [660, 880, 1320].forEach((f, i) => this.tone(f, 0.11, "sine", i * 0.055, 0.044));
          this.tone(1760, 0.16, "triangle", 0.16, 0.03, 2640);
          this.tone(2637, 0.12, "sine", 0.24, 0.022);
          break;
        case "catchRainbow":
          this.tone(523, 0.55, "sine", 0, 0.03, 2093);
          [659, 831, 1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f, 0.13, i % 2 ? "triangle" : "sine", 0.08 + i * 0.055, 0.026));
          this.tone(3136, 0.3, "sine", 0.42, 0.018, 1568);
          break;
        case "coin": [880, 1175].forEach((f, i) => this.tone(f, 0.07, "square", i * 0.04, 0.035)); break;
        case "buy": [392, 523, 659].forEach((f, i) => this.tone(f, 0.1, "square", i * 0.06)); break;
        case "tick": this.tone(880, 0.05, "square", 0, 0.03); break;
      }
    }
  };

  function syncSound() {
    el.soundGame.textContent = soundOn ? "♪" : "×";
    el.soundGame.classList.toggle("off", !soundOn);
    el.soundGame.setAttribute("aria-label", soundOn ? "Mute sound" : "Unmute sound");
  }

  function toggleSound() {
    soundOn = !soundOn;
    store.set(SOUND_KEY, soundOn ? "on" : "off");
    B.updateData({ sound: soundOn ? "on" : "off" });
    syncSound();
    if (!el.settingsOverlay.hidden && settingsTab === "basic") renderSettings("basic");
    if (soundOn) Sfx.play("click");
    toast(soundOn ? "SOUND ON" : "SOUND OFF");
  }

  /* ---------------- state ---------------- */
  function defaultStats() {
    return {
      played: 0, wins: 0, streak: 0, best: 0, totalScore: 0,
      lastPlayed: null, lastWin: null, history: []
    };
  }

  // Cloud saves and old local saves may contain partial or duplicated rows.
  // Keep the newest entry per day and coerce every field before it reaches the
  // statistics renderer, so a corrupted save can never break the whole app.
  function sanitizeHistory(list) {
    if (!Array.isArray(list)) return [];
    const result = [];
    const seen = new Set();
    const int = (value) => Math.max(0, Math.floor(Number(value) || 0));
    for (let i = list.length - 1; i >= 0; i--) {
      const row = list[i];
      if (!row || typeof row !== "object" || typeof row.date !== "string") continue;
      const key = row.date.slice(0, 10) + "|" + String(row.mode || "daily");
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        date: row.date.slice(0, 10),
        mode: String(row.mode || "daily").slice(0, 20),
        answer: String(row.answer || "").slice(0, 40),
        correct: !!row.correct,
        score: int(row.score),
        fish: int(row.fish),
        flipped: int(row.flipped),
        herrings: int(row.herrings),
        truths: int(row.truths),
        wrong: int(row.wrong),
        fullReveal: !!row.fullReveal,
        reason: String(row.reason || "").slice(0, 20)
      });
    }
    return result.reverse().slice(-HISTORY_LIMIT);
  }

  function defaultData() {
    return {
      fish: 0, fishCaught: 0,
      owned: ["classic", "classic-theme", "solid"], skin: "classic", theme: "classic-theme", pattern: "solid", themeV: 2,
      stats: defaultStats(), redeemed: [], sound: "on"
    };
  }

  function migrateThemeId(id) {
    // Old saves: the free blue theme was "midnight" and the warm paid theme was
    // "sunset". After the swap, those ids mean the opposite looks.
    if (id === "midnight") return "classic-theme";
    if (id === "sunset") return "midnight";
    return id;
  }

  function normalizeData(raw) {
    const base = defaultData();
    if (!raw || typeof raw !== "object") return base;
    const needsThemeMigration = raw.themeV !== 2;
    Object.keys(base).forEach((key) => {
      if (key === "stats" || key === "owned") return;
      if (raw[key] !== undefined && raw[key] !== null) base[key] = raw[key];
    });
    if (Array.isArray(raw.owned) && raw.owned.length) {
      base.owned = raw.owned.slice();
      if (needsThemeMigration) base.owned = base.owned.map(migrateThemeId);
      base.owned = base.owned.filter((id, i, list) => list.indexOf(id) === i);
    }
    if (needsThemeMigration) base.theme = migrateThemeId(base.theme);
    base.themeV = 2;
    base.stats = Object.assign(defaultStats(), raw.stats && typeof raw.stats === "object" ? raw.stats : {});
    base.stats.history = sanitizeHistory(base.stats.history);
    base.redeemed = Array.isArray(raw.redeemed) ? raw.redeemed.filter((v) => typeof v === "string") : [];
    base.fish = Math.max(0, Number.parseInt(base.fish, 10) || 0);
    base.fishCaught = Math.max(0, Number.parseInt(base.fishCaught, 10) || 0);
    if (shopItems.length && !shopItems.some((item) => item.id === base.skin)) base.skin = "classic";
    if (themeIds.length && themeIds.indexOf(base.theme) < 0) base.theme = "classic-theme";
    if (patternIds.length && patternIds.indexOf(base.pattern) < 0) base.pattern = "solid";
    if (base.owned.indexOf("classic") < 0) base.owned.push("classic");
    if (base.owned.indexOf("classic-theme") < 0) base.owned.push("classic-theme");
    if (base.owned.indexOf("solid") < 0) base.owned.push("solid");
    return base;
  }

  function freshState(date, size) {
    const n = size || TOTAL_CARDS;
    return {
      date,
      flipped: Array(n).fill(false),
      burned: Array(n).fill(false),
      wrongGuesses: 0,
      result: null
    };
  }

  function loadState(date) {
    try {
      const raw = JSON.parse(store.get(DAY_KEY) || "null");
      if (raw && raw.date === date && Array.isArray(raw.flipped) && raw.flipped.length === TOTAL_CARDS &&
          Array.isArray(raw.burned) && raw.burned.length === TOTAL_CARDS) return raw;
    } catch (_) { /* corrupt save */ }
    return freshState(date);
  }

  function devIsActive() { return !!(B.dev && B.dev.active && B.dev.active()); }

  function activeCatalog() { return P.CATALOG; }

  function updateDayLabels() {
    el.menuDay.textContent = String(dailyPuzzle ? dailyPuzzle.day : puzzle.day);
    if (currentMode === "arcade" && puzzle.modeName) {
      el.gameDayLabel.textContent = "";
      el.gameDay.textContent = (puzzle.eventName ? puzzle.eventName + " · " : "") + puzzle.modeName;
    } else {
      el.gameDayLabel.textContent = "DAY";
      el.gameDay.textContent = String(puzzle.day);
    }
  }

  function rebuildPuzzle(force, forcedAnswer) {
    if (state.result && !force) return false;
    const answer = forcedAnswer;
    roundCatalog = activeCatalog();
    puzzle = E.buildDailyPuzzle(roundCatalog, P.PUZZLE_VERSION, today, { answer });
    dailyPuzzle = puzzle;
    updateDayLabels();
    renderDeck();
    updateHUD();
    return true;
  }

  // Arcade rounds are memory-only — the saved daily board is never overwritten.
  function save() {
    if (currentMode !== "daily" || devIsActive()) return;
    store.set(DAY_KEY, JSON.stringify(state));
  }

  function saveStats(next) {
    if (!devIsActive()) store.set(STATS_KEY, JSON.stringify(next));
    B.updateData({ stats: next });
  }

  function yesterdayString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return E.localDateString(d);
  }

  function stripArticles(value) {
    return E.normalizeAnswer(value).replace(/^(the|a|an)\s+/, "");
  }

  /* ---------------- finish typing, then auto-correct ---------------- */
  let autoCorrectTimer = 0;

  // Damerau-Levenshtein: insert, delete, replace and adjacent swaps all count
  // as one edit, so "lantren" still snaps back to "Lantern".
  function editDistance(a, b) {
    const rows = a.length + 1;
    const cols = b.length + 1;
    const d = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let i = 0; i < rows; i++) d[i][0] = i;
    for (let j = 0; j < cols; j++) d[0][j] = j;
    for (let i = 1; i < rows; i++) {
      for (let j = 1; j < cols; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[rows - 1][cols - 1];
  }

  // Returns the closest catalog spelling only when the match is clear.
  function autoCorrectAnswer(raw) {
    const value = String(raw || "").trim();
    if (!value) return value;
    // True short forms count too, but only for answers in this round.
    const alias = E.resolveAnswerAlias(value, roundCatalog);
    if (alias) return alias;
    // A distinctive single word from a two-word answer snaps to the full name.
    const close = E.findCloseAnswer(value, roundCatalog);
    if (close && close.auto) return close.answer;
    const q = stripArticles(value).replace(/\s+/g, "");
    if (q.length < 4) return value;

    const ranked = roundCatalog.map((entry) => {
      const word = stripArticles(entry.answer).replace(/\s+/g, "");
      const dist = editDistance(q, word);
      const longest = Math.max(q.length, word.length);
      return { answer: entry.answer, dist, match: (longest - dist) / longest };
    }).sort((a, b) => a.dist - b.dist || b.match - a.match);

    const best = ranked[0];
    if (!best) return value;
    if (best.dist === 0) return best.answer;

    const maxEdits = q.length >= 8 ? 3 : q.length >= 5 ? 2 : 1;
    const runnerUp = ranked[1];
    const ambiguous = runnerUp && runnerUp.dist <= best.dist + 1;
    if (best.match < 0.62 || best.dist > maxEdits || ambiguous) return value;
    return best.answer;
  }

  function cancelAutoCorrect() {
    if (autoCorrectTimer) window.clearTimeout(autoCorrectTimer);
    autoCorrectTimer = 0;
  }

  function applyAutoCorrect() {
    cancelAutoCorrect();
    if (el.guess.disabled || !!state.result) return;
    const corrected = autoCorrectAnswer(el.guess.value);
    if (corrected && corrected !== el.guess.value) {
      const close = E.findCloseAnswer(el.guess.value, roundCatalog);
      el.guess.value = corrected;
      toast((close && close.auto ? "CLOSE! SNAPPED TO · " : "AUTO-CORRECTED · ") + corrected.toUpperCase());
      Sfx.play("click");
    }
  }

  function scheduleAutoCorrect() {
    cancelAutoCorrect();
    if (!el.guess.value.trim()) return;
    autoCorrectTimer = window.setTimeout(applyAutoCorrect, 400);
  }

  const catalogErrors = E.validateCatalog(P.CATALOG);
  if (catalogErrors.length) console.warn("Red Herring catalog issues:", catalogErrors);

  let today = E.localDateString();
  // Catalog actually used for the live round, so typo rescue only picks real
  // answers from this pool (daily or arcade event).
  let roundCatalog = P.CATALOG;
  let puzzle = E.buildDailyPuzzle(P.CATALOG, P.PUZZLE_VERSION, today);
  let state = loadState(today);
  // The daily board is kept aside so leaving an arcade round can restore it.
  let dailyPuzzle = puzzle;
  let dailyState = state;
  let currentMode = "daily";
  let arcadeModeId = null;
  // TWISTED picks its house rule first, then the difficulty. "random" rolls one.
  let arcadeTwistChoice = "random";
  let arcadeStep = "sections";
  // Which arcade section is active: null/default = normal pool, christmas = event pool.
  let arcadeEvent = "default";
  // PRACTICE picks are remembered so instant replay reuses the same setup.
  const RANDOM_WORD = "__random__";
  let practiceWord = RANDOM_WORD;
  let practiceTwist = "random";
  let practiceDifficulty = "medium";
  let practiceSettings = null;
  // Countdown deadline (ms timestamp) for timed arcade modes. 0 = untimed.
  let roundDeadline = 0;
  let roundDuration = 0;
  let roundTwist = null;
  let lastTimerSecond = -1;
  // The short round intro pauses the clock and owns its own timer.
  let introActive = false;
  let introDismissing = false;
  let introTimer = 0;
  let introEndsAt = 0;
  let introToken = 0;
  const INTRO_MS = 5000;
  // Finishing the daily (win or give up) opens the arcade for the rest of the day.
  let dailyDoneDate = store.get(ARCADE_KEY) || (state.result ? today : null);
  let accountData = normalizeData(B.getData && B.getData());
  let stats = accountData.stats;
  let currentUser = null;
  let shopTab = "skin";
  let settingsTab = "basic";
  const accountView = { form: "view", error: "", selectedAvatar: null, draftName: "" };
  const cardEls = [];
  let devUnlocked = store.get(DEV_KEY) === "1";
  let codeError = "";
  let codeBusy = false;
  let codeDraft = "";
  let lastFishSkin = null;
  let practiceSelects = {};

  function randomPoolAnswer(pool) {
    const source = pool || activeCatalog();
    return source.length ? source[Math.floor(Math.random() * source.length)].answer : null;
  }

  function resolveChosenAnswer(value, pool) {
    if (!value) return null;
    const source = pool || activeCatalog();
    if (value === RANDOM_WORD) return randomPoolAnswer(source);
    return source.some((entry) => E.normalizeAnswer(entry.answer) === E.normalizeAnswer(value))
      ? value : null;
  }

  function counts() {
    let flipped = 0, herrings = 0, truths = 0;
    puzzle.cards.forEach((card, i) => {
      if (state.flipped[i]) flipped++;
      if (state.burned[i]) card.isHerring ? herrings++ : truths++;
    });
    return { flipped, herrings, truths };
  }

  function liveScore() {
    const c = counts();
    return E.scoreRound({
      correct: !!(state.result && state.result.correct),
      flippedCount: c.flipped,
      herringsBurned: c.herrings,
      trueCluesBurned: c.truths,
      wrongGuesses: state.wrongGuesses,
      wrongPenalty: roundTwist && roundTwist.wrongPenalty
    });
  }

  /* ---------------- shared effects ---------------- */
  function toast(text) {
    el.toast.textContent = text;
    el.toast.classList.add("show");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => el.toast.classList.remove("show"), 1900);
  }

  function setMessage(text, kind) {
    el.message.textContent = text;
    el.messageBar.className = "message-bar" + (kind ? " " + kind : "");
  }

  function bump(node) {
    if (reduced) return;
    node.classList.remove("bump");
    void node.offsetWidth;
    node.classList.add("bump");
  }

  function shake() {
    if (reduced) return;
    el.app.classList.remove("shake");
    void el.app.offsetWidth;
    el.app.classList.add("shake");
  }

  function flashScreen(kind) {
    if (reduced) return;
    const cls = kind === "good" ? "flash-good" : "flash-bad";
    document.body.classList.remove("flash-good", "flash-bad");
    void document.body.offsetWidth;
    document.body.classList.add(cls);
    window.setTimeout(() => document.body.classList.remove(cls), 430);
  }

  function floatScore(text, x, y, negative) {
    if (reduced) return;
    const node = document.createElement("div");
    node.className = "float-score" + (negative ? " minus" : "");
    node.textContent = text;
    node.style.left = `${x - 20}px`;
    node.style.top = `${y - 10}px`;
    document.body.appendChild(node);
    window.setTimeout(() => node.remove(), 1100);
  }

  function valuePop(text, x, y, color) {
    if (reduced) return;
    const node = document.createElement("div");
    node.className = "value-pop";
    node.textContent = text;
    node.style.left = x + "px";
    node.style.top = y + "px";
    node.style.color = color || "#ffd166";
    document.body.appendChild(node);
    window.setTimeout(() => node.remove(), 950);
  }

  function burstAt(x, y, color, count) {
    if (reduced) return;
    const colors = [color, "#ff2fb3", "#35f0ff", "#ffd166", "#63f5a8"];
    const n = Math.max(1, Math.min(lowPower ? 8 : 24, Number(count) || 12));
    const fragment = document.createDocumentFragment();
    const particles = [];
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.className = "burst";
      p.style.left = x + "px";
      p.style.top = y + "px";
      const angle = (Math.PI * 2 * i) / n;
      const dist = 40 + Math.random() * 70;
      p.style.setProperty("--bx", `${Math.cos(angle) * dist}px`);
      p.style.setProperty("--by", `${Math.sin(angle) * dist}px`);
      p.style.setProperty("--c", colors[i % colors.length]);
      fragment.appendChild(p);
      particles.push(p);
    }
    document.body.appendChild(fragment);
    window.setTimeout(() => particles.forEach((p) => p.remove()), 650);
  }

  function burnFX(cardNode, kind) {
    if (reduced) return;
    const fx = document.createElement("div");
    fx.className = "burn-fx pixel-burn" + (kind ? " " + kind : "");
    fx.setAttribute("aria-hidden", "true");
    const cols = lowPower ? 6 : 9;
    const rows = lowPower ? 7 : 10;
    const colors = kind === "herring"
      ? ["var(--green)", "#ffe08a", "#ffffff", "#35f0ff"]
      : ["var(--pink)", "var(--amber)", "var(--cyan)", "#ffffff"];
    const fragment = document.createDocumentFragment();
    for (let row = rows - 1; row >= 0; row--) {
      for (let col = 0; col < cols; col++) {
        const px = document.createElement("span");
        px.className = "pixel";
        px.style.setProperty("--x", `${(col / cols) * 100}%`);
        px.style.setProperty("--y", `${(row / rows) * 100}%`);
        px.style.setProperty("--d", `${(((rows - 1 - row) / (rows - 1)) * 0.34).toFixed(3)}s`);
        px.style.setProperty("--dx", `${Math.round(-38 + Math.random() * 76)}px`);
        px.style.setProperty("--dy", `${Math.round(-18 - Math.random() * 54)}px`);
        px.style.setProperty("--r", `${Math.round(-180 + Math.random() * 360)}deg`);
        px.style.setProperty("--c", colors[(row + col) % colors.length]);
        fragment.appendChild(px);
      }
    }
    fx.appendChild(fragment);
    cardNode.appendChild(fx);
  }

  function feedbackBurst(text, x, y, kind) {
    if (reduced) return;
    const node = document.createElement("div");
    node.className = "feedback-burst" + (kind ? " " + kind : "");
    node.textContent = text;
    node.style.left = x + "px";
    node.style.top = y + "px";
    document.body.appendChild(node);
    window.setTimeout(() => node.remove(), 1100);
  }

  // A split-second arcade slam plays before the result panel. It sits under
  // overlays, so it never blocks input and is skipped for reduced motion.
  function dramaticReveal(correct, answer) {
    if (reduced || !el.answerSlam) return;
    el.answerSlamText.textContent = String(answer || "").toUpperCase();
    el.answerSlam.className = "answer-slam " + (correct ? "good" : "bad");
    // Next-frame restart avoids a forced layout flush at the reveal moment.
    window.requestAnimationFrame(() => {
      el.answerSlam.classList.add("show");
      burstAt(window.innerWidth / 2, window.innerHeight / 2,
        correct ? "#ffe08a" : "#ff5577", lowPower ? 8 : 24);
    });
    window.setTimeout(() => el.answerSlam.classList.remove("show"), 800);
  }

  function fishRewardFX(amount) {
    if (reduced || !el.fishReward || !(amount > 0)) return;
    const count = lowPower ? 3 : Math.max(3, Math.min(9, Math.ceil(amount / 8) + 2));
    const svg = fishSVG();
    let markup = "";
    for (let i = 0; i < count; i++) {
      const delay = (i * 0.085).toFixed(3);
      const drift = -150 + Math.round((300 / Math.max(1, count - 1)) * i);
      markup += '<span class="reward-fish" style="--i:' + delay + 's;--drift:' + drift + 'px">' + svg + '</span>';
    }
    markup += '<span class="reward-coin">+' + amount + ' FISH</span>';
    el.fishReward.innerHTML = markup;
    window.setTimeout(() => {
      if (el.fishReward) el.fishReward.innerHTML = "";
    }, 1700);
  }

  function rearrange(before) {
    if (!before || reduced) return;
    window.requestAnimationFrame(() => {
      const moves = [];
      before.forEach((rect, node) => {
        if (node.classList.contains("gone")) return;
        const now = node.getBoundingClientRect();
        const dx = rect.left - now.left;
        const dy = rect.top - now.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        moves.push({ node, dx, dy });
      });
      // All reads happen before any .animate() write, so the browser does not
      // have to re-layout between cards.
      moves.forEach(({ node, dx, dy }) => {
        node.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0,0)" }],
          { duration: 460, easing: "cubic-bezier(.22,1,.36,1)" }
        );
      });
    });
  }

  function buildMenuParticles() {
    if (reduced) return;
    const host = document.querySelector(".menu-frame");
    if (!host || lowPower) return;
    const colors = ["var(--pink)", "var(--cyan)", "var(--amber)", "var(--purple)", "var(--ink)"];
    for (let i = 0; i < 20; i++) {
      const p = document.createElement("span");
      p.className = "spark";
      p.style.setProperty("--x", `${4 + Math.random() * 92}%`);
      p.style.setProperty("--y", `${20 + Math.random() * 80}%`);
      p.style.setProperty("--s", `${2 + Math.floor(Math.random() * 3)}px`);
      p.style.setProperty("--dx", `${-30 + Math.random() * 60}px`);
      p.style.setProperty("--c", colors[i % colors.length]);
      p.style.setProperty("--dur", `${4 + Math.random() * 5}s`);
      p.style.setProperty("--del", `${-Math.random() * 8}s`);
      host.appendChild(p);
    }
  }

  /* ---------------- random fish ---------------- */
  function pickFishType() {
    const roll = Math.random();
    if (roll < 0.01) return "rainbow";
    if (roll < 0.11) return "gold";
    if (roll < 0.16) return "blue";
    return "red";
  }

  function retireFish(fish, delay) {
    if (!fish || fish.dataset.retired === "1") return;
    fish.dataset.retired = "1";
    window.clearTimeout(fish._timer);
    fish._removeTimer = window.setTimeout(() => {
      fish.remove();
      // Never keep decorating a hidden/off-power screen in the background.
      if (!reduced && !lowPower && !document.hidden && el.menu.classList.contains("is-active")) spawnFish();
    }, delay || 0);
  }

  function clearFish() {
    fishStarted = false;
    if (!el.fishLayer) return;
    Array.prototype.forEach.call(el.fishLayer.children, (fish) => {
      window.clearTimeout(fish._timer);
      window.clearTimeout(fish._removeTimer);
      fish.remove();
    });
  }

  function spawnFish() {
    if (!el.fishLayer || reduced || lowPower || document.hidden || !el.menu.classList.contains("is-active")) return;
    const type = pickFishType();
    const info = FISH_TYPES[type];
    const dir = Math.random() < 0.5 ? "right" : "left";
    const swim = 13 + Math.random() * 15;
    const delay = -Math.random() * swim * 0.85;
    const size = (type === "rainbow" ? 74 : type === "gold" ? 68 : type === "blue" ? 62 : 54) + Math.random() * 10;

    const fish = document.createElement("button");
    fish.type = "button";
    fish.className = "menu-fish fish-" + type;
    fish.dataset.type = type;
    fish.dataset.dir = dir;
    fish.setAttribute("aria-label", `Catch a ${type} herring for ${info.value} fish`);
    fish.style.setProperty("--top", `${6 + Math.random() * 82}%`);
    fish.style.setProperty("--size", `${Math.round(size)}px`);
    fish.style.setProperty("--swim", `${swim.toFixed(2)}s`);
    fish.style.setProperty("--delay", `${delay.toFixed(2)}s`);
    fish.style.setProperty("--glow", info.glow);
    fish.style.color = info.color;
    fish.innerHTML = '<span class="fish-inner"><span class="fish-face">' + FISH_SVG(type) + '</span></span>';
    el.fishLayer.appendChild(fish);

    // One timeout replaces a per-frame getBoundingClientRect() poll. The
    // negative CSS delay already accounts for how far into the swim we start.
    fish._timer = window.setTimeout(() => {
      if (fish.dataset.caught !== "1" && fish.dataset.retired !== "1") retireFish(fish, 0);
    }, Math.max(0, (swim + delay) * 1000) + 120);
    fish.addEventListener("animationend", (event) => {
      if (event.animationName !== "fishRight" && event.animationName !== "fishLeft") return;
      if (fish.dataset.caught !== "1") retireFish(fish, 0);
    });
    fish.addEventListener("click", () => catchFish(fish));
  }

  function startFish() {
    if (fishStarted || reduced || lowPower || !el.fishLayer || document.hidden ||
        !el.menu.classList.contains("is-active")) return;
    fishStarted = true;
    [0, 900, 2100, 3400].forEach((delay) => window.setTimeout(spawnFish, delay));
  }

  function catchFish(fish) {
    if (fish.dataset.caught === "1" || fish.dataset.retired === "1") return;
    const type = fish.dataset.type || "red";
    const info = FISH_TYPES[type] || FISH_TYPES.red;
    const rect = fish.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const current = B.getData();
    B.updateData({ fish: current.fish + info.value, fishCaught: current.fishCaught + 1 });

    fish.dataset.caught = "1";
    fish.classList.add("caught");
    window.clearTimeout(fish._timer);
    window.setTimeout(() => retireFish(fish, 120), 360);

    burstAt(cx, cy, info.color, 18);
    valuePop("+" + info.value + " FISH", cx, cy, info.color);
    feedbackBurst("CATCH!", cx, cy - 12, "fish");

    const milestones = {
      1: "FIRST CATCH! THE HERRING ESCAPES... FOR NOW.",
      5: "5 CATCHES! YOU'RE A NATURAL ANGLER.",
      10: "10 CATCHES! THE RIVER IS WORRIED.",
      25: "25 CATCHES! LEGENDARY HERRING HUNTER."
    };
    toast(milestones[current.fishCaught + 1] || info.lines[current.fishCaught % info.lines.length]);
    Sfx.play(info.sound || "catch");
  }

  /* ---------------- appearance ---------------- */
  function applyTheme(id) {
    themeIds.forEach((name) => document.body.classList.remove("theme-" + name));
    if (id && id !== "classic-theme" && themeIds.indexOf(id) >= 0) document.body.classList.add("theme-" + id);
  }

  function applySkin() {
    const skin = accountData.skin || "classic";
    const palette = SKIN_FISH[skin] || SKIN_FISH.classic;
    document.body.style.setProperty("--skin-a", palette.body);
    document.body.style.setProperty("--skin-b", palette.shadow);
    document.body.style.setProperty("--skin-c", palette.accent);
    document.body.style.setProperty("--fish-glow", palette.body);
    cardEls.forEach((node) => {
      shopItems.filter((item) => item.type === "skin").forEach((item) => node.classList.remove("skin-" + item.id));
      node.classList.add("skin-" + skin);
    });
    if (lastFishSkin !== skin) {
      lastFishSkin = skin;
      cardEls.forEach((node) => {
        const svg = node.querySelector(".flip-btn .pixel-fish");
        if (svg) svg.outerHTML = fishSVG();
      });
    }
  }

  function applyPattern() {
    const pattern = accountData.pattern || "solid";
    cardEls.forEach((node) => {
      const back = node.querySelector(".card-back");
      if (!back) return;
      patternIds.forEach((id) => back.classList.remove("pattern-" + id));
      back.classList.add("pattern-" + pattern);
    });
  }

  function applyData(data) {
    accountData = normalizeData(data);
    // Legacy theme ids are swapped once, then stamped with themeV: 2. Without
    // this write the swap re-ran on every load: old "sunset" became "midnight",
    // then the next save turned that "midnight" into "classic-theme". Devices
    // ended up with different shop unlocks. Persisting it ends the cycle.
    if (data && data.themeV !== 2) {
      B.updateData({ themeV: 2, owned: accountData.owned, theme: accountData.theme });
    }
    stats = accountData.stats;
    soundOn = accountData.sound !== "off";
    applyTheme(accountData.theme);
    applySkin();
    applyPattern();
    updateMenuStats();
    syncFishCount();
    syncSound();
    updateHUD();
    updateAccountUI();
    if (!el.shopOverlay.hidden) renderShop(shopTab);
    if (!el.settingsOverlay.hidden) renderSettings(settingsTab);
    if (!el.accountOverlay.hidden) renderAccount();
    if (!el.statsOverlay.hidden) renderStats();
  }

  function updateMenuStats() {
    el.menuStreak.textContent = String(stats.streak || 0);
    el.menuPlayed.textContent = String(stats.played || 0);
    el.menuRate.textContent = (stats.played ? Math.round((stats.wins / stats.played) * 100) : 0) + "%";
    el.menuBest.textContent = String(stats.best || 0);
  }

  function renderStats() {
    const history = sanitizeHistory(stats.history || []);
    const played = Math.max(0, Number(stats.played) || 0);
    const wins = Math.max(0, Number(stats.wins) || 0);
    const totalScore = Math.max(0, Number(stats.totalScore) || 0);
    const rate = played ? Math.round((wins / played) * 100) : 0;
    const avgScore = played ? Math.round(totalScore / played) : 0;
    const avgFish = history.length
      ? Math.round(history.reduce((sum, row) => sum + row.fish, 0) / history.length) : 0;
    const recent = history.slice(-12);
    const peak = Math.max(650, ...recent.map((row) => row.score));
    const shortDate = (value) => {
      const parts = String(value || "").split("-");
      return parts.length === 3 ? parts[1] + "/" + parts[2] : (value || "—");
    };

    const bars = recent.map((row, i) => {
      const height = Math.max(6, Math.round((row.score / peak) * 100));
      return '<div class="trend-bar ' + (row.correct ? "win" : "loss") + '" style="--h:' + height + '%;--i:' + i + '" title="' +
        esc(shortDate(row.date) + " · " + row.answer + " · " + row.score + " PTS") + '"></div>';
    }).join("");

    const rows = history.slice(-20).reverse().map((row) => {
      const reason = row.fullReveal ? " · FULL REVEAL" :
        row.reason === "time" ? " · TIMED OUT" :
        row.reason === "burned" ? " · ALL BURNED" : "";
      return '<div class="history-row ' + (row.correct ? "win" : "loss") + '">' +
        '<span class="history-result">' + (row.correct ? "WIN" : "MISS") + '</span>' +
        '<span class="history-answer">' + esc(row.answer || "—") + '</span>' +
        '<span class="history-score">' + row.score + ' PTS</span>' +
        '<span class="history-meta">' + esc(shortDate(row.date)) + ' · <em>+' + row.fish + ' FISH</em> · ' +
          row.flipped + ' FLIPS · ' + row.herrings + ' HERRINGS BURNED' + esc(reason) + '</span>' +
      '</div>';
    }).join("");

    el.statsBody.innerHTML =
      '<div class="stat-grid">' +
        '<div class="stat-card hero"><span>DAILY PLAYS</span><strong>' + played + '</strong></div>' +
        '<div class="stat-card hero"><span>WIN RATE</span><strong>' + rate + '%</strong></div>' +
        '<div class="stat-card"><span>CURRENT STREAK</span><strong>' + (stats.streak || 0) + '</strong></div>' +
        '<div class="stat-card"><span>BEST SCORE</span><strong>' + (stats.best || 0) + '</strong></div>' +
        '<div class="stat-card"><span>AVG SCORE</span><strong>' + avgScore + '</strong></div>' +
        '<div class="stat-card"><span>AVG FISH / ROUND</span><strong>' + avgFish + '</strong></div>' +
      '</div>' +
      (history.length ? "" : '<p class="stats-note">FINISH TODAY’S DAILY TO START YOUR ROUND LOG.</p>') +
      '<div class="trend-card">' +
        '<div class="trend-head"><strong>SCORE TREND</strong><small>LAST ' + recent.length + ' DAILY ROUNDS</small></div>' +
        (recent.length ? '<div class="trend-bars">' + bars + '</div>' : '<div class="empty-state">NO ROUNDS LOGGED YET.</div>') +
      '</div>' +
      '<h3 class="history-title">PAST PERFORMANCE</h3>' +
      (rows ? '<div class="history-list">' + rows + '</div>'
            : '<div class="empty-state">YOUR LAST 20 FINISHED DAILIES WILL APPEAR HERE.<br />ARCADE AND PRACTICE ROUNDS DO NOT COUNT.</div>');
  }

  function openStats() {
    Sfx.play("open");
    renderStats();
    openOverlay(el.statsOverlay);
  }

  function syncFishCount() {
    el.fishCount.textContent = "FISH BANK: " + accountData.fish;
    // The badge counts shop items you can actually buy right now.
    const affordable = shopItems.filter((item) =>
      accountData.owned.indexOf(item.id) < 0 && accountData.fish >= item.price).length;
    el.shopBadge.textContent = String(affordable);
    el.shop.setAttribute("aria-label", `SHOP — ${affordable} ITEMS YOU CAN AFFORD`);
    el.shop.title = `${affordable} SHOP ITEM${affordable === 1 ? "" : "S"} YOU CAN AFFORD`;
    el.shopFish.textContent = String(accountData.fish);
    if (!devIsActive()) store.set(FISH_KEY, String(accountData.fish));
  }

  function avatarMarkup(photo) {
    const value = photo || "preset:fish";
    if (typeof value === "string" && value.indexOf("preset:") === 0) {
      const preset = presetAvatars.find((p) => p.id === value.slice(7));
      if (preset) return preset.svg;
    }
    const byId = presetAvatars.find((p) => p.id === value);
    if (byId) return byId.svg;
    if (/^(data:image\/|https?:\/\/)/i.test(value)) return '<img src="' + esc(value) + '" alt="">';
    return presetAvatars.length ? presetAvatars[0].svg : "";
  }

  function updateAccountUI() {
    if (el.accountAvatar) el.accountAvatar.innerHTML = avatarMarkup(currentUser && currentUser.photo);
    if (el.accountMode) {
      const who = currentUser ? (currentUser.name || "PLAYER").toUpperCase() : "GUEST";
      const sync = B.mode === "cloud" && currentUser && B.getSyncState ? B.getSyncState() : null;
      const tag = sync && sync.status === "error" ? " · SYNC FAILED" :
        sync && sync.status === "syncing" ? " · SYNCING" : "";
      el.accountMode.textContent = (B.mode === "cloud" ? "CLOUD" : "LOCAL") + " · " + who + tag;
    }
  }

  function migrateLegacy() {
    if (store.get(MIGRATED_KEY) === "1") return;
    const current = normalizeData(B.getData());
    const patch = {};
    const legacyFish = Math.max(0, Number.parseInt(store.get(FISH_KEY) || "0", 10) || 0);
    const legacySound = store.get(SOUND_KEY);
    let legacyStats = null;
    try { legacyStats = JSON.parse(store.get(STATS_KEY) || "null"); } catch (_) { /* ignore */ }

    if (legacyFish > 0 && current.fish === 0) {
      patch.fish = legacyFish;
      patch.fishCaught = legacyFish;
    }
    if (legacyStats && legacyStats.played > 0 && current.stats.played === 0) patch.stats = legacyStats;
    if (legacySound === "off" && current.sound === "on") patch.sound = "off";
    if (Object.keys(patch).length) B.updateData(patch);
    store.set(MIGRATED_KEY, "1");
  }

  /* ---------------- shop & settings ---------------- */
  function itemCard(item) {
    const owned = accountData.owned.indexOf(item.id) >= 0;
    const field = item.type === "skin" ? "skin" : item.type === "pattern" ? "pattern" : "theme";
    const equipped = accountData[field] === item.id;
    let label;
    let action;
    let disabled = "";
    let extra = "";

    if (equipped) {
      label = "EQUIPPED";
      action = "none";
      disabled = " disabled";
      extra = " equipped";
    } else if (owned) {
      label = "EQUIP";
      action = "equip";
      extra = " owned";
    } else {
      action = "buy";
      label = "BUY · " + item.price + " FISH";
      if (accountData.fish < item.price) disabled = " disabled";
    }

    const colors = item.swatch || [];
    let preview;
    if (item.type === "skin") {
      const palette = SKIN_FISH[item.id] || SKIN_FISH.classic;
      const backFish = FISH_SVG("red", { palette });
      preview = '<div class="skin-preview">' +
        '<div class="card skin-' + esc(item.id) + ' preview-card" aria-hidden="true">' +
          '<div class="card-inner"><div class="card-back"><span class="flip-btn">' + backFish + '</span></div></div>' +
        '</div>' +
        '<div class="card skin-' + esc(item.id) + ' preview-card" aria-hidden="true">' +
          '<div class="card-inner"><div class="card-front"><span class="preview-mark">RH</span></div></div>' +
        '</div>' +
      '</div>';
    } else if (item.type === "pattern") {
      const patternFish = SKIN_FISH[accountData.skin] || SKIN_FISH.classic;
      preview = '<div class="pattern-preview pattern-' + esc(item.id) + '">' +
        FISH_SVG("red", { palette: patternFish }) +
        '</div>';
    } else {
      const themeStyle = "--tp-a:" + esc(colors[0] || "#ff5577") +
        ";--tp-b:" + esc(colors[1] || "#0b0509") +
        ";--tp-c:" + esc(colors[2] || "#ffffff");
      const themeFish = FISH_SVG("red", { palette: { body: colors[2] || "#ffffff", shadow: colors[1] || "#0b0509", accent: colors[0] || "#ff5577" } });
      preview = '<div class="theme-preview theme-' + esc(item.id) + '" style="' + themeStyle + '">' +
        '<div class="theme-bar"><span class="theme-dot"></span><span>RED HERRING</span></div>' +
        '<div class="theme-tiles"><b></b><b></b><b></b></div>' +
        '<div class="theme-fish">' + themeFish + '</div>' +
      '</div>';
    }
    return '<div class="item-card' + extra + (item.event ? " event" : "") + '">' +
      (item.event ? '<span class="item-badge">EVENT</span>' : "") +
      '<div class="item-preview preview-' + esc(item.type) + '">' + preview + '</div>' +
      '<div class="item-name">' + esc(item.name) + '</div>' +
      '<div class="item-desc">' + esc(item.desc) + '</div>' +
      '<button class="item-buy' + (equipped ? " equipped" : owned ? " owned" : "") + '" type="button" ' +
        'data-action="' + action + '" data-id="' + esc(item.id) + '"' + disabled + '>' + label + '</button>' +
      '</div>';
  }

  function shopSection(title, items, className) {
    if (!items || !items.length) return "";
    return '<section class="shop-section ' + className + '">' +
      '<h3>' + esc(title) + '</h3>' +
      '<div class="item-grid">' + items.map(itemCard).join("") + '</div>' +
      '</section>';
  }

  function renderShop(tab) {
    shopTab = tab || shopTab;
    Array.prototype.forEach.call(el.shopTabs.querySelectorAll(".tab"), (btn) => {
      btn.classList.toggle("active", btn.dataset.tab === shopTab);
    });
    const isEvent = shopTab === "event";
    const owned = accountData.owned;
    const sorted = (list) => list.slice().sort((a, b) => a.price - b.price);
    let html = "";

    if (isEvent) {
      const eventItems = sorted(shopItems.filter((item) => item.event));
      const eventTypes = [["skin", "CARD COLORS"], ["pattern", "PATTERNS"], ["theme", "THEMES"]];
      let hasEventOwned = false;
      eventTypes.forEach(([type, label]) => {
        const ownedItems = eventItems.filter((item) => item.type === type && owned.indexOf(item.id) >= 0);
        if (ownedItems.length) {
          hasEventOwned = true;
          html += shopSection("OWNED " + label, ownedItems, "owned-section event-owned " + type);
        }
      });
      if (!hasEventOwned) {
        html += '<p class="shop-note">EVENT FINDS STAY YOURS — THEY ALSO SHOW UP IN THE NORMAL OWNED SECTIONS.</p>';
      }
      eventTypes.forEach(([type, label]) => {
        const items = eventItems.filter((item) => item.type === type && owned.indexOf(item.id) < 0);
        if (items.length) html += shopSection(label, items, "event-group " + type);
      });
      if (html.indexOf("event-group") < 0) html += '<p class="shop-note">ALL EVENT GEAR OWNED. NICE.</p>';
    } else {
      const typeItems = sorted(shopItems.filter((item) => item.type === shopTab));
      const ownedItems = typeItems.filter((item) => owned.indexOf(item.id) >= 0);
      const forSale = typeItems.filter((item) => owned.indexOf(item.id) < 0);
      html += shopSection("OWNED", ownedItems, "owned-section");
      html += shopSection("AVAILABLE", forSale, "shop-group");
    }

    el.shopItems.innerHTML = html || '<p class="account-note">NOTHING HERE YET.</p>';
    if (el.devBar) el.devBar.hidden = !devUnlocked;
    if (el.shopOverlay) el.shopOverlay.classList.toggle("event-shop", isEvent);
    if (el.shopEventBanner) el.shopEventBanner.hidden = !isEvent;
    syncFishCount();
  }

  function buyItem(id) {
    const item = shopItems.find((entry) => entry.id === id);
    if (!item) return;
    const current = normalizeData(B.getData());
    if (current.owned.indexOf(id) >= 0) { equipItem(id); return; }
    if (current.fish < item.price) { toast("NOT ENOUGH FISH — CATCH SOME MORE!"); Sfx.play("bad"); return; }
    B.updateData({ fish: current.fish - item.price, owned: current.owned.concat(id) });
    Sfx.play("buy");
    toast(item.name.toUpperCase() + " UNLOCKED!");
    renderShop(shopTab);
  }

  function equipItem(id) {
    const item = shopItems.find((entry) => entry.id === id);
    if (!item) return;
    const field = item.type === "skin" ? "skin" : item.type === "pattern" ? "pattern" : "theme";
    B.updateData({ [field]: id });
    Sfx.play("click");
    toast(item.name.toUpperCase() + " EQUIPPED");
    renderShop(shopTab);
  }

  function renderSettings(tab) {
    settingsTab = tab || settingsTab;
    Array.prototype.forEach.call(el.settingsTabs.querySelectorAll(".tab"), (btn) => {
      btn.classList.toggle("active", btn.dataset.tab === settingsTab);
    });

    if (settingsTab === "account") {
      const name = currentUser ? currentUser.name || "PLAYER" : "GUEST";
      el.settingsContent.innerHTML =
        '<div class="settings-row"><span>ACCOUNT</span><strong>' + esc(name) + '</strong></div>' +
        '<div class="settings-row"><span>STATUS</span><strong>' + (currentUser ? "SIGNED IN" : "GUEST") + '</strong></div>' +
        '<div class="settings-row"><span>MODE</span><strong>' + (B.mode === "cloud" ? "CLOUD" : "LOCAL") + '</strong></div>' +
        '<button class="px-btn primary" type="button" data-action="open-account" style="width:100%;margin-top:14px">' +
          (currentUser ? "MANAGE ACCOUNT" : "LOG IN / CREATE ACCOUNT") +
        '</button>';
      return;
    }

    if (settingsTab === "codes") {
      el.settingsContent.innerHTML =
        '<div class="code-entry">' +
          '<label class="form-field"><span>CODE</span><input name="code" type="text" maxlength="32" placeholder="TYPE CODE HERE" autocomplete="off" spellcheck="false" value="' + esc(codeDraft) + '"' + (codeBusy ? " disabled" : "") + '></label>' +
          '<button class="px-btn primary" type="button" data-action="redeem-code" style="width:100%"' + (codeBusy ? " disabled" : "") + '>' + (codeBusy ? "CHECKING CODE…" : "REDEEM CODE") + '</button>' +
        '</div>' +
        (devUnlocked
          ? '<p class="account-note dev-pointer">DEV TOOLS · FREE FISH AND UNLOCK ALL ITEMS ARE IN THE SHOP.</p>'
          : "") +
        '<p class="account-error" role="alert">' + esc(codeError) + '</p>';
      return;
    }

    el.settingsContent.innerHTML =
      '<p class="account-note">BASIC OPTIONS — CARD COLORS, PATTERNS AND THEMES ARE BOUGHT AND EQUIPPED IN THE SHOP.</p>' +
      '<div class="settings-row"><span>SOUND</span><strong>' + (soundOn ? "ON" : "OFF") + '</strong></div>' +
      '<button class="px-btn" type="button" data-action="toggle-sound" style="width:100%;margin-top:4px">' +
        (soundOn ? "TURN SOUND OFF" : "TURN SOUND ON") +
      '</button>' +
      '<div class="settings-row"><span>LOW POWER MODE</span><strong>' + (lowPower ? "ON" : "OFF") + '</strong></div>' +
      '<button class="px-btn" type="button" data-action="toggle-perf" style="width:100%;margin-top:4px">' +
        (lowPower ? "TURN LOW POWER OFF" : "TURN LOW POWER ON") +
      '</button>' +
      '<p class="account-note">SKIPS HEAVY DECORATIVE EFFECTS ON SLOWER DEVICES. THE GAME ITSELF IS UNCHANGED.</p>' +
      '<div class="settings-row"><span>FISH BANK</span><strong>' + accountData.fish + '</strong></div>' +
      '<div class="settings-row"><span>STREAK</span><strong>' + (stats.streak || 0) + '</strong></div>' +
      '<div class="settings-row"><span>MODE</span><strong>' + (B.mode === "cloud" ? "CLOUD" : "LOCAL") + '</strong></div>';
  }

  /* ---------------- account ---------------- */
  function showAccountError(message) {
    accountView.error = message || "";
    const node = el.accountBody.querySelector(".account-error");
    if (node) node.textContent = accountView.error;
    else toast(accountView.error);
  }

  function renderAccount() {
    if (!currentUser && accountView.form !== "login" && accountView.form !== "signup") accountView.form = "login";
    if (accountView.form === "login" || accountView.form === "signup") { renderAccountAuth(); return; }
    if (accountView.form === "edit" && currentUser) { renderAccountEdit(currentUser); return; }
    renderAccountView(currentUser);
  }

  function cloudSyncMarkup() {
    if (B.mode !== "cloud" || !currentUser || !B.getSyncState) return "";
    const s = B.getSyncState();
    const failed = s.status === "error";
    const label = failed ? "SYNC FAILED" : s.status === "syncing" ? "SYNCING…" :
      s.status === "saved" ? "CLOUD SAVED" : "CLOUD READY";
    const detail = failed
      ? "SAVED ON THIS DEVICE ONLY · " + (s.error || "CLOUD SAVE BLOCKED").slice(0, 60)
      : s.lastSync
        ? "LAST SYNC " + new Date(s.lastSync).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "PROGRESS SAVES TO YOUR ACCOUNT";
    return '<div class="sync-row' + (failed ? " failed" : "") + '">' +
        '<span>SYNC STATUS</span><strong>' + esc(label) + '</strong>' +
        '<small>' + esc(detail) + '</small>' +
      '</div>' +
      '<button class="px-btn sync-now" type="button" data-action="sync">SYNC NOW</button>';
  }

  function renderAccountView(user) {
    if (!user) { renderAccountAuth(); return; }
    el.accountBody.innerHTML =
      '<div class="account-card">' +
        '<div class="account-avatar">' + avatarMarkup(user.photo) + '</div>' +
        '<div class="account-name">' + esc(user.name || "PLAYER") + '</div>' +
        '<div class="account-email">' + esc(user.email || "LOCAL PLAYER") + '</div>' +
        '<span class="admin-tag">' + esc((user.provider || (B.mode === "cloud" ? "cloud" : "local")).toUpperCase()) + '</span>' +
      '</div>' +
      '<div class="settings-row"><span>FISH BANK</span><strong>' + accountData.fish + '</strong></div>' +
      '<div class="settings-row"><span>WINS</span><strong>' + (stats.wins || 0) + '</strong></div>' +
      '<div class="settings-row"><span>STREAK</span><strong>' + (stats.streak || 0) + '</strong></div>' +
      cloudSyncMarkup() +
      '<div class="account-actions">' +
        '<button class="px-btn" type="button" data-action="edit-profile">EDIT PROFILE</button>' +
        '<button class="px-btn" type="button" data-action="sign-out">SIGN OUT</button>' +
      '</div>';
  }

  function renderAccountAuth() {
    const signup = accountView.form === "signup";
    el.accountBody.innerHTML =
      '<form data-form="auth" novalidate>' +
        (signup ? '<label class="form-field"><span>DISPLAY NAME</span><input name="name" type="text" maxlength="24" placeholder="YOUR NAME" autocomplete="nickname"></label>' : "") +
        '<label class="form-field"><span>EMAIL</span><input name="email" type="email" placeholder="YOU@EXAMPLE.COM" autocomplete="email"></label>' +
        '<label class="form-field"><span>PASSWORD</span><input name="password" type="password" placeholder="••••••••" autocomplete="' + (signup ? "new-password" : "current-password") + '"></label>' +
        '<button class="px-btn primary auth-submit" type="submit" data-action="' + (signup ? "signup" : "login") + '">' +
          (signup ? "CREATE ACCOUNT" : "LOG IN") +
        '</button>' +
      '</form>' +
      '<button class="google-btn" type="button" data-action="google"><span class="g-mark">G</span> CONTINUE WITH GOOGLE</button>' +
      '<button class="switch-cta' + (signup ? " subtle" : "") + '" type="button" data-action="switch" data-mode="' + (signup ? "login" : "signup") + '">' +
        (signup ? 'ALREADY HAVE AN ACCOUNT? LOG IN' : '<span class="switch-star">✦</span> NEW HERE? CREATE ACCOUNT') +
      '</button>' +
      '<p class="account-error" role="alert">' + esc(accountView.error) + '</p>' +
      '<p class="account-note">' + (B.mode === "cloud"
        ? "CLOUD MODE — YOUR PROGRESS SYNCES ACROSS DEVICES WHEN YOU SIGN IN WITH THE SAME EMAIL."
        : "LOCAL MODE — ACCOUNTS AND PROGRESS ARE SAVED IN THIS BROWSER ONLY. LOG IN FROM THE SAME BROWSER TO SEE THEM.") +
      '</p>';
  }

  function renderAccountEdit(user) {
    const selected = accountView.selectedAvatar || user.photo || "preset:fish";
    const presets = presetAvatars.map((preset) =>
      '<button class="avatar-option' + (selected === "preset:" + preset.id ? " selected" : "") + '" type="button" ' +
        'data-action="preset" data-preset="' + esc(preset.id) + '" aria-label="' + esc(preset.name) + '">' + preset.svg + '</button>'
    ).join("");
    el.accountBody.innerHTML =
      '<div class="avatar-preview">' + avatarMarkup(selected) + '</div>' +
      '<form data-form="edit">' +
        '<label class="form-field"><span>DISPLAY NAME</span><input name="name" type="text" maxlength="24" value="' + esc(accountView.draftName) + '"></label>' +
        '<p class="account-note" style="margin-top:0">PICK A PIXEL AVATAR</p>' +
        '<div class="avatar-grid">' + presets + '</div>' +
        '<label class="form-field"><span>OR UPLOAD AN IMAGE</span><input id="avatar-upload" type="file" accept="image/*"></label>' +
        '<div class="account-actions">' +
          '<button class="px-btn primary" type="submit">SAVE PROFILE</button>' +
          '<button class="px-btn" type="button" data-action="cancel-edit">CANCEL</button>' +
        '</div>' +
      '</form>' +
      '<p class="account-error">' + esc(accountView.error) + '</p>';
  }

  function openAccount(form) {
    accountView.form = form || (currentUser ? "view" : "login");
    accountView.error = "";
    if (currentUser) {
      accountView.selectedAvatar = currentUser.photo || "preset:fish";
      accountView.draftName = currentUser.name || "";
    }
    renderAccount();
    openOverlay(el.accountOverlay);
    Sfx.play("open");
  }

  /* ---------------- arcade ---------------- */
  function arcadeUnlocked() { return devUnlocked || dailyDoneDate === today; }

  function updateArcadeButton() {
    const open = arcadeUnlocked();
    el.arcade.classList.toggle("locked", !open);
    el.arcade.classList.toggle("unlocked", open);
    el.arcade.setAttribute("aria-disabled", open ? "false" : "true");
    el.arcadeLabel.textContent = open ? "ARCADE · UNLOCKED" : "ARCADE · LOCKED";
  }

  function markDailyDone() {
    if (devUnlocked || currentMode !== "daily") return;
    dailyDoneDate = today;
    store.set(ARCADE_KEY, today);
    updateArcadeButton();
  }

  /* ---------------- pixel icons (arcade events, modes, twists) ---------------- */
  // All icons draw with currentColor so each button's accent colour drives them.
  const ICONS = {
    cabinet:
      '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path d="M4 1h8v2h2v8h-2v4H4v-4H2V3h2V1z" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<rect x="4" y="4" width="8" height="4" fill="currentColor" opacity=".45"/><rect x="5" y="5" width="2" height="2" fill="currentColor"/>' +
      '<rect x="2" y="10" width="12" height="2" fill="currentColor"/><rect x="5" y="12" width="2" height="2" fill="currentColor"/></svg>',
    tree:
      '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="7" y="0" width="2" height="2" fill="currentColor"/>' +
      '<rect x="6" y="2" width="4" height="2" fill="currentColor"/><rect x="5" y="4" width="6" height="2" fill="currentColor"/>' +
      '<rect x="4" y="6" width="8" height="2" fill="currentColor"/><rect x="3" y="8" width="10" height="2" fill="currentColor"/>' +
      '<rect x="2" y="10" width="12" height="2" fill="currentColor"/><rect x="7" y="12" width="2" height="3" fill="currentColor"/>' +
      '<rect x="5" y="7" width="1" height="1" fill="#fff"/><rect x="10" y="9" width="1" height="1" fill="#fff"/></svg>',
    dice:
      '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<rect x="4" y="4" width="2" height="2" fill="currentColor"/><rect x="10" y="10" width="2" height="2" fill="currentColor"/>' +
      '<rect x="7" y="7" width="2" height="2" fill="currentColor"/></svg>',
    coin:
      '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="4" y="1" width="8" height="2" fill="currentColor"/>' +
      '<rect x="2" y="3" width="12" height="10" fill="currentColor" opacity=".35"/><rect x="4" y="3" width="8" height="10" fill="currentColor"/>' +
      '<rect x="6" y="5" width="4" height="6" fill="#0b0509"/><rect x="7" y="6" width="2" height="4" fill="currentColor"/></svg>',
    eye:
      '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="1" y="7" width="14" height="2" fill="currentColor"/>' +
      '<rect x="3" y="5" width="10" height="6" fill="currentColor" opacity=".3"/><rect x="6" y="6" width="4" height="4" fill="currentColor"/>' +
      '<rect x="7" y="7" width="2" height="2" fill="#0b0509"/></svg>',
    bolt:
      '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="8" y="0" width="5" height="2" fill="currentColor"/>' +
      '<rect x="6" y="2" width="5" height="3" fill="currentColor"/><rect x="4" y="5" width="5" height="3" fill="currentColor"/>' +
      '<rect x="6" y="8" width="5" height="3" fill="currentColor"/><rect x="4" y="11" width="5" height="3" fill="currentColor"/>' +
      '<rect x="3" y="13" width="4" height="2" fill="currentColor"/></svg>',
    gift:
      '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="2" y="6" width="12" height="9" fill="currentColor"/>' +
      '<rect x="1" y="4" width="14" height="2" fill="currentColor"/><rect x="7" y="4" width="2" height="11" fill="#0b0509"/>' +
      '<rect x="6" y="1" width="4" height="3" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<rect x="4" y="1" width="2" height="2" fill="currentColor"/><rect x="10" y="1" width="2" height="2" fill="currentColor"/></svg>',
    clock:
      '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="4" y="0" width="8" height="2" fill="currentColor"/>' +
      '<rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<rect x="7" y="4" width="2" height="5" fill="currentColor"/><rect x="7" y="9" width="4" height="2" fill="currentColor"/></svg>',
    star1:
      '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="7" y="2" width="2" height="12" fill="currentColor"/>' +
      '<rect x="2" y="7" width="12" height="2" fill="currentColor"/><rect x="4" y="4" width="8" height="8" fill="currentColor" opacity=".4"/></svg>',
    star2:
      '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="2" width="2" height="9" fill="currentColor"/>' +
      '<rect x="1" y="5" width="6" height="2" fill="currentColor"/><rect x="11" y="5" width="2" height="9" fill="currentColor"/>' +
      '<rect x="9" y="8" width="6" height="2" fill="currentColor"/></svg>',
    target:
      '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="1" y="1" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<rect x="4" y="4" width="8" height="8" fill="currentColor" opacity=".4"/><rect x="6" y="6" width="4" height="4" fill="currentColor"/></svg>',
    flame:
      '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="7" y="0" width="3" height="3" fill="currentColor"/>' +
      '<rect x="5" y="3" width="6" height="3" fill="currentColor"/><rect x="3" y="6" width="10" height="4" fill="currentColor"/>' +
      '<rect x="2" y="10" width="12" height="4" fill="currentColor" opacity=".6"/><rect x="6" y="8" width="4" height="5" fill="#0b0509"/></svg>',
    hourglass:
      '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="0" width="10" height="2" fill="currentColor"/>' +
      '<rect x="3" y="14" width="10" height="2" fill="currentColor"/><rect x="4" y="2" width="8" height="2" fill="currentColor"/>' +
      '<rect x="4" y="12" width="8" height="2" fill="currentColor"/><rect x="5" y="4" width="6" height="2" fill="currentColor"/>' +
      '<rect x="6" y="6" width="4" height="2" fill="currentColor"/><rect x="7" y="8" width="2" height="2" fill="currentColor"/>' +
      '<rect x="5" y="10" width="6" height="2" fill="currentColor"/></svg>',
    skull:
      '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="2" width="10" height="9" fill="currentColor"/>' +
      '<rect x="4" y="11" width="8" height="3" fill="currentColor"/><rect x="5" y="5" width="2" height="3" fill="#0b0509"/>' +
      '<rect x="9" y="5" width="2" height="3" fill="#0b0509"/><rect x="7" y="9" width="2" height="2" fill="#0b0509"/></svg>'
  };

  function icon(name, cls) {
    return '<span class="' + cls + '" aria-hidden="true">' + (ICONS[name] || ICONS.dice) + '</span>';
  }

  function practiceCatalog() {
    return P.CATALOG.concat(P.CHRISTMAS_CATALOG);
  }

  function arcadeCatalog() {
    if (arcadeEvent === "practice") return practiceCatalog();
    return arcadeEvent === "christmas" ? P.CHRISTMAS_CATALOG : activeCatalog();
  }

  function arcadeEventInfo() {
    return E.ARCADE_EVENTS.find((event) => event.id === arcadeEvent) || E.ARCADE_EVENTS[0];
  }

  // TWISTED rolls a random house rule. PRACTICE can pin one, skip it, or roll.
  // DEFAULT and CHRISTMAS always stay clean.
  function rollTwist(mode, forcedId) {
    if (forcedId) {
      if (forcedId === "none") return E.ARCADE_TWISTS[0];
      if (forcedId !== "random") {
        const forced = E.ARCADE_TWISTS.find((twist) => twist.id === forcedId);
        if (forced && (!forced.timed || !!mode.timeLimit)) return forced;
        return E.ARCADE_TWISTS[0];
      }
    }
    if (!arcadeEventInfo().twists) return E.ARCADE_TWISTS[0];
    const pool = E.ARCADE_TWISTS.filter((twist) =>
      twist.id !== "standard" &&
      (!twist.timed || !!mode.timeLimit)
    );
    return pool[Math.floor(Math.random() * pool.length)] || E.ARCADE_TWISTS[0];
  }

  function recentArcadeAnswers() {
    try {
      const raw = JSON.parse(store.get(ARC_RECENT_KEY) || "[]");
      return Array.isArray(raw) ? raw.filter((x) => typeof x === "string") : [];
    } catch (_) { return []; }
  }

  function rememberArcadeAnswer(answer) {
    const recent = recentArcadeAnswers().filter((word) => word !== answer);
    recent.unshift(answer);
    store.set(ARC_RECENT_KEY, JSON.stringify(recent.slice(0, 4)));
  }

  function clearRoundExtras() {
    stopIntro();
    introToken++;
    introActive = false;
    introDismissing = false;
    introEndsAt = 0;
    if (!el.introOverlay.hidden) {
      closeOverlay(el.introOverlay);
      el.introCard.classList.remove("leaving");
    }
    roundTwist = null;
    roundDeadline = 0;
    roundDuration = 0;
    lastTimerSecond = -1;
    el.arcadeStatus.hidden = true;
    el.arcadeStatus.classList.remove("has-timer", "timer-only");
    el.timerBar.hidden = true;
    el.timerBar.className = "timer-bar";
    el.roundTwist.hidden = true;
    el.roundTwist.innerHTML = "";
    document.body.classList.remove("arcade-christmas", "arcade-practice");
    el.game.classList.remove("timer-hot", "timer-critical");
    el.countdown.classList.remove("urgent");
    if (el.answerSlam) el.answerSlam.classList.remove("show");
    if (el.fishReward) el.fishReward.innerHTML = "";
    el.deck.querySelectorAll(".card.faded").forEach((card) => card.classList.remove("faded"));
    el.zoomText.classList.remove("faded-text");
  }

  /* ---------------- short round intro ---------------- */
  // The clock is paused while the intro is up. Skipping (X / ESC / button) or
  // letting it finish both run the same flashy exit before play begins.
  function stopIntro() {
    if (introTimer) window.clearInterval(introTimer);
    introTimer = 0;
  }

  function dismissRoundIntro() {
    if (!introActive || introDismissing) return;
    introDismissing = true;
    introEndsAt = 0;
    stopIntro();
    const token = introToken;
    el.introCard.classList.add("leaving");
    Sfx.play("coin");
    window.setTimeout(() => {
      if (token !== introToken) return;
      introActive = false;
      introDismissing = false;
      closeOverlay(el.introOverlay);
      el.introCard.classList.remove("leaving");
      // Start the real clock only once the player can actually see the board.
      if (currentMode === "arcade" && roundDuration) {
        roundDeadline = Date.now() + roundDuration * 1000;
        lastTimerSecond = -1;
        tick();
      }
    }, reduced ? 0 : 340);
  }

  function showRoundIntro(mode, twist) {
    const event = arcadeEventInfo();
    const accent = twist.accent;
    const hasTwist = twist.id !== "standard";
    el.introCard.style.setProperty("--intro-accent", accent);
    el.introTwist.hidden = !hasTwist;
    el.introKicker.textContent = (event.id === "default" ? "ARCADE" : event.name) + " · ROUND STARTING";
    el.introIcon.innerHTML = icon(mode.icon, "intro-mode-icon");
    el.introTitle.textContent = mode.name;
    el.introSub.textContent = mode.herrings + " WRONG CLUE" + (mode.herrings === 1 ? "" : "S") +
      (roundDuration ? " · " + roundDuration + " SECONDS ON THE CLOCK" : " · NO TIME LIMIT");
    el.introTwistIcon.innerHTML = icon(twist.icon, "intro-rule-icon");
    el.introTwistName.textContent = twist.name;
    el.introTwistDesc.textContent = twist.desc;
    el.introCount.textContent = "5";
    el.introFill.style.transform = "scaleX(1)";
    el.introCard.classList.remove("leaving");
    openOverlay(el.introOverlay);

    introToken++;
    introActive = true;
    introDismissing = false;
    introEndsAt = Date.now() + INTRO_MS;
    stopIntro();
    const frame = () => {
      if (!introActive) return;
      const leftMs = Math.max(0, introEndsAt - Date.now());
      el.introFill.style.transform = "scaleX(" + (leftMs / INTRO_MS).toFixed(4) + ")";
      setText(el.introCount, Math.ceil(leftMs / 1000));
      if (leftMs <= 0) dismissRoundIntro();
    };
    introTimer = window.setInterval(frame, 120);
  }

  function renderArcadeSections() {
    el.arcadeSections.innerHTML = E.ARCADE_EVENTS.map((event) => {
      const go = event.practice ? "PICK SETUP ▶" : event.twists ? "PICK HOUSE RULE ▶" : "PICK DIFFICULTY ▶";
      return '<button class="arcade-section" type="button" data-event="' + esc(event.id) +
        '" style="--event:' + esc(event.accent) + '">' +
        icon(event.icon, "event-icon") +
        '<span class="event-copy">' +
          '<span class="event-kicker">' + esc(event.kicker) + '</span>' +
          '<span class="event-name">' + esc(event.name) + '</span>' +
          '<span class="event-desc">' + esc(event.desc) + '</span>' +
        '</span>' +
        '<span class="event-go">' + go + '</span>' +
      '</button>';
    }).join("");
  }

  function renderArcadeModes() {
    const chosen = arcadeEvent === "twisted"
      ? E.ARCADE_TWISTS.find((twist) => twist.id === arcadeTwistChoice) : null;
    const needsTimer = !!(chosen && chosen.timed);
    el.arcadeModes.innerHTML = E.ARCADE_MODES.map((mode, index) => {
      const blocked = needsTimer && !mode.timeLimit;
      return '<button class="arcade-mode" type="button" data-mode="' + esc(mode.id) + '"' +
        (blocked ? " disabled" : "") +
        ' style="--mode:' + esc(mode.accent) + '">' +
        icon(mode.icon, "mode-icon") +
        '<span class="mode-copy">' +
          '<span class="mode-rank">MODE ' + pad(index + 1) + '</span>' +
          '<span class="mode-name">' + esc(mode.name) + '</span>' +
          '<span class="mode-clues">' + mode.herrings + ' WRONG CLUE' + (mode.herrings === 1 ? "" : "S") + '</span>' +
          (blocked
            ? '<span class="mode-time">NEEDS A TIMER</span>'
            : mode.timeLimit
              ? '<span class="mode-time">⏱ ' + mode.timeLimit + 's LIMIT</span>'
              : "") +
        '</span>' +
        '<span class="mode-pay">' + (Math.round(mode.payout * FISH_BONUS * 10000) / 100) + '% FISH</span>' +
      '</button>';
    }).join("");
    const event = arcadeEventInfo();
    el.arcadeModeTitle.textContent = event.name + " · PICK A DIFFICULTY";
  }

  // TWISTED gets its own selection step, styled exactly like the difficulty
  // picker: pick the house rule first, then the difficulty. Timed rules grey
  // out the untimed modes so a forced rule never silently falls back.
  function renderTwistChoices() {
    const choices = [{
      id: "random", name: "RANDOM HOUSE RULE",
      desc: "SURPRISE ME. A NEW RULE EVERY ROUND.",
      accent: "#b98cff", icon: "dice", payout: 0
    }].concat(E.ARCADE_TWISTS.filter((twist) => twist.id !== "standard"));
    el.arcadeTwists.innerHTML = choices.map((twist, index) =>
      '<button class="arcade-mode twist-choice' + (arcadeTwistChoice === twist.id ? " selected" : "") +
        '" type="button" data-twist="' + esc(twist.id) + '" style="--mode:' + esc(twist.accent) + '">' +
        icon(twist.icon, "mode-icon") +
        '<span class="mode-copy">' +
          '<span class="mode-rank">HOUSE RULE ' + pad(index + 1) + '</span>' +
          '<span class="mode-name">' + esc(twist.name) + '</span>' +
          '<span class="mode-clues">' + esc(twist.desc) + '</span>' +
        '</span>' +
        '<span class="mode-pay">' + (twist.payout ? "×" + twist.payout + " FISH" : "SURPRISE") + '</span>' +
      '</button>').join("");
    el.arcadeModeTitle.textContent = "TWISTED · PICK A HOUSE RULE";
  }

  /* ---------------- themed practice pickers ---------------- */
  // Native selects paint an OS-controlled black popup that ignores the theme,
  // so PRACTICE uses a custom listbox with its own glow, scanlines and motion.
  function closePracticeSelects(except) {
    Object.keys(practiceSelects).forEach((key) => {
      if (practiceSelects[key] && practiceSelects[key] !== except) practiceSelects[key].close();
    });
  }

  function buildPracticeSelect(host, config) {
    const options = config.options;
    let current = config.value;
    let open = false;
    let cursor = 0;
    let disabledFor = config.disabledFor || (() => false);

    host.className = "rh-select";
    host.innerHTML =
      '<button class="rh-select-trigger" type="button" aria-haspopup="listbox" aria-expanded="false">' +
        '<span class="rh-select-corner" aria-hidden="true"></span>' +
        '<span class="rh-select-value"></span>' +
        '<span class="rh-select-chev" aria-hidden="true"><i></i><i></i></span>' +
      '</button>' +
      '<div class="rh-select-menu" role="listbox" hidden><div class="rh-options"></div></div>';

    const trigger = host.querySelector(".rh-select-trigger");
    const valueEl = host.querySelector(".rh-select-value");
    const menu = host.querySelector(".rh-select-menu");
    const list = host.querySelector(".rh-options");

    const indexOf = (value) => options.findIndex((option) => option.value === value);
    const optionAt = (value) => options[indexOf(value)];
    const isDisabled = (option) => !!(option && disabledFor(option));

    function paintValue() {
      const chosen = optionAt(current);
      valueEl.textContent = chosen ? chosen.label : (config.placeholder || "SELECT...");
      host.setAttribute("data-value", current == null ? "" : String(current));
    }

    function renderMenu() {
      list.innerHTML = options.map((option, index) => {
        const disabled = isDisabled(option);
        const selected = option.value === current;
        return '<button type="button" role="option" class="rh-option' +
          (selected ? " is-selected" : "") + (index === cursor ? " is-cursor" : "") +
          (disabled ? " is-disabled" : "") + '" data-index="' + index + '"' +
          (disabled ? ' aria-disabled="true"' : "") + ' aria-selected="' + selected + '"' +
          ' style="--i:' + index + '">' +
          '<span class="rh-option-glyph">' + (option.glyph || (selected ? "▮" : "·")) + '</span>' +
          '<span class="rh-option-label">' + esc(option.label) + '</span>' +
          (option.tag ? '<span class="rh-option-tag">' + esc(option.tag) + '</span>' : "") +
          '<span class="rh-option-caret">▶</span>' +
        '</button>';
      }).join("");
    }

    function scrollToCursor() {
      const active = list.querySelector(".is-cursor");
      if (active) active.scrollIntoView({ block: "nearest" });
    }

    function setOpen(next) {
      if (open === next) return;
      open = next;
      host.classList.toggle("is-open", open);
      trigger.setAttribute("aria-expanded", String(open));
      menu.hidden = !open;
      if (open) {
        closePracticeSelects(api);
        cursor = Math.max(0, indexOf(current));
        renderMenu();
        scrollToCursor();
      }
    }

    function choose(index) {
      const option = options[index];
      if (!option || isDisabled(option)) return;
      current = option.value;
      paintValue();
      setOpen(false);
      Sfx.play("click");
      if (config.onChange) config.onChange(current);
    }

    function move(step) {
      if (!options.length) return;
      let next = cursor;
      for (let i = 0; i < options.length; i++) {
        next = (next + step + options.length) % options.length;
        if (!isDisabled(options[next])) break;
      }
      cursor = next;
      renderMenu();
      scrollToCursor();
    }

    trigger.addEventListener("click", () => {
      Sfx.play("open");
      setOpen(!open);
    });
    trigger.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!open) setOpen(true);
        else move(event.key === "ArrowDown" ? 1 : -1);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (!open) setOpen(true);
        else choose(cursor);
      } else if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
      }
    });
    menu.addEventListener("click", (event) => {
      const btn = event.target.closest(".rh-option");
      if (btn) choose(Number(btn.dataset.index));
    });
    menu.addEventListener("mousemove", (event) => {
      const btn = event.target.closest(".rh-option");
      if (!btn) return;
      const index = Number(btn.dataset.index);
      if (index === cursor || isDisabled(options[index])) return;
      cursor = index;
      Array.prototype.forEach.call(list.querySelectorAll(".rh-option"), (node, i) => {
        node.classList.toggle("is-cursor", i === cursor);
      });
    });

    paintValue();

    const api = {
      close: () => setOpen(false),
      get value() { return current; },
      get open() { return open; },
      setValue(value) {
        current = value;
        paintValue();
        cursor = Math.max(0, indexOf(current));
        if (open) renderMenu();
      },
      setDisabled(fn, fallback) {
        disabledFor = fn;
        if (isDisabled(optionAt(current))) {
          current = fallback;
          paintValue();
          cursor = Math.max(0, indexOf(current));
          if (config.onChange) config.onChange(current);
        }
        renderMenu();
      }
    };
    return api;
  }

  function renderPracticeSetup() {
    closePracticeSelects();

    const festive = new Set(P.CHRISTMAS_CATALOG.map((entry) => E.normalizeAnswer(entry.answer)));
    const words = practiceCatalog().slice()
      .sort((a, b) => String(a.answer).localeCompare(String(b.answer)));
    const wordOptions = [{ value: RANDOM_WORD, label: "RANDOM WORD", glyph: "🎲", tag: "ANY" }]
      .concat(words.map((entry) => {
        const isFestive = festive.has(E.normalizeAnswer(entry.answer));
        return {
          value: entry.answer, label: entry.answer,
          glyph: isFestive ? "✦" : "▣", tag: isFestive ? "FESTIVE" : ""
        };
      }));
    practiceSelects.word = buildPracticeSelect(el.practiceWord, {
      options: wordOptions, value: practiceWord, placeholder: "PICK A WORD",
      onChange: (value) => { practiceWord = value; }
    });

    const twistOptions = [
      { value: "none", label: "NO TWIST", glyph: "◇", tag: "CLEAN" },
      { value: "random", label: "RANDOM TWIST", glyph: "🎲", tag: "SURPRISE" }
    ].concat(E.ARCADE_TWISTS.filter((twist) => twist.id !== "standard").map((twist) => ({
      value: twist.id, label: twist.name, glyph: "✦",
      tag: "×" + twist.payout, timed: !!twist.timed
    })));
    practiceSelects.twist = buildPracticeSelect(el.practiceTwist, {
      options: twistOptions, value: practiceTwist, placeholder: "PICK A TWIST",
      onChange: (value) => { practiceTwist = value; },
      disabledFor: (option) => !!option.timed && !isPracticeTimed()
    });

    practiceSelects.difficulty = buildPracticeSelect(el.practiceDifficulty, {
      options: E.ARCADE_MODES.map((mode) => ({
        value: mode.id, label: mode.name, glyph: mode.timeLimit ? "⏱" : "▣",
        tag: mode.herrings + " WRONG"
      })),
      value: practiceDifficulty, placeholder: "PICK A MODE",
      onChange: (value) => {
        practiceDifficulty = value;
        updatePracticeTwistOptions();
      }
    });

    updatePracticeTwistOptions();
  }

  function isPracticeTimed() {
    const mode = E.ARCADE_MODES.find((entry) => entry.id === practiceDifficulty);
    return !!(mode && mode.timeLimit);
  }

  function updatePracticeTwistOptions() {
    if (!practiceSelects.twist) return;
    practiceSelects.twist.setDisabled(
      (option) => !!option.timed && !isPracticeTimed(),
      "random"
    );
    practiceTwist = practiceSelects.twist.value;
  }

  function startPractice() {
    closePracticeSelects();
    practiceWord = practiceSelects.word ? practiceSelects.word.value : practiceWord;
    practiceTwist = practiceSelects.twist ? practiceSelects.twist.value : practiceTwist;
    practiceDifficulty = practiceSelects.difficulty ? practiceSelects.difficulty.value : practiceDifficulty;
    practiceSettings = { word: practiceWord, twist: practiceTwist, mode: practiceDifficulty };
    Sfx.play("open");
    startArcade(practiceDifficulty,
      practiceWord === RANDOM_WORD ? null : practiceWord, "practice", practiceTwist);
  }

  function showArcadeStep(step) {
    arcadeStep = step || "sections";
    const pickingMode = arcadeStep === "modes";
    const pickingPractice = arcadeStep === "practice";
    const pickingTwists = arcadeStep === "twists";
    const event = arcadeEventInfo();
    el.arcadeSections.hidden = pickingMode || pickingPractice || pickingTwists;
    el.arcadeModes.hidden = !pickingMode;
    el.arcadeTwists.hidden = !pickingTwists;
    el.arcadeModeTitle.hidden = !(pickingMode || pickingTwists);
    el.arcadePractice.hidden = !pickingPractice;
    el.arcadeBack.hidden = !(pickingMode || pickingPractice || pickingTwists);
    el.arcadeNote.textContent = pickingPractice
      ? "PRACTICE RUNS DO NOT PAY FISH OR CHANGE DAILY STATS."
      : pickingTwists
        ? "TIMED HOUSE RULES ONLY WORK WITH FRENZY OR EXTREME."
        : "EVERY MODE PAYS LESS THAN THE DAILY. ARCADE ROUNDS DON'T TOUCH YOUR DAILY STREAK.";
    el.arcadeIntro.textContent = pickingPractice
      ? "PRACTICE · PICK ANY WORD, TWIST AND DIFFICULTY. NO FISH, NO STATS."
      : pickingTwists
        ? "TWISTED · PICK THE HOUSE RULE FIRST, THEN A DIFFICULTY. HARDER RULES PAY MORE FISH."
        : pickingMode
          ? event.name + " · PICK A MODE — " + (!event.twists
            ? "CLEAN ROUNDS, NO HOUSE RULES."
            : arcadeTwistChoice === "random"
              ? "A SURPRISE HOUSE RULE EACH ROUND."
              : "HOUSE RULE: " + (E.ARCADE_TWISTS.find((twist) => twist.id === arcadeTwistChoice) || {}).name + ".")
          : "FINISH TODAY'S DAILY TO OPEN THE ARCADE. DEFAULT AND CHRISTMAS ARE CLEAN, TWISTED LETS YOU PICK THE HOUSE RULE, AND PRACTICE LETS YOU PICK EVERYTHING.";
  }

  function openArcade() {
    if (!arcadeUnlocked()) {
      Sfx.play("bad");
      toast("FINISH TODAY'S DAILY TO UNLOCK THE ARCADE");
      return;
    }
    arcadeEvent = "default";
    arcadeTwistChoice = "random";
    document.body.classList.remove("arcade-christmas", "arcade-practice");
    renderArcadeSections();
    renderArcadeModes();
    renderTwistChoices();
    showArcadeStep("sections");
    openOverlay(el.arcadeOverlay);
    Sfx.play("open");
  }

  function startArcade(modeId, forcedAnswer, eventId, forcedTwistId) {
    const mode = E.ARCADE_MODES.find((m) => m.id === modeId);
    if (!mode || !arcadeUnlocked()) return;
    if (eventId) arcadeEvent = eventId;
    const isPractice = arcadeEvent === "practice";
    if (isPractice && practiceSettings) {
      if (forcedAnswer === undefined || forcedAnswer === null) {
        forcedAnswer = practiceSettings.word === RANDOM_WORD ? null : practiceSettings.word;
      }
      if (!forcedTwistId) forcedTwistId = practiceSettings.twist;
    }
    el.game.classList.remove("timer-hot", "timer-critical");
    el.countdown.classList.remove("urgent");
    currentMode = "arcade";
    arcadeModeId = mode.id;
    const sourceCatalog = arcadeCatalog();
    const wanted = isPractice ? resolveChosenAnswer(forcedAnswer, sourceCatalog) : null;
    roundTwist = rollTwist(mode, forcedTwistId);
    roundCatalog = sourceCatalog;
    puzzle = E.buildArcadePuzzle(roundCatalog, P.PUZZLE_VERSION, mode.id,
      Date.now() + "-" + Math.random().toString(36).slice(2),
      { answer: wanted, avoid: wanted ? [] : recentArcadeAnswers() });
    const event = arcadeEventInfo();
    puzzle.eventName = event && event.id !== "default" ? event.name : null;
    document.body.classList.toggle("arcade-christmas", event.id === "christmas");
    document.body.classList.toggle("arcade-practice", event.id === "practice");
    rememberArcadeAnswer(puzzle.answer);
    // Twists can cut time off the clock, never add it.
    roundDuration = puzzle.timeLimit
      ? Math.max(10, puzzle.timeLimit - (roundTwist.timeCut || 0)) : 0;
    puzzle.timeLimit = roundDuration;
    roundDeadline = roundDuration ? Date.now() + roundDuration * 1000 : 0;
    const hasTwist = roundTwist.id !== "standard";
    el.arcadeStatus.hidden = !hasTwist && !roundDuration;
    el.arcadeStatus.classList.toggle("has-timer", hasTwist && !!roundDuration);
    el.arcadeStatus.classList.toggle("timer-only", !hasTwist && !!roundDuration);
    state = freshState(today, puzzle.cards.length);
    closeOverlay(el.arcadeOverlay);
    closeOverlay(el.resultOverlay);
    closeOverlay(el.settingsOverlay);
    updateDayLabels();
    el.guess.value = "";
    cancelAutoCorrect();
    el.guess.disabled = false;
    el.form.querySelector("button").disabled = false;
    el.giveUp.disabled = false;
    renderDeck();
    updateHUD();
    // Compact in-game chip — the full explanation is also on hover/long-press.
    el.roundTwist.hidden = !hasTwist;
    el.roundTwist.style.setProperty("--twist", roundTwist.accent);
    el.roundTwist.innerHTML = icon(roundTwist.icon, "twist-icon") +
      '<span class="twist-copy" title="' + esc(roundTwist.desc) + '">' +
      '<strong>' + esc(roundTwist.name) + '</strong>' +
      '<span>' + esc(roundTwist.short) + '</span></span>';
    el.timerBar.hidden = !roundDuration;
    el.timerBar.className = "timer-bar";
    el.timerLabel.textContent = roundTwist.id === "rush" ? "RUSH · TIME" : "TIME LEFT";
    el.timerClock.textContent = roundDuration ? `${pad(Math.floor(roundDuration / 60))}:${pad(roundDuration % 60)}` : "0:00";
    el.timerFill.style.transform = "scaleX(1)";
    const roundLabel = (puzzle.eventName ? puzzle.eventName + " · " : "") + mode.name;
    setMessage(roundLabel + " · " + mode.herrings + " WRONG CLUE" + (mode.herrings === 1 ? "" : "S") +
      (puzzle.timeLimit ? " · " + puzzle.timeLimit + "s ON THE CLOCK." : "."), "");
    showScreen("game");
    tick();
    Sfx.play("open");
    // The intro is a occasional "get ready" beat, not a tax on every round.
    // Easier modes skip it more often so replaying stays quick.
    if (Math.random() < (mode.introChance == null ? 1 : mode.introChance)) {
      showRoundIntro(mode, roundTwist);
    }
  }

  function restoreDaily() {
    if (currentMode !== "arcade") return;
    currentMode = "daily";
    arcadeModeId = null;
    clearRoundExtras();
    puzzle = dailyPuzzle;
    roundCatalog = activeCatalog();
    state = dailyState;
    updateDayLabels();
    el.guess.value = "";
    cancelAutoCorrect();
    el.guess.disabled = !!state.result;
    el.form.querySelector("button").disabled = !!state.result;
    el.giveUp.disabled = !!state.result;
    el.playLabel.textContent = state.result ? (devUnlocked ? "PLAY AGAIN" : "VIEW RESULT") : "PLAY TODAY";
    renderDeck();
    updateHUD();
    setMessage("FLIP A CARD TO BEGIN", "");
  }

  function returnToMenu() {
    restoreDaily();
    showScreen("menu");
  }

  function unlockDev() {
    if (devUnlocked) return;
    devUnlocked = true;
    store.set(DEV_KEY, "1");
    if (B.dev && B.dev.start) B.dev.start();
    codeError = "";
    toast("DEV MODE UNLOCKED · TEMPORARY SAVE");
    Sfx.play("good");
    tick();
    updateArcadeButton();
    if (!el.shopOverlay.hidden) renderShop(shopTab);
    if (!el.settingsOverlay.hidden && settingsTab === "codes") renderSettings("codes");
  }

  function hideDev() {
    if (!devUnlocked) return;
    devUnlocked = false;
    store.set(DEV_KEY, "0");
    if (B.dev && B.dev.stop) B.dev.stop();
    currentMode = "daily";
    arcadeModeId = null;
    clearRoundExtras();
    state = loadState(today);
    dailyState = state;
    rebuildPuzzle(true);
    codeError = "";
    toast("DEV TOOLS HIDDEN · SAVE RESTORED");
    tick();
    updateArcadeButton();
    if (!el.shopOverlay.hidden) renderShop(shopTab);
    if (!el.settingsOverlay.hidden && settingsTab === "codes") renderSettings("codes");
  }

  async function applyCode(code, def) {
    if (devIsActive() && !def.dev) {
      codeError = "HIDE DEV TOOLS BEFORE USING REWARD CODES.";
      return false;
    }

    if (def.dev) {
      unlockDev();
      toast(def.message || "CODE ACCEPTED");
      return true;
    }

    const current = normalizeData(B.getData());
    if (def.once && current.redeemed.indexOf(code) >= 0) {
      codeError = "THAT CODE HAS ALREADY BEEN REDEEMED.";
      return false;
    }

    // Claim first, pay second. The claim is atomic, so a worldwide cap cannot
    // be spent twice by two devices tapping REDEEM at the same moment.
    const limit = codeLimit(def);
    let claim = { ok: true, count: 0, remaining: limit == null ? null : limit, source: "local" };
    if (typeof B.claimCode === "function") {
      try {
        claim = await B.claimCode(code, {
          once: def.once === true,
          limit: limit,
          nonce: Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10)
        });
      } catch (err) {
        claim = { ok: false, reason: "cloud-error", message: err && err.message ? err.message : "CODE CHECK FAILED" };
      }
    }

    if (!claim || !claim.ok) {
      if (claim && claim.reason === "limit") codeError = "THIS CODE HAS REACHED ITS GLOBAL USE LIMIT.";
      else if (claim && claim.reason === "cloud-error") codeError = "COULD NOT VERIFY THIS CODE RIGHT NOW. TRY AGAIN.";
      else codeError = "THAT CODE HAS ALREADY BEEN REDEEMED.";
      return false;
    }

    const update = {};
    let granted = 0;
    if (def.fish) {
      granted = codeFish(def.fish);
      update.fish = current.fish + granted;
    }
    if (def.unlockAll) {
      const owned = current.owned.slice();
      shopItems.forEach((item) => { if (owned.indexOf(item.id) < 0) owned.push(item.id); });
      update.owned = owned;
    }
    if (def.once) update.redeemed = current.redeemed.concat(code);
    if (Object.keys(update).length) B.updateData(update);

    codeError = "";
    codeDraft = "";
    let message = typeof def.message === "function" ? def.message(granted) : def.message;
    if (message && claim.remaining > 0 && claim.remaining <= 3) {
      message += " · " + claim.remaining + (claim.remaining === 1 ? " USE LEFT" : " USES LEFT");
    }
    if (message) toast(message);
    if (def.sound) Sfx.play(def.sound);
    return true;
  }

  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("COULD NOT READ THAT IMAGE"));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("COULD NOT LOAD THAT IMAGE"));
        img.onload = () => {
          const size = 64;
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          const side = Math.min(img.width, img.height);
          ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
          resolve(canvas.toDataURL("image/png"));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------------- screens ---------------- */
  function showScreen(name) {
    el.menu.classList.toggle("is-active", name === "menu");
    el.game.classList.toggle("is-active", name === "game");
    el.menu.scrollTop = 0;
    el.game.scrollTop = 0;
    if (name === "menu") startFish();
    else clearFish();
  }

  function openOverlay(node) { node.hidden = false; }
  function closeOverlay(node) { node.hidden = true; }

  function updateHUD() {
    const c = counts();
    const oldScore = el.score.textContent;
    const score = liveScore();
    const scoreText = String(score);
    setText(el.score, scoreText);
    if (scoreText !== oldScore) bump(el.score);
    el.flipped.textContent = `${c.flipped}/${puzzle.cards.length}`;
    el.burned.textContent = String(c.herrings + c.truths);
    el.guesses.textContent = String(state.wrongGuesses);
    el.best.textContent = String(stats.best || 0);
  }

  function syncCard(i, animate, before, burnKind) {
    const node = cardEls[i];
    node.classList.toggle("flipped", state.flipped[i]);
    node.querySelector(".flip-btn").disabled = state.flipped[i] || !!state.result;
    node.querySelector(".burn-btn").disabled = !state.flipped[i] || state.burned[i] || !!state.result ||
      !!(roundTwist && roundTwist.noBurn);
    if (state.burned[i]) {
      if (burnKind) node.classList.add(burnKind === "herring" ? "herring-burn" : "mistake-burn");
      if (animate && !reduced) {
        burnFX(node, burnKind);
        node.classList.add("burning");
        window.setTimeout(() => {
          node.classList.add("gone");
          const fx = node.querySelector(".burn-fx");
          if (fx) fx.remove();
          rearrange(before);
        }, 920);
      } else {
        node.classList.add("gone");
        rearrange(before);
      }
    }
  }

  function fishSVG() {
    return FISH_SVG("red", { palette: SKIN_FISH[accountData.skin] || SKIN_FISH.classic });
  }

  function renderDeck() {
    el.deck.innerHTML = "";
    cardEls.length = 0;
    puzzle.cards.forEach((card, i) => {
      const node = document.createElement("div");
      node.className = "card";
      node.dataset.id = String(i);
      node.style.setProperty("--deal", reduced ? "0ms" : `${i * 70}ms`);
      node.innerHTML =
        '<div class="card-inner">' +
          '<div class="card-face card-back">' +
            '<button class="flip-btn" type="button" aria-label="Flip clue card ' + (i + 1) + '">' +
              fishSVG() + '<span class="card-num">' + pad(i + 1) + '</span>' +
            '</button>' +
          '</div>' +
          '<div class="card-face card-front">' +
            '<span class="card-num">CLUE ' + pad(i + 1) + '</span>' +
            '<span class="clue-text"></span>' +
            '<button class="burn-btn" type="button">🔥 BURN</button>' +
          '</div>' +
        '</div>';
      node.querySelector(".clue-text").textContent = card.text;
      el.deck.appendChild(node);
      cardEls.push(node);
      syncCard(i, false);
    });
    applySkin();
    applyPattern();
  }

  function flipCard(i) {
    if (state.result || state.flipped[i] || state.burned[i]) return;
    state.flipped[i] = true;
    save();
    syncCard(i, false);
    cardEls[i].classList.add("just-flipped");
    window.setTimeout(() => cardEls[i].classList.remove("just-flipped"), 360);
    if (!reduced) {
      cardEls[i].classList.add("flipping");
      window.setTimeout(() => cardEls[i].classList.remove("flipping"), 360);
    }
    // FADE OUT: the clue is only readable for 3 seconds — then you rely on memory.
    if (roundTwist && roundTwist.fade) {
      window.setTimeout(() => {
        if (state.result || !roundTwist || !roundTwist.fade) return;
        if (state.flipped[i] && !state.burned[i] && cardEls[i]) {
          cardEls[i].classList.add("faded");
          Sfx.play("click");
        }
      }, reduced ? 0 : 3000);
    }
    const rect = cardEls[i].getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    burstAt(cx, cy, "#ffe08a", 5);
    floatScore(E.RULES.flip + " PTS", cx, rect.top + 20, true);
    Sfx.play("flip");
    updateHUD();
    const c = counts();
    if (E.isFullReveal(c.flipped, puzzle.cards.length)) {
      toast("FULL REVEAL · FISH PAYOUT −80%");
      setMessage("ALL CARDS REVEALED — FISH PAYOUT IS CUT BY 80%.", "bad");
    } else {
      setMessage(`CLUE ${i + 1} REVEALED — ` +
        (roundTwist && roundTwist.noZoom ? "ZOOM IS LOCKED. " : "TAP IT TO ENLARGE. ") +
        (roundTwist && roundTwist.noBurn ? "NO BURNING THIS ROUND." : "BURN ONLY IF SURE."), "");
    }
  }

  function burnCard(i) {
    if (state.result || !state.flipped[i] || state.burned[i]) return;
    if (roundTwist && roundTwist.noBurn) {
      toast("NO BURN — THIS HOUSE RULE LOCKS THE BURN BUTTONS.");
      Sfx.play("bad");
      return;
    }
    const visible = cardEls.filter((node) => !node.classList.contains("gone") && !node.classList.contains("burning"));
    const before = new Map(visible.map((node) => [node, node.getBoundingClientRect()]));
    state.burned[i] = true;
    save();
    const isHerring = !!puzzle.cards[i].isHerring;
    syncCard(i, true, before, isHerring ? "herring" : "mistake");
    updateHUD();
    const rect = cardEls[i].getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    if (isHerring) {
      burstAt(cx, cy, "#63f5a8", 22);
      feedbackBurst("CLEAN BURN +200", cx, cy - 12, "herring");
      floatScore(signed(E.RULES.burnHerring) + " PTS", cx, rect.top + 20, false);
      setMessage("CLEAN BURN — THAT WAS A RED HERRING.", "good");
      flashScreen("good");
      Sfx.play("herring");
      toast("RED HERRING DOWN · +200 PTS");
    } else {
      feedbackBurst("REAL CLUE −150", cx, cy - 12, "mistake");
      floatScore(signed(E.RULES.burnTrueClue) + " PTS", cx, rect.top + 20, true);
      setMessage("THAT WAS A REAL CLUE. OUCH.", "bad");
      shake();
      Sfx.play("bad");
      toast("−150 · REAL CLUE BURNED");
    }
    // No clues left means there is nothing to guess from — end the round for
    // the player instead of leaving them stuck on an empty board.
    if (state.burned.every(Boolean)) {
      setMessage("ALL CLUES BURNED — NOTHING LEFT TO GUESS FROM. ROUND OVER.", "bad");
      window.setTimeout(() => {
        if (!state.result && state.burned.every(Boolean)) finish(false, "burned");
      }, reduced ? 0 : 950);
    }
  }

  function finish(correct, reason) {
    if (state.result) return;
    cancelAutoCorrect();
    roundDeadline = 0;
    el.countdown.classList.remove("urgent");
    el.game.classList.remove("timer-hot", "timer-critical");
    const c = counts();
    const wrongPenalty = roundTwist && roundTwist.wrongPenalty != null
      ? roundTwist.wrongPenalty : E.RULES.wrongGuess;
    const raw = (correct ? E.RULES.correctAnswer : 0) +
      c.flipped * E.RULES.flip + c.herrings * E.RULES.burnHerring +
      c.truths * E.RULES.burnTrueClue + state.wrongGuesses * wrongPenalty;
    const score = E.scoreRound({
      correct, flippedCount: c.flipped, herringsBurned: c.herrings,
      trueCluesBurned: c.truths, wrongGuesses: state.wrongGuesses,
      wrongPenalty
    });
    const mode = currentMode === "arcade"
      ? E.ARCADE_MODES.find((m) => m.id === arcadeModeId) : null;
    const isPractice = currentMode === "arcade" && arcadeEvent === "practice";
    const twist = mode ? roundTwist : null;
    const fullReveal = E.isFullReveal(c.flipped, puzzle.cards.length);
    const revealMultiplier = E.fishMultiplier(c.flipped, puzzle.cards.length);
    const baseFish = score * (mode ? mode.payout : 0.1) * (twist ? twist.payout : 1);
    const earned = isPractice ? 0 : bonusFish(baseFish * revealMultiplier);

    state.result = {
      day: puzzle.day, answer: puzzle.answer, correct, score, rawScore: raw, fishEarned: earned,
      fullReveal, fishMultiplier: revealMultiplier,
      arcade: !!mode, practice: isPractice,
      modeName: mode ? ((puzzle.eventName ? puzzle.eventName + " · " : "") + mode.name) : null,
      twistName: twist && twist.id !== "standard" ? twist.name : null,
      herringTotal: mode ? mode.herrings : 3,
      timedOut: reason === "time", allBurned: reason === "burned", oneStrike: reason === "strike",
      flippedCount: c.flipped, herringsBurned: c.herrings, trueCluesBurned: c.truths,
      wrongGuesses: state.wrongGuesses, wrongPenalty,
      cells: puzzle.cards.map((card, i) => ({
        flipped: state.flipped[i], burned: state.burned[i], isHerring: card.isHerring
      }))
    };
    save();
    markDailyDone();

    // One data patch means one persistence write and one UI refresh. Chained
    // updateData() calls used to re-sanitize history and re-render twice here.
    const patch = {};
    if (!isPractice) {
      const current = B.getData();
      patch.fish = current.fish + earned;
      patch.fishCaught = current.fishCaught;
    }

    // Arcade rounds never touch daily streak/stats; PRACTICE also pays no fish.
    if (!mode) {
      const entry = {
        date: today,
        mode: "daily",
        answer: puzzle.answer,
        correct,
        score,
        fish: earned,
        flipped: c.flipped,
        herrings: c.herrings,
        truths: c.truths,
        wrong: state.wrongGuesses,
        fullReveal,
        reason: reason || (correct ? "solved" : "missed")
      };
      const history = (stats.history || []).filter((row) => row.date !== today);
      history.push(entry);
      const nextStats = Object.assign({}, stats, {
        played: (stats.played || 0) + 1,
        history: history.slice(-HISTORY_LIMIT)
      });
      if (correct) {
        nextStats.wins = (stats.wins || 0) + 1;
        nextStats.streak = stats.lastWin === yesterdayString() ? (stats.streak || 0) + 1 : 1;
        nextStats.lastWin = today;
      } else {
        nextStats.streak = 0;
      }
      nextStats.best = Math.max(stats.best || 0, score);
      nextStats.totalScore = (stats.totalScore || 0) + score;
      nextStats.lastPlayed = today;
      stats = nextStats;
      patch.stats = nextStats;
      store.set(STATS_KEY, JSON.stringify(nextStats));
      updateMenuStats();
    }

    if (Object.keys(patch).length) B.updateData(patch);
    if (!isPractice && earned > 0) bump(el.fishCount);

    if (correct) flashScreen("good");
    else flashScreen("bad");
    dramaticReveal(correct, puzzle.answer);

    cardEls.forEach((_, i) => syncCard(i, false));
    el.guess.disabled = true;
    el.form.querySelector("button").disabled = true;
    el.giveUp.disabled = true;
    el.playLabel.textContent = devUnlocked ? "PLAY AGAIN" : "VIEW RESULT";
    updateHUD();
    setMessage(correct ? `CORRECT — IT WAS ${puzzle.answer.toUpperCase()}.` : `THE ANSWER WAS ${puzzle.answer.toUpperCase()}.`, correct ? "good" : "bad");
    window.setTimeout(showResult, reduced ? 0 : (correct ? 780 : 560));
  }

  function countUp(node, target) {
    if (reduced) { node.textContent = String(target); return; }
    const steps = 14;
    let i = 0;
    const timer = window.setInterval(() => {
      i++;
      node.textContent = String(Math.round(target * Math.min(1, i / steps)));
      if (i >= steps) window.clearInterval(timer);
    }, 30);
  }

  function showResult() {
    if (!state.result) return;
    const r = state.result;
    el.banner.textContent = r.timedOut ? "TIME'S UP!" : r.oneStrike ? "ONE STRIKE!" :
      r.allBurned ? "ALL BURNED!" : r.correct ? "CORRECT!" : "MISSED!";
    el.banner.classList.toggle("lose", !r.correct);
    if (el.resultPanel) {
      el.resultPanel.classList.remove("reveal-in", "is-win", "is-loss");
      void el.resultPanel.offsetWidth;
      el.resultPanel.classList.add("reveal-in", r.correct ? "is-win" : "is-loss");
    }
    el.resultAnswer.textContent = r.answer;
    countUp(el.resultScore, r.score);
    el.resultFish.textContent = r.practice
      ? "PRACTICE · NO FISH EARNED" + (r.twistName ? " · " + r.twistName : "")
      : "+" + (r.fishEarned || 0) + " FISH EARNED" +
        (r.twistName ? " · " + r.twistName : "") +
        (r.fullReveal ? " · FULL REVEAL: FISH −80%" : "");
    el.fishReward.innerHTML = "";
    fishRewardFX(r.fishEarned);
    Sfx.play(r.correct ? "reveal" : "revealBad");
    if (!r.practice && r.fishEarned > 0) Sfx.play("reward");

    const rows = [];
    if (r.correct) rows.push(["CORRECT ANSWER", E.RULES.correctAnswer]);
    rows.push([`CARDS FLIPPED (${r.flippedCount})`, r.flippedCount * E.RULES.flip]);
    rows.push([`HERRINGS BURNED (${r.herringsBurned})`, r.herringsBurned * E.RULES.burnHerring]);
    rows.push([`REAL CLUES BURNED (${r.trueCluesBurned})`, r.trueCluesBurned * E.RULES.burnTrueClue]);
    if (r.wrongGuesses) rows.push([`WRONG GUESSES (${r.wrongGuesses})`, r.wrongGuesses * (r.wrongPenalty || E.RULES.wrongGuess)]);
    if (r.rawScore < 0) rows.push(["SCORE FLOOR", r.score - r.rawScore]);
    el.breakdown.innerHTML = rows.map(([label, value]) =>
      `<li><span>${label}</span><span class="${value >= 0 ? "plus" : "minus"}">${signed(value)}</span></li>`
    ).join("");

    const icons = { herring: "🔥", mistake: "💥", flipped: "🟨", hidden: "⬛" };
    el.resultCells.innerHTML = r.cells.map((c, i) => {
      const kind = c.burned ? (c.isHerring ? "herring" : "mistake") : (c.flipped ? "flipped" : "hidden");
      return `<span class="cell ${kind}" style="--i:${i}">${icons[kind]}</span>`;
    }).join("");

    const arcade = !!r.arcade;
    const endReason = r.timedOut ? "TIME'S UP" : r.allBurned ? "NO CLUES LEFT" : null;
    el.shareLabel.textContent = "COPY RESULT";
    el.resultReplay.hidden = !arcade;
    el.resultNextLabel.textContent = arcade ? "ARCADE ·" : devUnlocked ? "DEV MODE ·" : "NEXT ROUND IN";
    el.resultCountdown.textContent = endReason || (arcade ? "INSTANT REPLAY" : devUnlocked ? "NO COOLDOWN" : "--:--:--");
    openOverlay(el.resultOverlay);
  }

  function copyResult() {
    if (!state.result) return;
    const text = E.shareText(state.result);
    const done = () => {
      el.shareLabel.textContent = "✓ COPIED!";
      toast("RESULT COPIED TO CLIPBOARD");
      window.setTimeout(() => { el.shareLabel.textContent = "COPY RESULT"; }, 1800);
    };
    const fallback = () => {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try { document.execCommand("copy"); done(); } catch (_) { toast("COPY FAILED — SELECT MANUALLY"); }
      area.remove();
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else {
      fallback();
    }
  }

  function buildRules() {
    const R = E.RULES;
    const rows = [
      ["CORRECT ANSWER", R.correctAnswer],
      ["EACH CARD FLIPPED", R.flip],
      ["EACH HERRING BURNED", R.burnHerring],
      ["EACH REAL CLUE BURNED", R.burnTrueClue],
      ["EACH WRONG GUESS", R.wrongGuess]
    ];
    el.rulesScoring.innerHTML = rows.map(([label, value]) =>
      `<li><span>${label}</span><span class="${value >= 0 ? "plus" : "minus"}">${signed(value)}</span></li>`
    ).join("");
  }

  function openCardZoom(i) {
    if (roundTwist && roundTwist.noZoom) {
      toast("NO PEEK — THIS HOUSE RULE LOCKS CARD ZOOM.");
      Sfx.play("bad");
      return;
    }
    const faded = !!(roundTwist && roundTwist.fade && cardEls[i] && cardEls[i].classList.contains("faded"));
    el.zoomNum.textContent = "CLUE " + pad(i + 1);
    el.zoomText.textContent = faded ? "THIS CLUE HAS FADED. REMEMBER WHAT IT SAID?" : puzzle.cards[i].text;
    el.zoomText.classList.toggle("faded-text", faded);
    openOverlay(el.cardOverlay);
    Sfx.play("open");
  }

  function tick() {
    if (document.hidden) return;
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const diff = Math.max(0, Math.floor((next - now) / 1000));
    const text = `${pad(Math.floor(diff / 3600))}:${pad(Math.floor(diff / 60) % 60)}:${pad(diff % 60)}`;
    const arcade = currentMode === "arcade";

    // Timed arcade modes replace the daily countdown with a big live clock.
    // While the intro popup is up, hold the clock at full — no time is lost.
    if (arcade && roundDeadline) {
      const msLeft = introActive ? roundDuration * 1000 : Math.max(0, roundDeadline - Date.now());
      const left = introActive ? roundDuration : Math.ceil(msLeft / 1000);
      const clock = `${pad(Math.floor(left / 60))}:${pad(left % 60)}`;
      setText(el.gameNextLabel, "TIME LEFT");
      setText(el.countdown, clock);
      el.countdown.classList.toggle("urgent", left <= 10);

      // Fill bar tracks the remaining fraction smoothly between ticks.
      const ratio = roundDuration ? Math.max(0, Math.min(1, msLeft / (roundDuration * 1000))) : 0;
      el.timerFill.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
      setText(el.timerClock, clock);
      el.timerBar.classList.toggle("warn", left <= Math.max(15, roundDuration * 0.4));
      el.timerBar.classList.toggle("danger", left <= 10);
      el.timerBar.classList.toggle("critical", left <= 5);
      el.game.classList.toggle("timer-hot", left <= 10);
      el.game.classList.toggle("timer-critical", left <= 5);
      if (left <= 5) setText(el.timerWarning, "FINAL SECONDS!");
      else if (left <= 10) setText(el.timerWarning, "HURRY UP!");
      else if (left <= Math.max(15, roundDuration * 0.4)) setText(el.timerWarning, "PICK UP THE PACE");
      else setText(el.timerWarning, "THINK FAST");

      // One beep per second in the danger zone, rising in pitch near zero.
      if (!introActive && left !== lastTimerSecond) {
        if (left > 0 && left <= 10) Sfx.play("tick");
        lastTimerSecond = left;
      }

      if (!introActive && left <= 0) {
        roundDeadline = 0;
        el.countdown.classList.remove("urgent");
        el.timerBar.classList.remove("critical");
        el.game.classList.remove("timer-hot", "timer-critical");
        setMessage("TIME'S UP — ROUND OVER.", "bad");
        Sfx.play("bad");
        finish(false, "time");
        return;
      }
    } else {
      el.countdown.classList.remove("urgent");
      setText(el.gameNextLabel, arcade ? "ARCADE ·" : devUnlocked ? "DEV MODE ·" : "NEXT ROUND IN");
      setText(el.countdown, arcade ? "INSTANT REPLAY" : devUnlocked ? "NO COOLDOWN" : text);
    }

    const r = state.result;
    const endReason = r && (r.timedOut ? "TIME'S UP" : r.allBurned ? "NO CLUES LEFT" : r.oneStrike ? "ONE STRIKE" : null);
    setText(el.resultNextLabel, arcade ? "ARCADE ·" : "NEXT ROUND IN");
    setText(el.resultCountdown, endReason || (arcade ? "INSTANT REPLAY" : text));
    if (E.localDateString() !== today) window.location.reload();
  }

  /* ---------------- wiring ---------------- */
  el.play.addEventListener("click", () => {
    Sfx.play("open");
    if (state.result) showResult();
    else showScreen("game");
  });
  el.back.addEventListener("click", () => { Sfx.play("click"); returnToMenu(); });
  el.rules.addEventListener("click", () => { Sfx.play("open"); openOverlay(el.rulesOverlay); });
  el.arcade.addEventListener("click", openArcade);
  el.arcadeSections.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-event]");
    if (!btn) return;
    arcadeEvent = btn.dataset.event;
    if (arcadeEvent === "practice") {
      renderPracticeSetup();
      showArcadeStep("practice");
    } else if (arcadeEvent === "twisted") {
      renderTwistChoices();
      showArcadeStep("twists");
    } else {
      renderArcadeModes();
      showArcadeStep("modes");
    }
    Sfx.play("open");
  });
  el.arcadeBack.addEventListener("click", () => {
    if (arcadeStep === "modes" && arcadeEvent === "twisted") {
      renderTwistChoices();
      showArcadeStep("twists");
    } else {
      showArcadeStep("sections");
    }
    Sfx.play("click");
  });
  el.arcadeTwists.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-twist]");
    if (!btn) return;
    arcadeTwistChoice = btn.dataset.twist;
    renderArcadeModes();
    showArcadeStep("modes");
    Sfx.play("click");
  });
  el.arcadeModes.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-mode]");
    if (!btn || btn.disabled) return;
    Sfx.play("open");
    const forcedTwist = arcadeEvent === "twisted" && arcadeTwistChoice !== "random"
      ? arcadeTwistChoice : null;
    startArcade(btn.dataset.mode, null, arcadeEvent, forcedTwist);
  });
  el.practiceStart.addEventListener("click", startPractice);
  el.settings.addEventListener("click", () => { Sfx.play("open"); renderSettings(settingsTab); openOverlay(el.settingsOverlay); });
  el.shop.addEventListener("click", () => { Sfx.play("open"); renderShop(shopTab); openOverlay(el.shopOverlay); });
  el.account.addEventListener("click", () => openAccount());
  el.stats.addEventListener("click", openStats);
  el.soundGame.addEventListener("click", toggleSound);
  el.resultMenu.addEventListener("click", () => {
    Sfx.play("click");
    closeOverlay(el.resultOverlay);
    returnToMenu();
  });
  el.resultReplay.addEventListener("click", () => {
    Sfx.play("open");
    if (currentMode !== "arcade") return;
    const forcedTwist = arcadeEvent === "twisted" && arcadeTwistChoice !== "random"
      ? arcadeTwistChoice : null;
    startArcade(arcadeModeId, null, arcadeEvent, forcedTwist);
  });
  el.share.addEventListener("click", copyResult);

  el.shopTabs.addEventListener("click", (event) => {
    const btn = event.target.closest(".tab");
    if (!btn) return;
    Sfx.play("click");
    renderShop(btn.dataset.tab);
  });

  el.shopItems.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-action]");
    if (!btn || btn.disabled) return;
    if (btn.dataset.action === "buy") buyItem(btn.dataset.id);
    if (btn.dataset.action === "equip") equipItem(btn.dataset.id);
  });

  el.settingsTabs.addEventListener("click", (event) => {
    const btn = event.target.closest(".tab");
    if (!btn) return;
    Sfx.play("click");
    renderSettings(btn.dataset.tab);
  });

  if (el.devBar) {
    el.devBar.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-dev]");
      if (!btn || !devUnlocked) return;
      const action = btn.dataset.dev;
      if (action === "hide") { hideDev(); return; }
      const current = normalizeData(B.getData());
      if (action === "all") {
        const owned = current.owned.slice();
        shopItems.forEach((item) => { if (owned.indexOf(item.id) < 0) owned.push(item.id); });
        B.updateData({ owned: owned });
        toast("ALL SHOP ITEMS UNLOCKED");
      } else {
        const amount = Math.max(0, Number.parseInt(action, 10) || 0);
        if (!amount) return;
        B.updateData({ fish: current.fish + amount });
        toast("+" + amount.toLocaleString() + " DEV FISH");
      }
      Sfx.play("buy");
      renderShop(shopTab);
    });
  }

  el.settingsContent.addEventListener("input", (event) => {
    if (!event.target || event.target.name !== "code") return;
    codeDraft = String(event.target.value || "");
    if (codeError) {
      codeError = "";
      const node = el.settingsContent.querySelector(".account-error");
      if (node) node.textContent = "";
    }
  });

  el.settingsContent.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-action]");
    if (!btn || btn.disabled) return;
    if (btn.dataset.action === "toggle-sound") { Sfx.play("click"); toggleSound(); return; }
    if (btn.dataset.action === "toggle-perf") {
      perfOverride = !lowPower;
      lowPower = perfOverride;
      try { localStorage.setItem(PERF_KEY, perfOverride ? "on" : "off"); } catch (_) { /* private mode */ }
      applyMotionMode();
      if (lowPower) clearFish();
      else if (el.menu.classList.contains("is-active")) startFish();
      Sfx.play("click");
      renderSettings("basic");
      toast(lowPower ? "LOW POWER MODE ON" : "LOW POWER MODE OFF");
      return;
    }
    if (btn.dataset.action === "redeem-code") {
      if (codeBusy) return;
      const input = el.settingsContent.querySelector('.code-entry input[name="code"]');
      const value = String(input && input.value || "").trim().toUpperCase();
      codeDraft = String(input && input.value || "");
      if (!value) {
        codeError = "TYPE A CODE FIRST.";
        renderSettings("codes");
        return;
      }
      const def = CODES[value];
      if (!def) {
        codeError = "CODE NOT RECOGNIZED. TRY AGAIN.";
        renderSettings("codes");
        return;
      }
      codeBusy = true;
      codeError = "";
      btn.disabled = true;
      btn.textContent = "CHECKING CODE…";
      if (input) input.disabled = true;
      Promise.resolve(applyCode(value, def)).then(
        () => { codeBusy = false; renderSettings("codes"); },
        () => {
          codeBusy = false;
          codeError = "COULD NOT CHECK THIS CODE RIGHT NOW. TRY AGAIN.";
          renderSettings("codes");
        }
      );
      return;
    }
    if (btn.dataset.action === "open-account") {
      closeOverlay(el.settingsOverlay);
      openAccount(currentUser ? "view" : "login");
    }
  });

  el.accountBody.addEventListener("input", (event) => {
    if (!event.target) return;
    if (event.target.name === "name") accountView.draftName = event.target.value;
    if (event.target.name === "code" && codeError) { codeError = ""; const node = el.settingsContent.querySelector(".account-error"); if (node) node.textContent = ""; }
    if (accountView.error && ["name", "email", "password"].indexOf(event.target.name) >= 0) {
      accountView.error = "";
      const node = el.accountBody.querySelector(".account-error");
      if (node) node.textContent = "";
    }
  });

  el.accountBody.addEventListener("change", (event) => {
    if (!event.target || event.target.id !== "avatar-upload" || !event.target.files || !event.target.files[0]) return;
    resizeImage(event.target.files[0])
      .then((dataUrl) => {
        accountView.selectedAvatar = dataUrl;
        renderAccountEdit(currentUser);
      })
      .catch((err) => showAccountError(err.message));
  });

  el.accountBody.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === "switch") {
      accountView.form = btn.dataset.mode;
      accountView.error = "";
      renderAccount();
      return;
    }
    if (action === "preset") {
      accountView.selectedAvatar = "preset:" + btn.dataset.preset;
      renderAccountEdit(currentUser);
      return;
    }
    if (action === "edit-profile") {
      accountView.form = "edit";
      accountView.error = "";
      accountView.selectedAvatar = currentUser.photo || "preset:fish";
      accountView.draftName = currentUser.name || "";
      renderAccountEdit(currentUser);
      return;
    }
    if (action === "cancel-edit") {
      accountView.form = "view";
      accountView.error = "";
      renderAccountView(currentUser);
      return;
    }
    if (action === "sync") {
      if (!B.refreshCloud) return;
      B.refreshCloud()
        .then(() => { toast("SAVED PROGRESS PULLED FROM CLOUD"); })
        .catch((err) => showAccountError(err.message));
      return;
    }
    if (action === "google") {
      B.auth.signInWithGoogle()
        .then(async () => {
          // Same as email sign-in: pull the account's save before showing the
          // profile so fish/streak come from the cloud, not this device.
          if (B.refreshCloud) {
            try { await B.refreshCloud(); }
            catch (err) { console.warn("Red Herring: sync after Google sign-in failed", err); }
          }
          accountView.form = "view";
          accountView.error = "";
          renderAccount();
          toast("SIGNED IN WITH GOOGLE");
        })
        .catch((err) => showAccountError(err.message));
      return;
    }
    if (action === "sign-out") {
      B.auth.signOut()
        .then(() => { accountView.form = "login"; accountView.error = ""; toast("SIGNED OUT"); })
        .catch((err) => showAccountError(err.message));
    }
  });

  el.accountBody.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.target;
    const submit = form.querySelector('button[type="submit"]');
    const action = submit ? submit.dataset.action : "";

    if (form.dataset.form === "auth") {
      const email = form.elements.email.value.trim();
      const password = form.elements.password.value;
      const name = form.elements.name ? form.elements.name.value.trim() : "";
      // Custom validation so errors are always visible (native validation can
      // silently block submit when the email field is not formatted correctly).
      if (action === "signup" && !name) { showAccountError("ENTER A DISPLAY NAME."); return; }
      if (!email) { showAccountError("ENTER YOUR EMAIL ADDRESS."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showAccountError("THAT EMAIL DOESN'T LOOK RIGHT — TRY NAME@EXAMPLE.COM."); return; }
      if (!password) { showAccountError("ENTER YOUR PASSWORD."); return; }
      if (action === "signup" && password.length < 4) { showAccountError("PASSWORD MUST BE AT LEAST 4 CHARACTERS."); return; }
      const task = action === "signup" ? B.auth.signUp(email, password, name) : B.auth.signIn(email, password);
      task.then(async () => {
        // Pull the cloud save before showing the profile so the streak/fish
        // displayed are the ones stored on the account, not this device's guest data.
        if (B.refreshCloud) {
          try { await B.refreshCloud(); }
          catch (err) { console.warn("Red Herring: sync after sign-in failed", err); }
        }
        accountView.form = "view";
        accountView.error = "";
        renderAccount();
        toast(action === "signup" ? "ACCOUNT CREATED" : "WELCOME BACK");
      }).catch((err) => showAccountError(err.message));
      return;
    }

    if (form.dataset.form === "edit") {
      const name = form.elements.name.value.trim();
      if (!name) { showAccountError("NAME IS REQUIRED"); return; }
      B.auth.updateProfile({ name, photo: accountView.selectedAvatar })
        .then(() => {
          accountView.form = "view";
          accountView.error = "";
          renderAccountView(B.auth.currentUser());
          toast("PROFILE UPDATED");
        })
        .catch((err) => showAccountError(err.message));
    }
  });

  el.deck.addEventListener("click", (event) => {
    const card = event.target.closest(".card");
    if (!card) return;
    const i = Number(card.dataset.id);
    if (event.target.closest(".burn-btn")) burnCard(i);
    else if (event.target.closest(".flip-btn")) flipCard(i);
    else if (card.classList.contains("flipped") && !card.classList.contains("burning")) openCardZoom(i);
  });

  // Subtle Balatro-style pointer tilt on unflipped cards (desktop only).
  el.deck.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" || reduced) return;
    const card = event.target.closest(".card");
    if (!card || card.classList.contains("flipped") || card.classList.contains("burning")) return;
    const r = card._hoverRect || (card._hoverRect = card.getBoundingClientRect());
    card.style.setProperty("--rx", `${(-(event.clientY - r.top) / r.height + 0.5) * 9}deg`);
    card.style.setProperty("--ry", `${((event.clientX - r.left) / r.width - 0.5) * 9}deg`);
  });
  el.deck.addEventListener("pointerout", (event) => {
    const card = event.target.closest(".card");
    if (!card) return;
    if (!card.contains(event.relatedTarget)) card._hoverRect = null;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  });

  el.guess.addEventListener("input", scheduleAutoCorrect);
  el.guess.addEventListener("blur", applyAutoCorrect);

  el.form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.result) return;
    applyAutoCorrect();
    const raw = el.guess.value.trim();
    if (!raw) { setMessage("TYPE AN ANSWER FIRST.", "bad"); return; }
    if (stripArticles(raw) === stripArticles(puzzle.answer)) {
      finish(true);
    } else {
      const close = E.findCloseAnswer(raw, roundCatalog);
      if (close && !close.auto) {
        setMessage(close.hint, "hint");
        toast(close.hint);
        Sfx.play("click");
        el.guess.select();
        return;
      }
      state.wrongGuesses++;
      save();
      updateHUD();
      el.guess.select();
      const wrongPenalty = roundTwist && roundTwist.wrongPenalty != null
        ? roundTwist.wrongPenalty : E.RULES.wrongGuess;
      const rect = el.guess.getBoundingClientRect();
      floatScore(signed(wrongPenalty) + " PTS", rect.left + rect.width / 2, rect.top, true);
      shake();
      flashScreen("bad");
      Sfx.play("wrong");
      if (currentMode === "arcade" && roundTwist && roundTwist.sudden) {
        setMessage("ONE STRIKE — THAT GUESS ENDED THE ROUND.", "bad");
        window.setTimeout(() => finish(false, "strike"), reduced ? 0 : 350);
      } else {
        setMessage("NOT QUITE. WRONG GUESSES COST " + Math.abs(wrongPenalty) + " POINTS.", "bad");
      }
    }
  });

  el.giveUp.addEventListener("click", () => {
    if (state.result) return;
    const label = currentMode === "arcade" ? "ARCADE" : "DAILY";
    if (window.confirm(`GIVE UP? THE ANSWER IS "${puzzle.answer}". THIS ENDS YOUR ${label} ROUND.`)) finish(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const openSelect = Object.keys(practiceSelects)
        .map((key) => practiceSelects[key])
        .find((select) => select && select.open);
      if (openSelect) { openSelect.close(); return; }
      if (!el.introOverlay.hidden) { dismissRoundIntro(); return; }
      [el.resultOverlay, el.cardOverlay, el.rulesOverlay, el.shopOverlay,
        el.arcadeOverlay, el.settingsOverlay, el.accountOverlay, el.statsOverlay].forEach(closeOverlay);
    }
  });

  el.introSkip.addEventListener("click", dismissRoundIntro);

  // Overlays only close from their X (or Escape) — clicking the backdrop does nothing.
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".rh-select")) closePracticeSelects();
    const btn = event.target.closest("[data-close]");
    if (!btn) return;
    Sfx.play("click");
    const which = btn.dataset.close;
    if (which === "intro") {
      dismissRoundIntro();
      return;
    }
    if (which === "result") {
      closeOverlay(el.resultOverlay);
      if (el.fishReward) el.fishReward.innerHTML = "";
      if (el.answerSlam) el.answerSlam.classList.remove("show");
      returnToMenu();
      return;
    }
    const overlays = {
      card: el.cardOverlay, rules: el.rulesOverlay, shop: el.shopOverlay,
      arcade: el.arcadeOverlay, settings: el.settingsOverlay,
      account: el.accountOverlay, stats: el.statsOverlay
    };
    if (overlays[which]) closeOverlay(overlays[which]);
  });

  // Swap the fallback text glyph for a chunky pixel X on every overlay.
  document.querySelectorAll(".panel-x .x-glyph").forEach((node) => { node.innerHTML = X_GLYPH; });

  /* ---------------- boot ---------------- */
  applyMotionMode();
  updateDayLabels();
  if (state.result) el.playLabel.textContent = devUnlocked ? "PLAY AGAIN" : "VIEW RESULT";
  buildRules();
  buildMenuParticles();
  startFish();
  renderDeck();
  applyData(accountData);
  updateHUD();
  tick();
  updateArcadeButton();
  window.setInterval(tick, 1000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });

  B.onAuth((user) => {
    currentUser = user;
    updateAccountUI();
    if (!el.accountOverlay.hidden) renderAccount();
    if (!el.settingsOverlay.hidden && settingsTab === "account") renderSettings(settingsTab);
  });

  B.onData((data) => { applyData(data); });

  if (B.onSync) {
    B.onSync(() => {
      updateAccountUI();
      if (!el.accountOverlay.hidden && accountView.form === "view" && currentUser) {
        renderAccountView(currentUser);
      }
    });
  }

  if (B.ready && typeof B.ready.then === "function") {
    B.ready.then(() => {
      migrateLegacy();
      if (devUnlocked && B.dev && B.dev.start) B.dev.start();
      applyData(B.getData());
      startFish();
    });
  } else {
    migrateLegacy();
    if (devUnlocked && B.dev && B.dev.start) B.dev.start();
    startFish();
  }
})();
