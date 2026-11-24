const test = require("node:test");
const assert = require("node:assert/strict");

const puzzles = require("../puzzles.js");
const engine = require("../engine.js");

test("catalog is valid", () => {
  assert.deepEqual(engine.validateCatalog(puzzles.CATALOG), []);
  assert.ok(puzzles.CATALOG.length >= 10, "need a decent pool of answers");
});

test("christmas catalog is valid and event decks stay festive", () => {
  assert.deepEqual(engine.validateCatalog(puzzles.CHRISTMAS_CATALOG), []);
  assert.ok(puzzles.CHRISTMAS_CATALOG.length >= 10, "need a decent festive pool");
  const answers = new Set(puzzles.CHRISTMAS_CATALOG.map((e) => engine.normalizeAnswer(e.answer)));
  for (const mode of engine.ARCADE_MODES) {
    for (let i = 0; i < 30; i++) {
      const deck = engine.buildArcadePuzzle(
        puzzles.CHRISTMAS_CATALOG, puzzles.PUZZLE_VERSION, mode.id, `christmas-${mode.id}-${i}`
      );
      assert.ok(answers.has(engine.normalizeAnswer(deck.answer)), `non-festive answer: ${deck.answer}`);
    }
  }
});

test("every daily deck has exactly 5 truths and 3 herrings", () => {
  for (let i = 0; i < 400; i++) {
    const date = new Date(Date.UTC(2024, 0, 1) + i * 86400000).toISOString().slice(0, 10);
    const deck = engine.buildDailyPuzzle(puzzles.CATALOG, puzzles.PUZZLE_VERSION, date);
    assert.equal(deck.cards.length, 8);
    assert.equal(deck.cards.filter((c) => !c.isHerring).length, 5);
    assert.equal(deck.cards.filter((c) => c.isHerring).length, 3);
    assert.equal(new Set(deck.cards.map((c) => c.text)).size, 8);
    assert.ok(deck.answer.length > 0);
    assert.ok(Number.isInteger(deck.day));
  }
});

test("herrings are real clues borrowed from other answers", () => {
  const truthOwner = new Map();
  puzzles.CATALOG.forEach((entry) => {
    entry.clues.filter((c) => c.true === true).forEach((c) => {
      truthOwner.set(engine.normalizeAnswer(c.text), engine.normalizeAnswer(entry.answer));
    });
  });

  for (let i = 0; i < 200; i++) {
    const date = new Date(Date.UTC(2025, 0, 1) + i * 86400000).toISOString().slice(0, 10);
    const deck = engine.buildDailyPuzzle(puzzles.CATALOG, puzzles.PUZZLE_VERSION, date);
    const herrings = deck.cards.filter((c) => c.isHerring);
    assert.equal(herrings.length, 3);
    herrings.forEach((card) => {
      const owner = truthOwner.get(engine.normalizeAnswer(card.text));
      assert.ok(owner, `herring was not taken from another answer: ${card.text}`);
      assert.notEqual(owner, engine.normalizeAnswer(deck.answer));
    });
  }
});

test("about a quarter of rounds keep all herrings from one other answer", () => {
  const truthOwner = new Map();
  puzzles.CATALOG.forEach((entry) => {
    entry.clues.filter((c) => c.true === true).forEach((c) => {
      truthOwner.set(engine.normalizeAnswer(c.text), engine.normalizeAnswer(entry.answer));
    });
  });
  let sameDonor = 0;
  const total = 400;
  for (let i = 0; i < total; i++) {
    const date = new Date(Date.UTC(2025, 0, 1) + i * 86400000).toISOString().slice(0, 10);
    const deck = engine.buildDailyPuzzle(puzzles.CATALOG, puzzles.PUZZLE_VERSION, date);
    const owners = deck.cards.filter((c) => c.isHerring).map((c) => truthOwner.get(engine.normalizeAnswer(c.text)));
    if (new Set(owners).size === 1) sameDonor++;
  }
  const rate = sameDonor / total;
  assert.ok(rate > 0.14 && rate < 0.38, `expected roughly 25% single-donor rounds, got ${rate}`);
});

