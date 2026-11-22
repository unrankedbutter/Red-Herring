/*
 * Red Herring — pure game engine.
 * No DOM, no storage. Safe to unit-test in Node.
 */
(function (root, factory) {
  const api = factory();
  root.RedHerringEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // Day 0 is 2026-11-19 (launch day); every following date counts up by one.
  const START_DATE = Date.UTC(2026, 10, 19);
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  // Tune the game here. The rules panel reads these values so it stays in sync.
  const RULES = Object.freeze({
    correctAnswer: 650,
    flip: -100,
    burnHerring: 200,
    burnTrueClue: -150,
    wrongGuess: -50,
    floorAtZero: true
  });

  // Arcade pays a fraction of your final score. Daily base is 0.10 (10%) and
  // the app adds a 20% gameplay bonus on top, so the effective daily rate is
  // 12%. Even EXTREME pays 25% less. The number of herrings decides difficulty.
  // The two hardest modes add a clock: 60s for FRENZY, 45s for EXTREME.
  // `introChance` controls how often the short round-intro popup appears.
  // Easier / repeated modes skip it more often so play starts faster.
  const ARCADE_MODES = Object.freeze([
    { id: "easy",    name: "EASY",    herrings: 1, payout: 0.020, timeLimit: 0,  accent: "#63f5a8", icon: "star1",  introChance: 0.25, desc: "ONE WRONG CLUE. ALMOST NO FISH." },
    { id: "rookie",  name: "ROOKIE",  herrings: 2, payout: 0.030, timeLimit: 0,  accent: "#9be36b", icon: "star2",  introChance: 0.35, desc: "TWO WRONG CLUES. A FEW MORE FISH." },
    { id: "medium",  name: "MEDIUM",  herrings: 3, payout: 0.040, timeLimit: 0,  accent: "#35f0ff", icon: "target", introChance: 0.50, desc: "THREE WRONG CLUES. A BIT MORE FISH." },
    { id: "hard",    name: "HARD",    herrings: 4, payout: 0.060, timeLimit: 0,  accent: "#ffd166", icon: "flame",  introChance: 0.65, desc: "FOUR WRONG CLUES. GOOD FISH." },
    { id: "frenzy",  name: "FRENZY",  herrings: 5, payout: 0.065, timeLimit: 60, accent: "#ff9f4a", icon: "bolt",   introChance: 0.75, desc: "FIVE WRONG CLUES. 60 SECOND TIMER." },
    { id: "extreme", name: "EXTREME", herrings: 6, payout: 0.075, timeLimit: 45, accent: "#ff3d6e", icon: "skull",  introChance: 0.85, desc: "SIX WRONG CLUES. 45 SECOND TIMER." }
  ]);

  // Arcade sections. DEFAULT and CHRISTMAS are clean rounds; TWISTED guarantees
  // a house rule; PRACTICE lets you pick every piece and pays no fish.
  const ARCADE_EVENTS = Object.freeze([
    { id: "default",   name: "DEFAULT",   kicker: "MAIN EVENT",   desc: "NO TWISTS · NORMAL WORDS", accent: "#35f0ff", icon: "cabinet" },
    { id: "christmas", name: "CHRISTMAS", kicker: "LIMITED EVENT", desc: "NO TWISTS · FESTIVE WORDS", accent: "#ff5577", icon: "tree" },
    { id: "twisted",   name: "TWISTED",   kicker: "HOUSE RULES",   desc: "EVERY ROUND HAS A TWIST", accent: "#b98cff", icon: "dice", twists: true },
    { id: "practice",  name: "PRACTICE",  kicker: "NO FISH",       desc: "PICK WORD · TWIST · DIFFICULTY", accent: "#63f5a8", icon: "target", twists: true, practice: true }
  ]);

  // TWISTED rolls one house rule per round. Base scoring never changes — a
  // twist only pays more when it genuinely makes the round harder (or is an
  // honestly-labelled lucky round). `short` is the compact in-game chip.
  const ARCADE_TWISTS = Object.freeze([
    { id: "standard", name: "STANDARD",   desc: "NO TWIST. JUST YOU AND THE CLUES.",        short: "NO TWIST",            accent: "#35f0ff", icon: "dice",      payout: 1 },
    { id: "jackpot",  name: "JACKPOT",    desc: "A LUCKY ROUND. 50% MORE FISH FOR FREE.",    short: "BONUS ×1.5",         accent: "#ffd166", icon: "coin",      payout: 1.5 },
    { id: "strike",   name: "ONE STRIKE", desc: "ONE WRONG GUESS ENDS THE ROUND. HIGH RISK.", short: "1 WRONG = OUT · ×2", accent: "#ff3d6e", icon: "skull",     payout: 2, sudden: true },
    { id: "rush",     name: "RUSH HOUR",  desc: "15 SECONDS OFF THE CLOCK. THINK FASTER.",   short: "−15s · ×1.8",       accent: "#ff9f4a", icon: "clock",     payout: 1.8, timed: true, timeCut: 15 },
    { id: "fade",     name: "FADE OUT",   desc: "CLUES FADE 3s AFTER YOU FLIP THEM. REMEMBER THEM.", short: "CLUES FADE · ×2", accent: "#b98cff", icon: "hourglass", payout: 2, fade: true },
    { id: "gift",     name: "GIFT DROP",  desc: "A FESTIVE GIFT. 50% MORE FISH. MERRY!",     short: "FESTIVE ×1.5",      accent: "#63f5a8", icon: "gift",      payout: 1.5, christmas: true },
    { id: "nope",     name: "NO PEEK",    desc: "CLUES CANNOT BE ZOOMED. TRUST YOUR MEMORY.", short: "NO ZOOM · ×1.6",    accent: "#35f0ff", icon: "eye",      payout: 1.6, noZoom: true },
    { id: "double",   name: "DOUBLE COST",desc: "WRONG GUESSES COST DOUBLE. CHOOSE CAREFULLY.", short: "WRONG −100 · ×1.7", accent: "#ff9f4a", icon: "target",   payout: 1.7, wrongPenalty: -100 },
    { id: "noburn",   name: "NO BURN",    desc: "BURN BUTTONS ARE LOCKED. NO CLEAN BONUSES.", short: "NO BURNING · ×1.8",  accent: "#b98cff", icon: "flame",    payout: 1.8, noBurn: true }
  ]);

  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }

  function mulberry32(a) {
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(items, rand) {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function dateToUTC(dateString) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString || "");
    if (!m) throw new Error("Expected a date in YYYY-MM-DD format");
    return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  }

  function dayNumber(dateString) {
    return Math.floor((dateToUTC(dateString) - START_DATE) / MS_PER_DAY);
  }

  function localDateString(date) {
    const d = date || new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function utcDateString(ms) {
    const d = new Date(ms);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }

  function previousDateString(dateString) {
    return utcDateString(dateToUTC(dateString) - MS_PER_DAY);
  }

  function nextDateString(dateString) {
    return utcDateString(dateToUTC(dateString) + MS_PER_DAY);
  }

  // The answer seed for a date, before any dev override or no-repeat check.
  function seededEntry(catalog, version, dateString) {
    const rand = mulberry32(xmur3(`${version}|${dateString}`)());
    return catalog[Math.floor(rand() * catalog.length)];
  }

  function normalizeAnswer(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  // Only true short forms and synonyms count. A related but different object
  // (tooth vs toothbrush, paint vs paintbrush, tree vs Christmas tree) must not
  // be treated as an alias. Keys are normalized and articles are stripped.
  const ANSWER_ALIASES = Object.freeze({
    bike: "bicycle",
    cycle: "bicycle",
    alarm: "alarm clock",
    snowshoe: "snowshoes",
    "snow shoe": "snowshoes",
    santa: "santa claus",
    "xmas tree": "christmas tree",
    nativity: "nativity scene",
    turkey: "roast turkey"
  });

  // A single distinctive word from a two-word answer can snap straight to the
  // full answer ("turkey" -> "Roast Turkey"). Generic words stay hint-only so
  // "tree" is still not the same thing as "Christmas Tree".
  const WEAK_COMPONENTS = new Set([
    "christmas", "roast", "snow", "mince", "fairy", "wrapping", "advent",
    "tree", "card", "pie", "globe", "cane", "clock", "shoes", "paper",
    "scene", "lights", "pudding", "house"
  ]);

  function answerWords(answer) {
    return aliasKey(answer).split(/\s+/).filter(Boolean);
  }

  function maskedHint(words) {
    return words.map((word) => word.charAt(0).toUpperCase() + "\u2026").join(" ");
  }

  // Finds a "really close" guess in the current answer pool. `auto: true`
  // means it is safe to snap the input to the full answer. Otherwise it
  // returns a small hint without spending a wrong guess.
  function findCloseAnswer(value, pool) {
    const key = aliasKey(value);
    if (!key) return null;
    const candidates = (pool || [])
      .map((entry) => ({ entry, words: answerWords(entry.answer) }))
      .filter((item) => item.words.length > 1);
    if (!candidates.length) return null;

    const guessWords = key.split(/\s+/);
    if (guessWords.length === 1 && key.length >= 5 && !WEAK_COMPONENTS.has(key)) {
      const tails = candidates.filter((item) => item.words.slice(1).indexOf(key) >= 0);
      if (tails.length === 1) {
        return {
          answer: tails[0].entry.answer,
          auto: true,
          hint: "CLOSE! FULL NAME: " + maskedHint(tails[0].words) + "."
        };
      }
    }

    const contained = candidates.filter((item) =>
      guessWords.every((word) => item.words.indexOf(word) >= 0) &&
      item.words.length > guessWords.length
    );
    const near = candidates.filter((item) => item.words.some((word) =>
      word.length >= 4 && (word.indexOf(key) === 0 || key.indexOf(word) === 0)
    ));
    const matches = contained.length ? contained : near;
    if (matches.length !== 1) return null;
    const best = matches[0];
    return {
      answer: best.entry.answer,
      auto: false,
      hint: "CLOSE! " + best.words.length + " WORDS — " + maskedHint(best.words) + "."
    };
  }

  function aliasKey(value) {
    return normalizeAnswer(value).replace(/^(the|a|an)\s+/, "");
  }

  // Aliases only snap to an answer that is actually in the supplied pool.
  function resolveAnswerAlias(value, pool) {
    const target = ANSWER_ALIASES[aliasKey(value)];
    if (!target) return null;
    const match = (pool || []).find((entry) => aliasKey(entry.answer) === target);
    return match ? match.answer : null;
  }

  function pickN(pool, n, rand) {
    return shuffle(pool, rand).slice(0, n);
  }

  // Herrings are REAL clues stolen from other answers, which makes them far
  // more convincing than made-up lies. Clues that also fit today's answer (or
  // mention it) are skipped so a herring can never accidentally be true.
  function herringDonors(catalog, entry) {
    const answerKey = normalizeAnswer(entry.answer);
    const ownTruths = entry.clues.filter((c) => c.true === true).map((c) => normalizeAnswer(c.text));
    const donors = [];
    catalog.forEach((other) => {
      if (normalizeAnswer(other.answer) === answerKey) return;
      const clues = (other.clues || []).filter((clue) => {
        if (!clue || clue.true !== true || typeof clue.text !== "string") return false;
        const key = normalizeAnswer(clue.text);
        return !!key && ownTruths.indexOf(key) < 0 && key.indexOf(answerKey) < 0;
      });
      if (clues.length) donors.push(clues);
    });
    return donors;
  }

  function pickHerrings(catalog, entry, rand, count) {
    const wanted = Math.max(1, Number(count) || 3);
    const donors = herringDonors(catalog, entry);
    const herrings = [];
    const used = Object.create(null);
    const add = (clue) => {
      const key = normalizeAnswer(clue.text);
      if (!key || used[key]) return;
      used[key] = true;
      herrings.push(clue.text);
    };

    // About a quarter of rounds keep the herrings within one other question,
    // so the fake identity holds together and really tricks you. Wider arcade
    // decks need a donor with enough clues before this shortcut is allowed.
    if (donors.length && rand() < 0.25) {
      const big = donors.filter((clues) => clues.length >= wanted);
      const pool = big.length ? big : donors;
      shuffle(pool[Math.floor(rand() * pool.length)], rand).forEach(add);
    }
    for (let pass = 0; pass < 4 && herrings.length < wanted; pass++) {
      shuffle(donors, rand).forEach((clues) => {
        if (herrings.length >= wanted) return;
        const options = shuffle(clues, rand);
        for (let i = 0; i < options.length; i++) {
          if (!used[normalizeAnswer(options[i].text)]) { add(options[i]); break; }
        }
      });
    }
    // Catalogs with too few other questions still always deal a full deck.
    if (herrings.length < wanted) {
      shuffle((entry.clues || []).filter((c) => c.true === false), rand).forEach((clue) => {
        if (herrings.length < wanted) add(clue);
      });
    }
    return herrings.slice(0, wanted);
  }

  function buildDailyPuzzle(catalog, version, dateString, options) {
    if (!Array.isArray(catalog) || catalog.length === 0) {
      throw new Error("Puzzle catalog is empty");
    }
    const rand = mulberry32(xmur3(`${version}|${dateString}`)());
    const opts = options || {};

    // Pick the answer and 5 of its 6 truths, then borrow herrings from other
    // answers' true clues. Same date + same catalog always deals the same deck.
    let entry = catalog[Math.floor(rand() * catalog.length)];

    // Dev tools can force any catalog answer for immediate, cooldown-free play.
    if (opts.answer) {
      const wanted = normalizeAnswer(opts.answer);
      const forced = catalog.find((candidate) => normalizeAnswer(candidate.answer) === wanted);
      if (forced) entry = forced;
    } else {
      // Never repeat yesterday's answer. The previous day is seeded the same
      // way, so everyone sees the same no-repeat chain.
      const previousKey = normalizeAnswer(seededEntry(catalog, version, previousDateString(dateString)).answer);
      if (normalizeAnswer(entry.answer) === previousKey && catalog.length > 1) {
        const alternatives = catalog.filter((candidate) => normalizeAnswer(candidate.answer) !== previousKey);
        entry = alternatives[Math.floor(rand() * alternatives.length)];
      }
    }

    const truths = pickN(entry.clues.filter((c) => c.true === true), 5, rand);
    const herrings = pickHerrings(catalog, entry, rand);

    const cards = shuffle(
      [
        ...truths.map((c) => ({ text: c.text, isHerring: false })),
        ...herrings.map((text) => ({ text, isHerring: true }))
      ],
      rand
    ).map((card, index) => ({ id: index, text: card.text, isHerring: card.isHerring }));

    const answer = entry.answer;
    return {
      date: dateString,
      day: dayNumber(dateString),
      answer,
      cards
    };
  }

  // Arcade rounds are seeded by a random number instead of the date, so they
  // can be replayed endlessly. Same seed always rebuilds the same deck.
  function buildArcadePuzzle(catalog, version, modeId, seed, opts) {
    if (!Array.isArray(catalog) || catalog.length === 0) {
      throw new Error("Puzzle catalog is empty");
    }
    const mode = ARCADE_MODES.find((m) => m.id === modeId) || ARCADE_MODES[0];
    const rand = mulberry32(xmur3(`${version}|arcade|${mode.id}|${seed}`)());
    // Dev tools can pin a word; normal play always lets the seed choose.
    const forced = opts && opts.answer
      ? catalog.find((item) => normalizeAnswer(item.answer) === normalizeAnswer(opts.answer))
      : null;
    // Avoid recently played answers so endless arcade sessions feel fresh.
    const avoid = opts && Array.isArray(opts.avoid) ? opts.avoid.map(normalizeAnswer) : [];
    const pool = avoid.length
      ? catalog.filter((item) => avoid.indexOf(normalizeAnswer(item.answer)) < 0)
      : catalog;
    const entry = forced || (pool.length ? pool : catalog)[Math.floor(rand() * (pool.length || catalog.length))];
    const available = entry.clues.filter((c) => c.true === true).slice();
    // Every round deals 8 cards. Catalog words carry 6 true clues, so EASY
    // (only 1 herring) needs one extra honest clue. It is derived from the
    // answer's length, so no catalog content changes and daily rounds are
    // untouched.
    const neededTruths = 8 - mode.herrings;
    if (available.length < neededTruths) {
      const letters = String(entry.answer).replace(/[^A-Za-z]/g, "").length;
      const extra = "The answer is " + letters + " letters long.";
      if (!available.some((c) => c.text === extra)) {
        available.push({ text: extra, true: true, generated: true });
      }
    }
    const truthCount = Math.min(neededTruths, available.length);
    const truths = pickN(available, truthCount, rand);
    const herrings = pickHerrings(catalog, entry, rand, mode.herrings);

    const cards = shuffle(
      [
        ...truths.map((c) => ({ text: c.text, isHerring: false })),
        ...herrings.map((text) => ({ text, isHerring: true }))
      ],
      rand
    ).map((card, index) => ({ id: index, text: card.text, isHerring: card.isHerring }));

    const answer = entry.answer;
    return {
      date: null,
      day: null,
      mode: mode.id,
      modeName: mode.name,
      answer,
      cards,
      herringTotal: mode.herrings,
      payout: mode.payout,
      timeLimit: mode.timeLimit
    };
  }

  function scoreRound(opts) {
    const o = opts || {};
    const flipped = o.flippedCount || 0;
    const herrings = o.herringsBurned || 0;
    const truths = o.trueCluesBurned || 0;
    const wrong = o.wrongGuesses || 0;
    const wrongPenalty = o.wrongPenalty == null ? RULES.wrongGuess : o.wrongPenalty;

    let score = 0;
    score += o.correct ? RULES.correctAnswer : 0;
    score += flipped * RULES.flip;
    score += herrings * RULES.burnHerring;
    score += truths * RULES.burnTrueClue;
    score += wrong * wrongPenalty;

    const shouldFloor = o.floor === undefined ? RULES.floorAtZero : !!o.floor;
    if (shouldFloor && score < 0) score = 0;
    return score;
  }

  function validateCatalog(catalog) {
    const errors = [];
    if (!Array.isArray(catalog)) return ["Catalog must be an array"];

    catalog.forEach((entry, index) => {
      const at = `entry ${index + 1} (${entry && entry.answer ? entry.answer : "?"})`;
      if (!entry || typeof entry.answer !== "string" || !entry.answer.trim()) {
        errors.push(`${at}: missing answer`);
        return;
      }
      if (entry.answer.trim().split(/\s+/).length > 2) {
        errors.push(`${at}: answer must be 1–2 words`);
      }
      // Herrings are borrowed from OTHER answers' true clues, so a catalog
      // entry only needs its own true clues. Hand-written herrings are optional
      // (they only serve as a fallback in very small catalogs).
      const truths = (entry.clues || []).filter((c) => c.true === true);
      if (truths.length < 5) errors.push(`${at}: needs at least 5 true clues (has ${truths.length})`);
      if ((entry.clues || []).some((c) => typeof c.text !== "string" || !c.text.trim())) {
        errors.push(`${at}: has an empty clue`);
      }
      const texts = (entry.clues || []).map((c) => normalizeAnswer(c.text));
      if (new Set(texts).size !== texts.length) errors.push(`${at}: has duplicate clues`);
      if (texts.some((t) => t === normalizeAnswer(entry.answer))) {
        errors.push(`${at}: a clue reveals the answer`);
      }
    });

    const answers = catalog.map((e) => normalizeAnswer(e.answer));
    if (new Set(answers).size !== answers.length) errors.push("Catalog has duplicate answers");
    return errors;
  }

  function shareText(result) {
    const r = result || {};
    const cells = (r.cells || []).map((c) => {
      if (c.burned) return c.isHerring ? "🔥" : "💥";
      if (c.flipped) return "🟨";
      return "⬛";
    }).join("");

    const heading = r.modeName
      ? `Red Herring Arcade · ${r.modeName} ${r.correct ? "✅" : "❌"}`
      : `Red Herring Day ${r.day === undefined || r.day === null ? "?" : r.day} ${r.correct ? "✅" : "❌"}`;
    const total = r.herringTotal || 3;
    const lines = [
      heading,
      `${r.correct ? r.answer : "???"} — ${r.score} points`,
      `${cells}`,
      `🔥 ${r.herringsBurned}/${total} herrings burned · 💥 ${r.trueCluesBurned} true clue${r.trueCluesBurned === 1 ? "" : "s"} burned · 👁 ${r.flippedCount} flipped`
    ];
    if (r.twistName) lines.push(`🎲 HOUSE RULE · ${r.twistName}`);
    if (r.practice) lines.push("🏋 PRACTICE · NO FISH");
    return lines.join("\n");
  }

  return {
    RULES,
    ARCADE_MODES,
    ARCADE_EVENTS,
    ARCADE_TWISTS,
    START_DATE,
    xmur3,
    mulberry32,
    shuffle,
    dayNumber,
    localDateString,
    previousDateString,
    nextDateString,
    normalizeAnswer,
    resolveAnswerAlias,
    findCloseAnswer,
    buildDailyPuzzle,
    buildArcadePuzzle,
    scoreRound,
    validateCatalog,
    shareText
  };
});
