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

  const START_DATE = Date.UTC(2024, 0, 1);
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
    return Math.floor((dateToUTC(dateString) - START_DATE) / MS_PER_DAY) + 1;
  }

  function localDateString(date) {
    const d = date || new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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

  function pickHerrings(catalog, entry, rand) {
    const donors = herringDonors(catalog, entry);
    const herrings = [];
    const used = Object.create(null);
    const add = (clue) => {
      const key = normalizeAnswer(clue.text);
      if (!key || used[key]) return;
      used[key] = true;
      herrings.push(clue.text);
    };

    // About a quarter of rounds keep all three herrings within one other
    // question, so the fake identity holds together and really tricks you.
    if (donors.length && rand() < 0.25) {
      shuffle(donors[Math.floor(rand() * donors.length)], rand).slice(0, 3).forEach(add);
    }
    if (herrings.length < 3) {
      const mixed = shuffle(donors, rand);
      for (let pass = 0; pass < 3 && herrings.length < 3; pass++) {
        mixed.forEach((clues) => {
          if (herrings.length >= 3) return;
          const options = shuffle(clues, rand);
          for (let i = 0; i < options.length; i++) {
            if (!used[normalizeAnswer(options[i].text)]) { add(options[i]); break; }
          }
        });
      }
    }
    // Catalogs with too few other questions still always deal a full deck.
    if (herrings.length < 3) {
      shuffle((entry.clues || []).filter((c) => c.true === false), rand).forEach((clue) => {
        if (herrings.length < 3) add(clue);
      });
    }
    return herrings.slice(0, 3);
  }

  function buildDailyPuzzle(catalog, version, dateString) {
    if (!Array.isArray(catalog) || catalog.length === 0) {
      throw new Error("Puzzle catalog is empty");
    }
    const rand = mulberry32(xmur3(`${version}|${dateString}`)());

    // Pick the answer and 5 of its 6 truths, then borrow herrings from other
    // answers' true clues. Same date + same catalog always deals the same deck.
    const entry = catalog[Math.floor(rand() * catalog.length)];
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
      answerHint: `${answer.split(/\s+/).length} ${answer.split(/\s+/).length === 1 ? "word" : "words"} · ${normalizeAnswer(answer).replace(/\s/g, "").length} letters`,
      cards
    };
  }

  function scoreRound(opts) {
    const o = opts || {};
    const flipped = o.flippedCount || 0;
    const herrings = o.herringsBurned || 0;
    const truths = o.trueCluesBurned || 0;
    const wrong = o.wrongGuesses || 0;

    let score = 0;
    score += o.correct ? RULES.correctAnswer : 0;
    score += flipped * RULES.flip;
    score += herrings * RULES.burnHerring;
    score += truths * RULES.burnTrueClue;
    score += wrong * RULES.wrongGuess;

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
      const truths = (entry.clues || []).filter((c) => c.true === true);
      const herrings = (entry.clues || []).filter((c) => c.true === false);
      if (truths.length < 5) errors.push(`${at}: needs at least 5 true clues (has ${truths.length})`);
      if (herrings.length < 3) errors.push(`${at}: needs at least 3 herrings (has ${herrings.length})`);
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

    const lines = [
      `Red Herring #${r.day || "?"} ${r.correct ? "✅" : "❌"}`,
      `${r.correct ? r.answer : "???"} — ${r.score} points`,
      `${cells}`,
      `🔥 ${r.herringsBurned}/3 herrings burned · 💥 ${r.trueCluesBurned} true clue${r.trueCluesBurned === 1 ? "" : "s"} burned · 👁 ${r.flippedCount} flipped`
    ];
    return lines.join("\n");
  }

  return {
    RULES,
    START_DATE,
    xmur3,
    mulberry32,
    shuffle,
    dayNumber,
    localDateString,
    normalizeAnswer,
    buildDailyPuzzle,
    scoreRound,
    validateCatalog,
    shareText
  };
});
