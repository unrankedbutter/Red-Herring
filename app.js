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
  // PRIVATE DEV UNLOCK — change this to your own secret phrase.
  // Type it anywhere in the game to reveal the free-fish bar in the shop.
  const DEV_CODE = "RHDEV2026";
  // Public reward code — can be claimed once per profile, and it really saves.
  const RELEASE_CODE = "RELEASE";
  const RELEASE_FISH = 125;
  const TOTAL_CARDS = 8;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Backend fallback keeps the game playable if backend.js fails to load.
  const B = window.RedHerringBackend || (function () {
    const DATA_KEY = "red-herring:v1:data:guest";
    const listeners = { auth: [], data: [] };
    let data = { fish: 0, fishCaught: 0, owned: ["classic", "midnight"], skin: "classic", theme: "midnight", stats: {}, sound: "on" };
    try { data = Object.assign(data, JSON.parse(localStorage.getItem(DATA_KEY) || "{}")); } catch (_) { /* private mode */ }
    const emit = (kind, value) => listeners[kind].slice().forEach((cb) => { try { cb(value); } catch (_) { /* ignore */ } });
    const fail = (msg) => Promise.reject(new Error(msg));
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
      }
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
    rules: $("btn-rules"), settings: $("btn-settings"),
    shop: $("btn-shop"), account: $("btn-account"),
    back: $("btn-back"), soundGame: $("btn-sound-game"),
    score: $("score"), flipped: $("flipped-count"), burned: $("burned-count"),
    guesses: $("guess-count"), best: $("best"), message: $("message"),
    messageBar: document.querySelector(".message-bar"),
    deck: $("deck"), form: $("guess-form"), guess: $("guess"),
    hint: $("answer-hint"), giveUp: $("give-up"),
    countdown: $("countdown"), toast: $("toast"),
    fishLayer: $("fish-layer"), fishCount: $("fish-count"),
    menuStreak: $("menu-streak"), menuPlayed: $("menu-played"),
    menuRate: $("menu-rate"), menuBest: $("menu-best"),
    shopBadge: $("shop-fish-badge"), accountAvatar: $("account-avatar"),
    accountMode: $("account-mode"),
    resultOverlay: $("overlay-result"), banner: $("result-banner"),
    resultAnswer: $("result-answer"), resultScore: $("result-score"),
    resultFish: $("result-fish"), breakdown: $("result-breakdown"),
    resultCells: $("result-cells"), resultCountdown: $("result-countdown"),
    share: $("share"), shareLabel: $("share-label"), resultMenu: $("result-menu"),
    rulesOverlay: $("overlay-rules"), rulesClose: $("rules-close"),
    rulesScoring: $("rules-scoring"),
    cardOverlay: $("overlay-card"), zoomNum: $("zoom-num"),
    zoomText: $("zoom-text"), zoomClose: $("zoom-close"),
    shopOverlay: $("overlay-shop"), shopClose: $("shop-close"),
    shopFish: $("shop-fish"), shopTabs: $("shop-tabs"), shopItems: $("shop-items"),
    settingsOverlay: $("overlay-settings"), settingsClose: $("settings-close"),
    settingsTabs: $("settings-tabs"), settingsContent: $("settings-content"),
    accountOverlay: $("overlay-account"), accountClose: $("account-close"),
    accountBody: $("account-body"), devBar: $("dev-bar")
  };

  const shopItems = SHOP.items || [];
  const presetAvatars = SHOP.presets || [];
  const themeIds = shopItems.filter((item) => item.type === "theme").map((item) => item.id);
  const pad = (n) => String(n).padStart(2, "0");
  const signed = (n) => (n > 0 ? "+" : "") + n;
  const esc = (value) => String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const FISH_TYPES = {
    red: { value: 1, color: "#ff5c4d", glow: "#ff8a7d", lines: ["PLINK! +1 FISH.", "A LITTLE RED WRIGGLER.", "TOO SLOW, HERRING!"] },
    blue: { value: 10, color: "#35f0ff", glow: "#8df7ff", lines: ["BLUE BONANZA! +10 FISH.", "TEN FISH! NICE CATCH.", "THE GOOD ONE GOT AWAY..."] },
    gold: { value: 3, color: "#ffd166", glow: "#fff0a8", lines: ["RARE GOLDEN HERRING! +3 FISH.", "GOLD CATCH! +3 FISH.", "SHINY! +3 FISH."] },
    rainbow: { value: 25, color: "#ff7ae0", glow: "#ffffff", lines: ["RAINBOW HERRING! +25 FISH!", "IMPOSSIBLE CATCH! +25 FISH.", "THE LEGEND IS REAL! +25 FISH."] }
  };

  // Card-back fish use the exact swatch colors from their card skin.
  const SKIN_FISH = {
    classic: { body: "#ff5c4d", shadow: "#7b0e3d", accent: "#ffd166" },
    neon:    { body: "#35f0ff", shadow: "#ff3df2", accent: "#e7ffff" },
    ember:   { body: "#ff6b1a", shadow: "#7b0e3d", accent: "#ffd166" },
    ocean:   { body: "#35f0ff", shadow: "#0b5f8a", accent: "#e7ffff" },
    royal:   { body: "#7b4dff", shadow: "#2b0b5a", accent: "#ffd166" },
    matrix:  { body: "#39ff6a", shadow: "#04140b", accent: "#b9ffcf" }
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
    tone(freq, dur, type, delay, vol) {
      if (!soundOn) return;
      try {
        const ctx = this.boot();
        if (!ctx) return;
        const start = ctx.currentTime + (delay || 0);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type || "square";
        osc.frequency.setValueAtTime(freq, start);
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
        case "flip": this.tone(420, 0.05, "square"); this.tone(680, 0.06, "square", 0.05); break;
        case "good": [523, 659, 784].forEach((f, i) => this.tone(f, 0.12, "square", i * 0.07)); break;
        case "bad": this.tone(180, 0.14, "sawtooth"); this.tone(110, 0.2, "sawtooth", 0.1); break;
        case "wrong": this.tone(150, 0.18, "square"); break;
        case "win": [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.16, "square", i * 0.09)); break;
        case "open": this.tone(330, 0.07, "square"); this.tone(440, 0.09, "square", 0.06); break;
        case "catch": [784, 988, 1319].forEach((f, i) => this.tone(f, 0.08, "square", i * 0.05, 0.04)); break;
        case "coin": [880, 1175].forEach((f, i) => this.tone(f, 0.07, "square", i * 0.04, 0.035)); break;
        case "buy": [392, 523, 659].forEach((f, i) => this.tone(f, 0.1, "square", i * 0.06)); break;
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
    return { played: 0, wins: 0, streak: 0, best: 0, totalScore: 0, lastPlayed: null, lastWin: null };
  }

  function defaultData() {
    return {
      fish: 0, fishCaught: 0,
      owned: ["classic", "midnight"], skin: "classic", theme: "midnight",
      stats: defaultStats(), redeemed: [], sound: "on"
    };
  }

  function normalizeData(raw) {
    const base = defaultData();
    if (!raw || typeof raw !== "object") return base;
    Object.keys(base).forEach((key) => {
      if (key === "stats" || key === "owned") return;
      if (raw[key] !== undefined && raw[key] !== null) base[key] = raw[key];
    });
    if (Array.isArray(raw.owned) && raw.owned.length) base.owned = raw.owned.slice();
    base.stats = Object.assign(defaultStats(), raw.stats && typeof raw.stats === "object" ? raw.stats : {});
    base.redeemed = Array.isArray(raw.redeemed) ? raw.redeemed.filter((v) => typeof v === "string") : [];
    base.fish = Math.max(0, Number.parseInt(base.fish, 10) || 0);
    base.fishCaught = Math.max(0, Number.parseInt(base.fishCaught, 10) || 0);
    if (shopItems.length && !shopItems.some((item) => item.id === base.skin)) base.skin = "classic";
    if (themeIds.length && themeIds.indexOf(base.theme) < 0) base.theme = "midnight";
    if (base.owned.indexOf("classic") < 0) base.owned.push("classic");
    if (base.owned.indexOf("midnight") < 0) base.owned.push("midnight");
    return base;
  }

  function freshState(date) {
    return {
      date,
      flipped: Array(TOTAL_CARDS).fill(false),
      burned: Array(TOTAL_CARDS).fill(false),
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

  function activeCatalog() {
    return devUnlocked && devPuzzles.length ? P.CATALOG.concat(devPuzzles) : P.CATALOG;
  }

  function rebuildPuzzle() {
    if (state.result) return false;
    puzzle = E.buildDailyPuzzle(activeCatalog(), P.PUZZLE_VERSION, today);
    el.menuDay.textContent = "#" + puzzle.day;
    el.gameDay.textContent = "#" + puzzle.day;
    el.hint.textContent = "HINT: " + puzzle.answerHint.toUpperCase();
    renderDeck();
    updateHUD();
    return true;
  }

  function save() { if (!devIsActive()) store.set(DAY_KEY, JSON.stringify(state)); }

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

  const catalogErrors = E.validateCatalog(P.CATALOG);
  if (catalogErrors.length) console.warn("Red Herring catalog issues:", catalogErrors);

  let today = E.localDateString();
  let puzzle = E.buildDailyPuzzle(P.CATALOG, P.PUZZLE_VERSION, today);
  let state = loadState(today);
  let accountData = normalizeData(B.getData && B.getData());
  let stats = accountData.stats;
  let currentUser = null;
  let shopTab = "skin";
  let settingsTab = "basic";
  const accountView = { form: "view", error: "", selectedAvatar: null, draftName: "" };
  const cardEls = [];
  let devUnlocked = store.get(DEV_KEY) === "1";
  let devBuffer = "";
  let releaseBuffer = "";
  let codeError = "";
  let lastFishSkin = null;
  // Dev words live only in memory. Hiding dev tools or reloading discards them.
  let devPuzzles = [];

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
      wrongGuesses: state.wrongGuesses
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
    for (let i = 0; i < (count || 12); i++) {
      const p = document.createElement("span");
      p.className = "burst";
      p.style.left = x + "px";
      p.style.top = y + "px";
      const angle = (Math.PI * 2 * i) / (count || 12);
      const dist = 40 + Math.random() * 70;
      p.style.setProperty("--bx", `${Math.cos(angle) * dist}px`);
      p.style.setProperty("--by", `${Math.sin(angle) * dist}px`);
      p.style.setProperty("--c", colors[i % colors.length]);
      document.body.appendChild(p);
      window.setTimeout(() => p.remove(), 650);
    }
  }

  function burnFX(cardNode) {
    if (reduced) return;
    const fx = document.createElement("div");
    fx.className = "burn-fx";
    fx.setAttribute("aria-hidden", "true");
    fx.innerHTML =
      '<div class="burn-wave">' +
        '<span class="flame f1"></span><span class="flame f2"></span>' +
        '<span class="flame f3"></span><span class="flame f4"></span>' +
      '</div>' +
      '<span class="smoke"></span><span class="smoke s2"></span><span class="smoke s3"></span>';
    for (let i = 0; i < 9; i++) {
      const ash = document.createElement("span");
      ash.className = "ash";
      ash.style.setProperty("--x", `${15 + Math.random() * 70}%`);
      ash.style.setProperty("--dx", `${-40 + Math.random() * 80}px`);
      ash.style.setProperty("--d", `${Math.random() * 0.3}s`);
      fx.appendChild(ash);
    }
    cardNode.appendChild(fx);
  }

  function rearrange(before) {
    if (!before || reduced) return;
    window.requestAnimationFrame(() => {
      before.forEach((rect, node) => {
        if (node.classList.contains("gone")) return;
        const now = node.getBoundingClientRect();
        const dx = rect.left - now.left;
        const dy = rect.top - now.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
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
    window.setTimeout(() => {
      fish.remove();
      spawnFish();
    }, delay === undefined ? 150 + Math.random() * 900 : delay);
  }

  function spawnFish() {
    if (!el.fishLayer) return;
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

    fish._timer = window.setTimeout(() => retireFish(fish), (swim + delay + 0.4) * 1000);
    fish.addEventListener("animationend", (event) => {
      if (reduced || fish.dataset.caught === "1" || event.animationName === "fishCatch") return;
      retireFish(fish);
    });
    fish.addEventListener("click", () => catchFish(fish));
  }

  function startFish() {
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

    burstAt(cx, cy, info.color, 14);
    valuePop("+" + info.value + " FISH", cx, cy, info.color);

    const milestones = {
      1: "FIRST CATCH! THE HERRING ESCAPES... FOR NOW.",
      5: "5 CATCHES! YOU'RE A NATURAL ANGLER.",
      10: "10 CATCHES! THE RIVER IS WORRIED.",
      25: "25 CATCHES! LEGENDARY HERRING HUNTER."
    };
    toast(milestones[current.fishCaught + 1] || info.lines[current.fishCaught % info.lines.length]);
    Sfx.play(type === "gold" || type === "rainbow" ? "coin" : "catch");
  }

  /* ---------------- appearance ---------------- */
  function applyTheme(id) {
    themeIds.forEach((name) => document.body.classList.remove("theme-" + name));
    if (id && id !== "midnight" && themeIds.indexOf(id) >= 0) document.body.classList.add("theme-" + id);
  }

  function applySkin() {
    const skin = accountData.skin || "classic";
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

  function applyData(data) {
    accountData = normalizeData(data);
    stats = accountData.stats;
    soundOn = accountData.sound !== "off";
    applyTheme(accountData.theme);
    applySkin();
    updateMenuStats();
    syncFishCount();
    syncSound();
    updateHUD();
    updateAccountUI();
    if (!el.shopOverlay.hidden) renderShop(shopTab);
    if (!el.settingsOverlay.hidden) renderSettings(settingsTab);
    if (!el.accountOverlay.hidden) renderAccount();
  }

  function updateMenuStats() {
    el.menuStreak.textContent = String(stats.streak || 0);
    el.menuPlayed.textContent = String(stats.played || 0);
    el.menuRate.textContent = (stats.played ? Math.round((stats.wins / stats.played) * 100) : 0) + "%";
    el.menuBest.textContent = String(stats.best || 0);
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
      el.accountMode.textContent = (B.mode === "cloud" ? "CLOUD" : "LOCAL") + " · " + who;
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
    const equipped = (item.type === "skin" ? accountData.skin : accountData.theme) === item.id;
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

    const swatch = (item.swatch || []).map((c) => '<i style="--c:' + esc(c) + '"></i>').join("");
    return '<div class="item-card' + extra + '">' +
      '<div class="item-preview">' + swatch + (item.icon || "") + '</div>' +
      '<div class="item-name">' + esc(item.name) + '</div>' +
      '<div class="item-desc">' + esc(item.desc) + '</div>' +
      '<button class="item-buy' + (equipped ? " equipped" : owned ? " owned" : "") + '" type="button" ' +
        'data-action="' + action + '" data-id="' + esc(item.id) + '"' + disabled + '>' + label + '</button>' +
      '</div>';
  }

  function renderShop(tab) {
    shopTab = tab || shopTab;
    Array.prototype.forEach.call(el.shopTabs.querySelectorAll(".tab"), (btn) => {
      btn.classList.toggle("active", btn.dataset.tab === shopTab);
    });
    const items = shopItems.filter((item) => item.type === shopTab).sort((a, b) => a.price - b.price);
    el.shopItems.innerHTML = items.length
      ? items.map((item) => itemCard(item)).join("")
      : '<p class="account-note">NOTHING HERE YET.</p>';
    if (el.devBar) el.devBar.hidden = !devUnlocked;
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
    B.updateData(item.type === "skin" ? { skin: id } : { theme: id });
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
      const claimed = normalizeData(B.getData()).redeemed.indexOf(RELEASE_CODE) >= 0;
      const wordList = devPuzzles.length
        ? '<div class="dev-word-list">' + devPuzzles.map((entry, index) =>
            '<div class="dev-word-row"><span>' + esc(entry.answer) + '</span>' +
            '<button class="dev-btn" type="button" data-action="dev-word-remove" data-index="' + index + '">✕</button></div>'
          ).join('') + '</div>' +
          '<button class="px-btn" type="button" data-action="dev-words-clear" style="width:100%;margin-top:6px">CLEAR ALL WORDS</button>'
        : "";
      el.settingsContent.innerHTML =
        '<p class="account-note">ENTER A SECRET CODE TO REVEAL DEV TOOLS OR CLAIM A REWARD.</p>' +
        '<form data-form="code">' +
          '<label class="form-field"><span>CODE</span><input name="code" type="text" maxlength="32" placeholder="TYPE CODE HERE" autocomplete="off" spellcheck="false"></label>' +
          '<button class="px-btn primary" type="submit" style="width:100%">REDEEM CODE</button>' +
        '</form>' +
        '<div class="settings-row"><span>RELEASE BONUS</span><strong>' + (claimed ? "CLAIMED ✓" : "+" + RELEASE_FISH + " FISH") + '</strong></div>' +
        (devUnlocked
          ? '<div class="dev-editor">' +
              '<p class="account-note">DEV WORD EDITOR — ADD A TEMPORARY ANSWER AND ITS CLUES.</p>' +
              '<form data-form="dev-word">' +
                '<label class="form-field"><span>ANSWER (1–2 WORDS)</span><input name="answer" type="text" maxlength="40" placeholder="YOUR WORD" autocomplete="off" spellcheck="false"></label>' +
                '<label class="form-field"><span>TRUE CLUES — 5 OR MORE, ONE PER LINE</span><textarea name="truths" rows="4" placeholder="ONE TRUE CLUE PER LINE"></textarea></label>' +
                '<label class="form-field"><span>HERRING CLUES — 3 OR MORE, ONE PER LINE</span><textarea name="herrings" rows="3" placeholder="FAKE CLUES, ONE PER LINE"></textarea></label>' +
                '<button class="px-btn primary" type="submit" style="width:100%">ADD WORD</button>' +
              '</form>' + wordList +
              '<button class="px-btn" type="button" data-action="dev-hide" style="width:100%;margin-top:8px">HIDE DEV TOOLS</button>' +
            '</div>'
          : "") +
        '<p class="account-error" role="alert">' + esc(codeError) + '</p>' +
        '<p class="account-note">RELEASE IS A ONE-TIME REWARD THAT SAVES. DEV FISH, UNLOCKS AND WORDS ARE TEMPORARY — THEY VANISH WHEN YOU HIDE DEV TOOLS OR RELOAD.</p>';
      return;
    }

    el.settingsContent.innerHTML =
      '<p class="account-note">BASIC OPTIONS — CARD SKINS AND THEMES ARE BOUGHT AND EQUIPPED IN THE SHOP.</p>' +
      '<div class="settings-row"><span>SOUND</span><strong>' + (soundOn ? "ON" : "OFF") + '</strong></div>' +
      '<button class="px-btn" type="button" data-action="toggle-sound" style="width:100%;margin-top:4px">' +
        (soundOn ? "TURN SOUND OFF" : "TURN SOUND ON") +
      '</button>' +
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
        ? "CLOUD MODE — YOUR PROFILE AND PROGRESS SYNC ACROSS DEVICES."
        : "LOCAL MODE — ACCOUNTS AND PROGRESS ARE SAVED IN THIS BROWSER ONLY. LOG IN FROM THE SAME BROWSER TO SEE THEM. ADD FIREBASE CONFIG FOR GOOGLE SIGN-IN AND CLOUD SAVE.") +
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

  function unlockDev() {
    if (devUnlocked) return;
    devUnlocked = true;
    store.set(DEV_KEY, "1");
    if (B.dev && B.dev.start) B.dev.start();
    codeError = "";
    toast("DEV MODE UNLOCKED · TEMPORARY SAVE");
    Sfx.play("good");
    if (!el.shopOverlay.hidden) renderShop(shopTab);
    if (!el.settingsOverlay.hidden && settingsTab === "codes") renderSettings("codes");
  }

  function hideDev() {
    if (!devUnlocked) return;
    devUnlocked = false;
    store.set(DEV_KEY, "0");
    if (B.dev && B.dev.stop) B.dev.stop();
    devPuzzles = [];
    rebuildPuzzle();
    codeError = "";
    toast("DEV TOOLS HIDDEN · SAVE RESTORED");
    if (!el.shopOverlay.hidden) renderShop(shopTab);
    if (!el.settingsOverlay.hidden && settingsTab === "codes") renderSettings("codes");
  }

  function redeemRelease() {
    if (devIsActive()) {
      codeError = "HIDE DEV TOOLS BEFORE REDEEMING REAL REWARDS.";
      return false;
    }
    const current = normalizeData(B.getData());
    if (current.redeemed.indexOf(RELEASE_CODE) >= 0) {
      codeError = "THAT CODE HAS ALREADY BEEN REDEEMED.";
      return false;
    }
    B.updateData({
      fish: current.fish + RELEASE_FISH,
      redeemed: current.redeemed.concat(RELEASE_CODE)
    });
    codeError = "";
    toast("+" + RELEASE_FISH + " FISH · RELEASE CODE REDEEMED!");
    Sfx.play("coin");
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
  }

  function openOverlay(node) { node.hidden = false; }
  function closeOverlay(node) { node.hidden = true; }

  function updateHUD() {
    const c = counts();
    const oldScore = el.score.textContent;
    el.score.textContent = String(liveScore());
    if (String(liveScore()) !== oldScore) bump(el.score);
    el.flipped.textContent = `${c.flipped}/${TOTAL_CARDS}`;
    el.burned.textContent = String(c.herrings + c.truths);
    el.guesses.textContent = String(state.wrongGuesses);
    el.best.textContent = String(stats.best || 0);
  }

  function syncCard(i, animate, before) {
    const node = cardEls[i];
    node.classList.toggle("flipped", state.flipped[i]);
    node.querySelector(".flip-btn").disabled = state.flipped[i] || !!state.result;
    node.querySelector(".burn-btn").disabled = !state.flipped[i] || state.burned[i] || !!state.result;
    if (state.burned[i]) {
      if (animate && !reduced) {
        burnFX(node);
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
  }

  function flipCard(i) {
    if (state.result || state.flipped[i] || state.burned[i]) return;
    state.flipped[i] = true;
    save();
    syncCard(i, false);
    cardEls[i].classList.add("just-flipped");
    window.setTimeout(() => cardEls[i].classList.remove("just-flipped"), 250);
    const rect = cardEls[i].getBoundingClientRect();
    floatScore(E.RULES.flip + " PTS", rect.left + rect.width / 2, rect.top + 20, true);
    Sfx.play("flip");
    updateHUD();
    setMessage(`CLUE ${i + 1} REVEALED — TAP IT TO ENLARGE. BURN ONLY IF SURE.`, "");
  }

  function burnCard(i) {
    if (state.result || !state.flipped[i] || state.burned[i]) return;
    const visible = cardEls.filter((node) => !node.classList.contains("gone") && !node.classList.contains("burning"));
    const before = new Map(visible.map((node) => [node, node.getBoundingClientRect()]));
    state.burned[i] = true;
    save();
    syncCard(i, true, before);
    updateHUD();
    const rect = cardEls[i].getBoundingClientRect();
    if (puzzle.cards[i].isHerring) {
      floatScore(signed(E.RULES.burnHerring) + " PTS", rect.left + rect.width / 2, rect.top + 20, false);
      setMessage("CLEAN BURN — THAT WAS A RED HERRING.", "good");
      Sfx.play("good");
      toast("+200 · HERRING BURNED");
    } else {
      floatScore(signed(E.RULES.burnTrueClue) + " PTS", rect.left + rect.width / 2, rect.top + 20, true);
      setMessage("THAT WAS A REAL CLUE. OUCH.", "bad");
      shake();
      Sfx.play("bad");
      toast("−150 · REAL CLUE BURNED");
    }
  }

  function finish(correct) {
    if (state.result) return;
    const c = counts();
    const raw = (correct ? E.RULES.correctAnswer : 0) +
      c.flipped * E.RULES.flip + c.herrings * E.RULES.burnHerring +
      c.truths * E.RULES.burnTrueClue + state.wrongGuesses * E.RULES.wrongGuess;
    const score = E.scoreRound({
      correct, flippedCount: c.flipped, herringsBurned: c.herrings,
      trueCluesBurned: c.truths, wrongGuesses: state.wrongGuesses
    });
    const earned = Math.max(0, Math.round(score / 10));

    state.result = {
      day: puzzle.day, answer: puzzle.answer, correct, score, rawScore: raw, fishEarned: earned,
      flippedCount: c.flipped, herringsBurned: c.herrings, trueCluesBurned: c.truths,
      wrongGuesses: state.wrongGuesses,
      cells: puzzle.cards.map((card, i) => ({
        flipped: state.flipped[i], burned: state.burned[i], isHerring: card.isHerring
      }))
    };
    save();

    const current = normalizeData(B.getData());
    B.updateData({ fish: current.fish + earned, fishCaught: current.fishCaught });

    const nextStats = Object.assign({}, stats, {
      played: (stats.played || 0) + 1
    });
    if (correct) {
      nextStats.wins = (stats.wins || 0) + 1;
      nextStats.streak = stats.lastWin === yesterdayString() ? (stats.streak || 0) + 1 : 1;
      nextStats.lastWin = today;
      flashScreen("good");
      Sfx.play("win");
    } else {
      nextStats.streak = 0;
      flashScreen("bad");
      Sfx.play("bad");
    }
    nextStats.best = Math.max(stats.best || 0, score);
    nextStats.totalScore = (stats.totalScore || 0) + score;
    nextStats.lastPlayed = today;
    stats = nextStats;
    saveStats(nextStats);
    updateMenuStats();

    cardEls.forEach((_, i) => syncCard(i, false));
    el.guess.disabled = true;
    el.form.querySelector("button").disabled = true;
    el.giveUp.disabled = true;
    el.playLabel.textContent = "VIEW RESULT";
    updateHUD();
    setMessage(correct ? `CORRECT — IT WAS ${puzzle.answer.toUpperCase()}.` : `THE ANSWER WAS ${puzzle.answer.toUpperCase()}.`, correct ? "good" : "bad");
    window.setTimeout(showResult, correct ? 650 : 400);
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
    el.banner.textContent = r.correct ? "CORRECT!" : "MISSED!";
    el.banner.classList.toggle("lose", !r.correct);
    el.resultAnswer.textContent = r.answer;
    countUp(el.resultScore, r.score);
    el.resultFish.textContent = "+" + (r.fishEarned || 0) + " FISH EARNED";

    const rows = [];
    if (r.correct) rows.push(["CORRECT ANSWER", E.RULES.correctAnswer]);
    rows.push([`CARDS FLIPPED (${r.flippedCount})`, r.flippedCount * E.RULES.flip]);
    rows.push([`HERRINGS BURNED (${r.herringsBurned})`, r.herringsBurned * E.RULES.burnHerring]);
    rows.push([`REAL CLUES BURNED (${r.trueCluesBurned})`, r.trueCluesBurned * E.RULES.burnTrueClue]);
    if (r.wrongGuesses) rows.push([`WRONG GUESSES (${r.wrongGuesses})`, r.wrongGuesses * E.RULES.wrongGuess]);
    if (r.rawScore < 0) rows.push(["SCORE FLOOR", r.score - r.rawScore]);
    el.breakdown.innerHTML = rows.map(([label, value]) =>
      `<li><span>${label}</span><span class="${value >= 0 ? "plus" : "minus"}">${signed(value)}</span></li>`
    ).join("");

    const icons = { herring: "🔥", mistake: "💥", flipped: "🟨", hidden: "⬛" };
    el.resultCells.innerHTML = r.cells.map((c) => {
      const kind = c.burned ? (c.isHerring ? "herring" : "mistake") : (c.flipped ? "flipped" : "hidden");
      return `<span class="cell ${kind}">${icons[kind]}</span>`;
    }).join("");

    el.shareLabel.textContent = "COPY RESULT";
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
    el.zoomNum.textContent = "CLUE " + pad(i + 1);
    el.zoomText.textContent = puzzle.cards[i].text;
    openOverlay(el.cardOverlay);
    Sfx.play("open");
  }

  function tick() {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const diff = Math.max(0, Math.floor((next - now) / 1000));
    const text = `${pad(Math.floor(diff / 3600))}:${pad(Math.floor(diff / 60) % 60)}:${pad(diff % 60)}`;
    el.countdown.textContent = text;
    el.resultCountdown.textContent = text;
    if (E.localDateString() !== today) window.location.reload();
  }

  /* ---------------- wiring ---------------- */
  el.play.addEventListener("click", () => {
    Sfx.play("open");
    if (state.result) showResult();
    else showScreen("game");
  });
  el.back.addEventListener("click", () => { Sfx.play("click"); showScreen("menu"); });
  el.rules.addEventListener("click", () => { Sfx.play("open"); openOverlay(el.rulesOverlay); });
  el.rulesClose.addEventListener("click", () => { Sfx.play("click"); closeOverlay(el.rulesOverlay); });
  el.settings.addEventListener("click", () => { Sfx.play("open"); renderSettings(settingsTab); openOverlay(el.settingsOverlay); });
  el.settingsClose.addEventListener("click", () => { Sfx.play("click"); closeOverlay(el.settingsOverlay); });
  el.shop.addEventListener("click", () => { Sfx.play("open"); renderShop(shopTab); openOverlay(el.shopOverlay); });
  el.shopClose.addEventListener("click", () => { Sfx.play("click"); closeOverlay(el.shopOverlay); });
  el.account.addEventListener("click", () => openAccount());
  el.accountClose.addEventListener("click", () => { Sfx.play("click"); closeOverlay(el.accountOverlay); });
  el.soundGame.addEventListener("click", toggleSound);
  el.resultMenu.addEventListener("click", () => {
    Sfx.play("click");
    closeOverlay(el.resultOverlay);
    showScreen("menu");
  });
  el.share.addEventListener("click", copyResult);
  el.zoomClose.addEventListener("click", () => { Sfx.play("click"); closeOverlay(el.cardOverlay); });

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
    if (event.target && codeError && ["code", "answer", "truths", "herrings"].indexOf(event.target.name) >= 0) {
      codeError = "";
      const node = el.settingsContent.querySelector(".account-error");
      if (node) node.textContent = "";
    }
  });

  el.settingsContent.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.target;
    if (form.dataset.form !== "code") return;
    const value = String(form.elements.code.value || "").trim().toUpperCase();
    if (value === DEV_CODE) {
      unlockDev();
      toast("CODE ACCEPTED — DEV TOOLS READY");
      renderSettings("codes");
    } else if (value === RELEASE_CODE) {
      redeemRelease();
      renderSettings("codes");
    } else {
      codeError = "CODE NOT RECOGNIZED. TRY AGAIN.";
      renderSettings("codes");
    }
    return;
  });

  el.settingsContent.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.target;
    if (form.dataset.form !== "dev-word") return;
    if (!devUnlocked) return;
    const lines = (node) => String(node && node.value || "")
      .split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const answer = String(form.elements.answer.value || "").trim().replace(/\s+/g, " ");
    const truths = lines(form.elements.truths);
    const herrings = lines(form.elements.herrings);
    const entry = {
      answer,
      clues: truths.map((text) => ({ text, true: true }))
        .concat(herrings.map((text) => ({ text, true: false })))
    };
    const problems = E.validateCatalog([entry]);
    if (problems.length) {
      codeError = problems[0].toUpperCase();
      renderSettings("codes");
      return;
    }
    devPuzzles.push(entry);
    codeError = "";
    const redealt = rebuildPuzzle();
    Sfx.play("buy");
    toast(redealt ? "DEV WORD ADDED — DECK REDEALT" : "DEV WORD ADDED — NEXT ROUND");
    renderSettings("codes");
  });

  el.settingsContent.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-action]");
    if (!btn || btn.disabled) return;
    if (btn.dataset.action === "toggle-sound") { Sfx.play("click"); toggleSound(); return; }
    if (btn.dataset.action === "dev-hide") { Sfx.play("click"); hideDev(); return; }
    if (btn.dataset.action === "dev-word-remove") {
      const index = Number(btn.dataset.index);
      if (devUnlocked && Number.isInteger(index) && index >= 0 && index < devPuzzles.length) {
        devPuzzles.splice(index, 1);
        rebuildPuzzle();
        renderSettings("codes");
        Sfx.play("click");
      }
      return;
    }
    if (btn.dataset.action === "dev-words-clear") {
      if (!devUnlocked) return;
      devPuzzles = [];
      rebuildPuzzle();
      renderSettings("codes");
      toast("DEV WORDS CLEARED");
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
    if (action === "google") {
      Sfx.play("open");
      B.auth.signInWithGoogle()
        .then(() => { accountView.form = "view"; accountView.error = ""; renderAccount(); toast("SIGNED IN WITH GOOGLE"); })
        .catch((err) => showAccountError(
          /FIREBASE CONFIG|CONFIG/i.test(err.message || "")
            ? "GOOGLE NEEDS FIREBASE: ADD YOUR KEYS TO config.js, ENABLE GOOGLE IN FIREBASE AUTH, ADD YOUR DOMAIN TO AUTHORIZED DOMAINS, THEN RELOAD."
            : err.message
        ));
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
      task.then(() => {
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
    const r = card.getBoundingClientRect();
    card.style.setProperty("--rx", `${(-(event.clientY - r.top) / r.height + 0.5) * 9}deg`);
    card.style.setProperty("--ry", `${((event.clientX - r.left) / r.width - 0.5) * 9}deg`);
  });
  el.deck.addEventListener("pointerout", (event) => {
    const card = event.target.closest(".card");
    if (!card) return;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  });

  el.form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.result) return;
    const raw = el.guess.value.trim();
    if (!raw) { setMessage("TYPE AN ANSWER FIRST.", "bad"); return; }
    if (stripArticles(raw) === stripArticles(puzzle.answer)) {
      finish(true);
    } else {
      state.wrongGuesses++;
      save();
      updateHUD();
      el.guess.select();
      const rect = el.guess.getBoundingClientRect();
      floatScore(signed(E.RULES.wrongGuess) + " PTS", rect.left + rect.width / 2, rect.top, true);
      shake();
      flashScreen("bad");
      Sfx.play("wrong");
      setMessage("NOT QUITE. WRONG GUESSES COST " + E.RULES.wrongGuess + " POINTS.", "bad");
    }
  });

  el.giveUp.addEventListener("click", () => {
    if (state.result) return;
    if (window.confirm(`GIVE UP? THE ANSWER IS "${puzzle.answer}". THIS ENDS TODAY'S ROUND.`)) finish(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      [el.resultOverlay, el.cardOverlay, el.rulesOverlay, el.shopOverlay,
        el.settingsOverlay, el.accountOverlay].forEach(closeOverlay);
    }
    if (event.ctrlKey || event.metaKey || event.altKey || typeof event.key !== "string" ||
        event.key.length !== 1 || !/[a-zA-Z0-9]/.test(event.key)) return;
    const key = event.key.toUpperCase();
    devBuffer = (devBuffer + key).slice(-DEV_CODE.length);
    releaseBuffer = (releaseBuffer + key).slice(-RELEASE_CODE.length);
    if (devBuffer === DEV_CODE) { devBuffer = ""; unlockDev(); }
    if (releaseBuffer === RELEASE_CODE) {
      releaseBuffer = "";
      redeemRelease();
      if (!el.settingsOverlay.hidden && settingsTab === "codes") renderSettings("codes");
    }
  });

  [el.resultOverlay, el.cardOverlay, el.rulesOverlay, el.shopOverlay,
    el.settingsOverlay, el.accountOverlay].forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeOverlay(overlay);
    });
  });

  /* ---------------- boot ---------------- */
  el.menuDay.textContent = "#" + puzzle.day;
  el.gameDay.textContent = "#" + puzzle.day;
  el.hint.textContent = "HINT: " + puzzle.answerHint.toUpperCase();
  if (state.result) el.playLabel.textContent = "VIEW RESULT";
  buildRules();
  buildMenuParticles();
  renderDeck();
  applyData(accountData);
  updateHUD();
  tick();
  window.setInterval(tick, 1000);

  B.onAuth((user) => {
    currentUser = user;
    updateAccountUI();
    if (!el.accountOverlay.hidden) renderAccount();
    if (!el.settingsOverlay.hidden && settingsTab === "account") renderSettings(settingsTab);
  });

  B.onData((data) => { applyData(data); });

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