test("dev-added words can join the catalog", () => {
  const devEntry = {
    answer: "Testword",
    clues: [
      { text: "My first dev clue is true.", true: true },
      { text: "My second dev clue is true.", true: true },
      { text: "My third dev clue is true.", true: true },
      { text: "My fourth dev clue is true.", true: true },
      { text: "My fifth dev clue is true.", true: true },
      { text: "My sixth dev clue is true.", true: true },
      { text: "A dev herring one.", true: false },
      { text: "A dev herring two.", true: false },
      { text: "A dev herring three.", true: false },
      { text: "A dev herring four.", true: false }
    ]
  };
  const catalog = puzzles.CATALOG.concat(devEntry);
  assert.deepEqual(engine.validateCatalog(catalog), []);
  let seen = false;
  for (let i = 0; i < 250 && !seen; i++) {
    const date = new Date(Date.UTC(2026, 0, 1) + i * 86400000).toISOString().slice(0, 10);
    const deck = engine.buildDailyPuzzle(catalog, puzzles.PUZZLE_VERSION, date);
    seen = deck.answer === "Testword";
    assert.equal(deck.cards.length, 8);
  }
  assert.ok(seen, "dev answer never appeared in 250 days");
});

test("consecutive days never repeat the same answer", () => {
  let previous = null;
  for (let i = 0; i < 400; i++) {
    const date = new Date(Date.UTC(2024, 0, 2) + i * 86400000).toISOString().slice(0, 10);
    const answer = engine.buildDailyPuzzle(puzzles.CATALOG, puzzles.PUZZLE_VERSION, date).answer;
    assert.notEqual(engine.normalizeAnswer(answer), previous, `answer repeated on ${date}`);
    previous = engine.normalizeAnswer(answer);
  }
});

test("next/previous dates cross month boundaries", () => {
  assert.equal(engine.nextDateString("2026-01-31"), "2026-02-01");
  assert.equal(engine.previousDateString("2026-03-01"), "2026-02-28");
  assert.equal(engine.nextDateString("2024-02-28"), "2024-02-29");
});

test("dev tools can force any answer", () => {
  const wanted = puzzles.CATALOG[7].answer;
  const deck = engine.buildDailyPuzzle(puzzles.CATALOG, puzzles.PUZZLE_VERSION, "2026-11-19", { answer: wanted });
  assert.equal(deck.answer, wanted);
  assert.equal(deck.cards.length, 8);
});

test("same date always builds the same puzzle", () => {
  const a = engine.buildDailyPuzzle(puzzles.CATALOG, puzzles.PUZZLE_VERSION, "2026-11-18");
  const b = engine.buildDailyPuzzle(puzzles.CATALOG, puzzles.PUZZLE_VERSION, "2026-11-18");
  assert.deepEqual(a, b);
});

test("different dates vary the deck", () => {
  const seen = new Set();
  for (let i = 0; i < 60; i++) {
    const date = new Date(Date.UTC(2026, 0, 1) + i * 86400000).toISOString().slice(0, 10);
    seen.add(JSON.stringify(engine.buildDailyPuzzle(puzzles.CATALOG, puzzles.PUZZLE_VERSION, date)));
  }
  assert.ok(seen.size > 30, `expected varied decks, got ${seen.size}`);
});

test("day 0 is launch day and counts up from there", () => {
  assert.equal(engine.dayNumber("2026-11-19"), 0);
  assert.equal(engine.dayNumber("2026-11-20"), 1);
  assert.equal(engine.dayNumber("2026-11-21"), 2);
  assert.equal(engine.dayNumber("2026-11-19") - engine.dayNumber("2026-11-18"), 1);
});

test("answer matching ignores case, punctuation, and articles", () => {
  const normalize = (s) => s.toLowerCase().replace(/^(the|a|an)\s/, "");
  assert.equal(normalize(engine.normalizeAnswer("  THE Moth!  ")), "moth");
  assert.equal(engine.normalizeAnswer("octo-pus"), "octo pus");
});

test("scoring follows the published rules", () => {
  const R = engine.RULES;
  assert.equal(R.correctAnswer, 650);
  assert.equal(R.flip, -100);
  assert.equal(R.burnHerring, 200);
  assert.equal(R.burnTrueClue, -150);
  assert.equal(R.wrongGuess, -50);
  assert.equal(R.floorAtZero, true);

  // 650 answer - 3x100 flips + 2x200 herrings = 750
  assert.equal(engine.scoreRound({ correct: true, flippedCount: 3, herringsBurned: 2, trueCluesBurned: 0, wrongGuesses: 0 }), 750);
  // scores never report negative values, even mid-round
  assert.equal(engine.scoreRound({ correct: false, flippedCount: 8, herringsBurned: 0, trueCluesBurned: 0, wrongGuesses: 2 }), 0);
  assert.equal(engine.scoreRound({ correct: false, flippedCount: 8, herringsBurned: 0, trueCluesBurned: 1, wrongGuesses: 1 }), 0);
});

