const test = require("node:test");
const assert = require("node:assert/strict");

const puzzles = require("../puzzles.js");
const engine = require("../engine.js");

test("catalog is valid", () => {
  assert.deepEqual(engine.validateCatalog(puzzles.CATALOG), []);
  assert.ok(puzzles.CATALOG.length >= 10, "need a decent pool of answers");
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
    assert.ok(deck.day > 0);
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

test("day numbers are sequential from 2024-01-01", () => {
  assert.equal(engine.dayNumber("2024-01-01"), 1);
  assert.equal(engine.dayNumber("2024-01-02"), 2);
  assert.equal(engine.dayNumber("2026-11-18") - engine.dayNumber("2026-11-17"), 1);
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
  assert.match(text, /Red Herring #42 ✅/);
  assert.match(text, /Moth — 700 points/);
  assert.match(text, /🔥🟨⬛/);
});