test("flipping every card cuts fish by 80% but not score", () => {
  const R = engine.RULES;
  assert.equal(R.fullRevealFishMultiplier, 0.2);
  assert.equal(engine.isFullReveal(7, 8), false);
  assert.equal(engine.isFullReveal(8, 8), true);
  assert.equal(engine.isFullReveal(0, 0), false, "empty boards cannot be revealed");
  assert.equal(engine.fishMultiplier(7, 8), 1);
  assert.equal(engine.fishMultiplier(8, 8), 0.2);

  const normal = { correct: true, flippedCount: 3, herringsBurned: 2, trueCluesBurned: 0, wrongGuesses: 0 };
  const revealed = Object.assign({}, normal, { flippedCount: 8 });
  assert.equal(engine.scoreRound(normal), 750);
  assert.equal(engine.scoreRound(revealed), 250, "the 8 flip point costs still apply");
  assert.equal(engine.scoreRound(normal) * 0.1, 75);
  assert.equal(engine.scoreRound(revealed) * 0.1 * engine.fishMultiplier(8, 8), 5);
});

test("share text contains the result grid", () => {
  const text = engine.shareText({
    day: 42, correct: true, answer: "Moth", score: 700,
    flippedCount: 3, herringsBurned: 2, trueCluesBurned: 0,
    cells: [
      { flipped: true, burned: true, isHerring: true },
      { flipped: true, burned: false, isHerring: false },
      { flipped: false, burned: false, isHerring: true }
    ]
  });
  assert.match(text, /Red Herring Day 42 ✅/);
  assert.match(text, /Moth — 700 points/);
  assert.match(text, /🔥🟨⬛/);
});

test("share text flags the full-reveal fish cut", () => {
  const base = {
    day: 42, correct: true, answer: "Moth", score: 250,
    flippedCount: 8, herringsBurned: 2, trueCluesBurned: 0, cells: []
  };
  const text = engine.shareText(Object.assign({}, base, { fullReveal: true }));
  assert.match(text, /👁 FULL REVEAL · FISH −80%/);

  const practice = engine.shareText(Object.assign({}, base, {
    fullReveal: true, practice: true
  }));
  assert.match(practice, /👁 FULL REVEAL$/m);
  assert.match(practice, /🏋 PRACTICE · NO FISH/);
});

test("arcade modes pay less than daily and scale with difficulty", () => {
  assert.deepEqual(engine.ARCADE_MODES.map((m) => m.herrings), [1, 2, 3, 4, 5, 6]);
  const pays = engine.ARCADE_MODES.map((m) => m.payout);
  assert.deepEqual(pays, [...pays].sort((a, b) => a - b), "payouts must rise with difficulty");
  assert.equal(pays[0], 0.02);
  assert.equal(pays[pays.length - 1], 0.075);
  assert.ok(pays.every((p) => p <= 0.075), "no arcade mode may out-pay daily (0.10)");
  assert.ok(engine.ARCADE_MODES.every((m) => m.introChance > 0 && m.introChance <= 1),
    "every mode needs a valid intro frequency");
});

test("only FRENZY and EXTREME have a timer", () => {
  const limits = Object.fromEntries(engine.ARCADE_MODES.map((m) => [m.id, m.timeLimit]));
  assert.deepEqual(limits, { easy: 0, rookie: 0, medium: 0, hard: 0, frenzy: 60, extreme: 45 });
  for (const mode of engine.ARCADE_MODES) {
    const deck = engine.buildArcadePuzzle(puzzles.CATALOG, puzzles.PUZZLE_VERSION, mode.id, 1);
    assert.equal(deck.timeLimit, mode.timeLimit);
  }
});

test("every arcade mode deals its promised number of wrong clues", () => {
  for (const mode of engine.ARCADE_MODES) {
    for (let i = 0; i < 25; i++) {
      const deck = engine.buildArcadePuzzle(puzzles.CATALOG, puzzles.PUZZLE_VERSION, mode.id, `seed-${i}`);
      assert.equal(deck.mode, mode.id);
      assert.equal(deck.modeName, mode.name);
      assert.equal(deck.herringTotal, mode.herrings);
      assert.equal(deck.payout, mode.payout);
      assert.equal(deck.cards.filter((c) => c.isHerring).length, mode.herrings);
      assert.equal(deck.cards.filter((c) => !c.isHerring).length, 8 - mode.herrings);
      assert.equal(new Set(deck.cards.map((c) => c.text)).size, deck.cards.length);
      assert.equal(deck.cards.length, 8);
    }
  }
});

test("house rules cover the new effects", () => {
  const byId = Object.fromEntries(engine.ARCADE_TWISTS.map((t) => [t.id, t]));
  assert.ok(byId.nope && byId.nope.noZoom === true);
  assert.ok(byId.double && byId.double.wrongPenalty === -100);
  assert.ok(byId.noburn && byId.noburn.noBurn === true);
  assert.equal(engine.scoreRound({ wrongGuesses: 2, wrongPenalty: -100, floor: false }), -200);
});

test("dev tools can pin an arcade word", () => {
  const deck = engine.buildArcadePuzzle(puzzles.CATALOG, puzzles.PUZZLE_VERSION, "hard", 42, { answer: "Alarm clock" });
  assert.equal(deck.answer, "Alarm clock");
  assert.equal(deck.cards.filter((c) => c.isHerring).length, 4);
  const loose = engine.buildArcadePuzzle(puzzles.CATALOG, puzzles.PUZZLE_VERSION, "hard", 42);
  assert.ok(loose.answer, "untimed arcade still picks a word");
});

test("arcade seeds are repeatable but each replay changes the deck", () => {
  const a = engine.buildArcadePuzzle(puzzles.CATALOG, puzzles.PUZZLE_VERSION, "hard", 1234);
  const b = engine.buildArcadePuzzle(puzzles.CATALOG, puzzles.PUZZLE_VERSION, "hard", 1234);
  assert.deepEqual(a, b);
  const seen = new Set();
  for (let i = 0; i < 30; i++) {
    const deck = engine.buildArcadePuzzle(puzzles.CATALOG, puzzles.PUZZLE_VERSION, "medium", i);
    seen.add(deck.answer + "|" + deck.cards.map((c) => c.text).join("|"));
  }
  assert.ok(seen.size > 20, `expected varied arcade decks, got ${seen.size}`);
});

test("dev words no longer need hand-written herrings", () => {
  const devEntry = {
    answer: "Testword",
    clues: [
      { text: "My first dev clue is true.", true: true },
      { text: "My second dev clue is true.", true: true },
      { text: "My third dev clue is true.", true: true },
      { text: "My fourth dev clue is true.", true: true },
      { text: "My fifth dev clue is true.", true: true },
      { text: "My sixth dev clue is true.", true: true }
    ]
  };
  const catalog = puzzles.CATALOG.concat(devEntry);
  assert.deepEqual(engine.validateCatalog(catalog), []);
  const deck = engine.buildArcadePuzzle(catalog, puzzles.PUZZLE_VERSION, "extreme", 9);
  assert.equal(deck.cards.filter((c) => c.isHerring).length, 6);
});

test("arcade twists are valid and live in their own guaranteed section", () => {
  const twists = engine.ARCADE_TWISTS;
  assert.ok(Array.isArray(twists) && twists.length >= 5);
  assert.equal(new Set(twists.map((t) => t.id)).size, twists.length, "twist ids must be unique");
  assert.equal(twists.find((t) => t.id === "standard").payout, 1);
  assert.ok(engine.ARCADE_EVENTS.some((e) => e.id === "twisted" && e.twists), "TWISTED guarantees house rules");
  assert.ok(engine.ARCADE_EVENTS.filter((e) => !e.twists).length >= 2, "normal sections stay clean");
  assert.ok(twists.some((t) => t.id === "gift"), "TWISTED keeps a festive twist");
  assert.ok(twists.filter((t) => t.timed).every((t) => t.timeCut > 0), "timed twists must cut clock time");
  assert.ok(twists.filter((t) => t.sudden).every((t) => t.payout > 1.5), "risky twists must pay more");
  assert.ok(twists.find((t) => t.id === "fade").payout > twists.find((t) => t.id === "jackpot").payout,
    "the memory twist must pay more than a lucky one");
  assert.ok(twists.every((t) => !t.blind), "hiding irrelevant card numbers is not a real challenge");
  assert.ok(twists.every((t) => t.short), "every twist needs a compact in-game chip");
});

test("practice section is a no-fish event with full setup", () => {
  const practice = engine.ARCADE_EVENTS.find((e) => e.id === "practice");
  assert.ok(practice, "PRACTICE section must exist");
  assert.equal(practice.practice, true, "practice pays no fish");
  assert.equal(practice.twists, true, "practice can roll or pin a twist");

  const text = engine.shareText({
    practice: true, modeName: "PRACTICE · MEDIUM", correct: true,
    answer: "Bicycle", score: 650, cells: [], herringsBurned: 0,
    trueCluesBurned: 0, flippedCount: 0
  });
  assert.match(text, /PRACTICE · NO FISH/);
});

test("answer aliases only snap to true short forms in the current pool", () => {
  assert.equal(engine.resolveAnswerAlias("bike", [{ answer: "Bicycle" }]), "Bicycle");
  assert.equal(engine.resolveAnswerAlias("cycle", [{ answer: "Bicycle" }]), "Bicycle");
  assert.equal(engine.resolveAnswerAlias("santa", [{ answer: "Santa Claus" }]), "Santa Claus");
  assert.equal(engine.resolveAnswerAlias("xmas tree", [{ answer: "Christmas Tree" }]), "Christmas Tree");
  assert.equal(engine.resolveAnswerAlias("nativity", [{ answer: "Nativity Scene" }]), "Nativity Scene");
  assert.equal(engine.resolveAnswerAlias("bike", [{ answer: "Bus" }]), null, "no alias for an absent answer");
  assert.equal(engine.resolveAnswerAlias("bike", []), null);

  // Related but separate objects are not abbreviations.
  const unrelated = [
    ["tooth", "Toothbrush"],
    ["paint", "Paintbrush"],
    ["tree", "Christmas Tree"],
    ["xmas", "Christmas Tree"],
    ["candy", "Candy Cane"],
    ["globe", "Snow Globe"],
    ["pie", "Mince Pie"],
    ["card", "Christmas Card"]
  ];
  for (const [short, answer] of unrelated) {
    assert.equal(engine.resolveAnswerAlias(short, [{ answer }]), null, `"${short}" is not "${answer}"`);
  }
  assert.equal(engine.resolveAnswerAlias("turkey", [{ answer: "Roast Turkey" }]), "Roast Turkey");
});

test("close guesses snap distinctive words and hint at generic ones", () => {
  const pool = [{ answer: "Roast Turkey" }, { answer: "Christmas Tree" }];
  const snap = engine.findCloseAnswer("turkey", pool);
  assert.equal(snap && snap.answer, "Roast Turkey");
  assert.equal(snap.auto, true, "a distinctive single word completes the full answer");

  const hint = engine.findCloseAnswer("roast", pool);
  assert.equal(hint && hint.answer, "Roast Turkey");
  assert.equal(hint.auto, false, "a generic word only earns a hint");
  assert.match(hint.hint, /2 WORDS/);
  assert.match(hint.hint, /R\u2026 T\u2026/);

  const treeHint = engine.findCloseAnswer("tree", pool);
  assert.equal(treeHint && treeHint.answer, "Christmas Tree");
  assert.equal(treeHint.auto, false, "tree is still not Christmas Tree");
  assert.equal(engine.findCloseAnswer("turkey", [{ answer: "Christmas Tree" }]), null);
});

test("recent arcade answers can be excluded from the pool", () => {
  const all = puzzles.CATALOG.map((entry) => engine.normalizeAnswer(entry.answer));
  const avoid = all.slice(0, all.length - 1);
  const deck = engine.buildArcadePuzzle(puzzles.CATALOG, puzzles.PUZZLE_VERSION, "medium", 7, { avoid });
  assert.equal(engine.normalizeAnswer(deck.answer), all[all.length - 1], "only non-avoided answer is left");
  const normal = engine.buildArcadePuzzle(puzzles.CATALOG, puzzles.PUZZLE_VERSION, "medium", 7);
  assert.ok(normal.answer, "empty avoid list still deals normally");
});

test("arcade share text uses the mode name and its herring total", () => {
  const text = engine.shareText({
    modeName: "EXTREME", herringTotal: 6, correct: true, answer: "Moth", score: 500,
    flippedCount: 2, herringsBurned: 3, trueCluesBurned: 0, cells: []
  });
  assert.match(text, /Red Herring Arcade · EXTREME ✅/);
  const twisted = engine.shareText({
    modeName: "CHRISTMAS · MEDIUM", twistName: "GIFT DROP", correct: true, answer: "Ornament",
    score: 500, flippedCount: 2, herringsBurned: 3, trueCluesBurned: 0, cells: []
  });
  assert.match(twisted, /🎲 HOUSE RULE · GIFT DROP/);
  assert.match(text, /🔥 3\/6 herrings burned/);
});
