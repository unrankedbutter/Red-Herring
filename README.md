# RED HERRING

A daily pixel-arcade deduction game. Eight clue cards — five true, three red
herrings. Flip what you dare, burn the cards you think are lies, then guess the
1–2 word answer. One round per day, same puzzle for everyone.

Plain HTML/CSS/JS. No build step.

## Play locally

Open `index.html` in a browser, or serve the folder with any static server.

## Deploy to GitHub Pages

1. Push this folder's contents to a GitHub repo (files at the repo root).
2. **Settings → Pages → Build and deployment**.
3. Source: **Deploy from a branch** → `main` / `/root` → Save.
4. Live at `https://<username>.github.io/<repo>/`.

Everyone gets the same deck because the puzzle is derived from the date plus a
fixed catalog version. The menu and game show `DAY <number>` instead of a round
number: launch day (2026-11-19) is `DAY 0`, the next day is `DAY 1`, and so on.
Consecutive days never reuse the same answer.

## Features

- **Full-screen, mobile-first layout** — menu and game both fill the viewport
  (`100dvh`), safe-area aware, with internal scrolling on small screens. The
  browser's default scrollbar is hidden everywhere (scrolling still works).
- **Overlays** — Shop, Settings, Account, Arcade, Rules, Result and card zoom
  each have a detailed pixel **✕** button in the corner. The big CLOSE/DONE
  buttons at the bottom are gone, and clicking the dark backdrop no longer
  closes anything; use the ✕ or Escape.
- **Main menu** — animated aurora, perspective grid, sparks, neon logo, and a
  daily stat bar (streak / played / win rate / best). Two main actions (PLAY,
  SETTINGS — with a detailed 8-tooth pixel cog that turns when you hover it), a
  big **ARCADE** button underneath, and three compact tools, each with its own
  theme-matched outline, text and icon color (HOW TO PLAY, SHOP, ACCOUNT).
- **Catchable fish** — detailed pixel herrings spawn randomly across the menu
  in both directions. Red = +1 fish (84%), gold = +3 (10%), blue = +10 (5%),
  and a rainbow gradient herring = +25 (1%). The counter persists, and
  milestones trigger toasts.
- **Economy** — earn fish by catching them and by finishing rounds: you receive
  **10% of your final score** in fish. Spend them on card skins, card patterns,
  and board themes.
- **Arcade** — a third big menu button, locked until you finish that day's daily
  (a correct answer or giving up both count). It opens two sections: **DEFAULT**
  for the normal word pool and **CHRISTMAS** for a festive-only event pool.
  Either section opens the same six-mode difficulty picker. More wrong clues
  means a harder deck and more fish, but every mode pays less than the daily:

  | Mode | Wrong clues | Fish | Timer |
  | --- | ---: | ---: | ---: |
  | EASY | 1 | 2% | — |
  | ROOKIE | 2 | 3% | — |
  | MEDIUM | 3 | 4% | — |
  | HARD | 4 | 6% | — |
  | FRENZY | 5 | 6.5% | 60s |
  | EXTREME | 6 | 7.5% (25% less than daily) | 45s |

  The two hardest modes are against the clock: the game footer becomes `TIME
  LEFT` with a live `mm:ss` counter that flashes red in the last 10 seconds.
  Running out ends the round automatically (`TIME'S UP!`). Burning **every**
  card also ends the round automatically (`ALL BURNED!`) since no clues remain.

  Arcade rounds are endless and replayable with a fresh deck each time. They pay
  fish but never touch your daily streak, played count, win rate or best score,
  and they never overwrite the saved daily board. The unlock is remembered for
  the rest of the day (`red-herring:v1:arcade`) and resets at midnight.
- **Shop** — three tabs: **CARD SKINS** (9), **PATTERNS** (7), and **THEMES** (9),
  all sorted by price. The free starting theme is **Classic** — a brighter plain
  red/white/black starter look with no glow or aurora. **Midnight** is the paid
  blue night theme and **Crimson** is dark wine with hot magenta. Patterns change
  the card-back design independently of the skin, including a smooth **Gradient**
  option. The badge on the menu's SHOP button counts how many items you can afford.
  Each skin recolors both the card and the fish on its back. Everything is saved
  to your profile. New accounts inherit guest progress.
- **Accounts** — create an email/password account, log in, edit your name and
  profile picture, or sign in with Google. Pick a preset pixel avatar or upload
  your own image (downscaled before saving). See `CONFIGURATION` below.
- **Card deck** — a tidy grid of up to four cards per row (two on phones),
  centered after each burn. Tap any flipped card to enlarge it full-screen.
- **Pixel burn effect** — the card breaks into a grid of tiny pixels that fly
  off bottom row first, then the card dissolves upward like disintegrating
  pixel art.
- **Real herrings** — false clues are borrowed from the true clues of *other*
  questions, so they feel believable. About 25% of rounds take all three from
  the same other question to create a convincing fake identity.
- **Puzzle pool** — 23 answers with six true clues and four herrings each; the
  date seed deals 5 truths + 3 herrings per daily round. Arcade picks a random
  answer from a fresh seed and deals the mode's number of herrings instead. The
  Christmas event uses its own separate 14-word festive catalog and never
  mixes into the daily pool.
- **Polish** — springy eased animations, glossy card shine, pointer tilt,
  floating score popups, a brief green/red screen flash on correct/wrong
  answers, result stamp and count-up, and 8-bit Web Audio sounds.
- **Answer assist** — pause after typing (or leave the box) and a close
  spelling from the current round's real answer pool quietly replaces the typo
  so a missed key does not cost a wrong guess. Default arcade uses the normal
  catalog plus dev words, and Christmas arcade uses the festive catalog.

## Rules & scoring

| Action | Points |
| --- | ---: |
| Correct answer | +650 |
| Flip a card | −100 |
| Burn a red herring | +200 |
| Burn a real clue | −150 |
| Wrong guess | −50 |

Scores never go below zero — both the live and final scores are floored at zero.
A correct answer ends the round. Burning is optional but is where the bonus
points are.

## Configuration (accounts + cloud saves)

Open `config.js` and paste your Firebase web-app config into
`window.RedHerringConfig.firebase`:

- Create a project at <https://console.firebase.google.com>.
- Enable **Authentication → Sign-in method → Email/Password** and **Google**.
- Create a **Firestore** database.
- Add your GitHub Pages domain under **Authentication → Settings → Authorized
  domains**, or Google sign-in will be blocked.
- Set Firestore rules so users can only touch their own document:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

The config keys are public by design — security comes from the rules, not from
hiding them. If you leave the config blank, the game falls back to
**local-browser accounts**: create/login/edit still works on that device, but
there is no Google sign-in and no cross-device sync. The menu shows which mode
is active (`LOCAL · GUEST`, etc.).

**Bottom line on accounts:** right now the repo has blank Firebase keys, so
accounts do **not** work across devices. Follow the steps above, fill in
`config.js`, enable both sign-in methods, authorize your GitHub Pages domain,
and redeploy to switch the menu to `CLOUD` mode and get real cross-device
login/sync. Firebase keys are required — there is no way to sync across devices
from a static page with only `localStorage`.

### Private dev fish tool

For testing shops/themes, open **Settings → CODES**, enter `RHDEV2026`, and
press **REDEEM CODE**. Codes are never claimed just by typing — the button is
required. A DEV bar appears at the top of the shop with +100 / +1K / +10K fish
and an "unlock all items" button. Change
`DEV_CODE` near the top of `app.js` before publishing to make it your own.

**Dev changes never save to your profile.** They live in a memory-only copy of
your progress, so fish, unlocks, stats and board state earned in dev mode vanish
when you press **HIDE DEV TOOLS** (in the shop bar or Settings → CODES) or reload
the page. The one exception is the temporary "play tomorrow" word, which is kept
in its own dev key so it can survive the midnight reload.

The CODES tab keeps things clean: the code field is centred, wide, and there is
no helper text or "what this code does" row underneath it. Code and login fields
and buttons use the same roomier sizing throughout. The **dev word editor** only
asks for an answer and 5+ true clues (one
per line) — herrings are borrowed from other words' real clues automatically, so
the old hand-written herring box is gone. Those words are in-memory too and
disappear when dev tools are hidden or the page reloads.

Dev mode removes the one-round-per-day cooldown. The **WORD** dropdown offers
every catalog answer (including dev-added words) plus **🎲 RANDOM WORD**, and a
**DIFFICULTY** dropdown lets you play that word as the daily or as any arcade
mode (including the timed ones). Then choose one of two actions:

- **PLAY FOR YOURSELF** — deal it immediately with no cooldown, using the chosen
  difficulty. The result screen gets a **PLAY AGAIN** button and countdowns read
  `DEV MODE · NO COOLDOWN` (or the arcade clock). Both dropdown choices are
  remembered while the panel is open.
- **PLAY WORD TOMORROW** — make the chosen word (or a random pick) the next
  daily's answer. This is the one dev value that survives a reload so it works
  after midnight; it is still erased by **HIDE DEV TOOLS**.

A `NEXT DAILY · DAY n · WORD` chip appears on the menu and game screens while dev
tools are on, and the CODES panel shows the same preview (marked `DEV PICK` when
you have overridden it). Hiding dev tools restores the real saved round. Dev mode
also opens the Arcade button immediately so every mode can be tested.

### Release code

Enter `RELEASE` in **Settings → CODES** and press **REDEEM CODE** to claim
**+125 fish**. It is a one-time reward saved to your profile, unlike the temporary dev
tools. Dev mode must be hidden before a reward can be claimed.

## Storage

`localStorage` keys under `red-herring:v1:*` hold today's board, stats, sound
preference, fish count, local accounts/session, and a cache of cloud data.
Signed-in profiles are stored in Firestore at `users/{uid}`.

## How the daily puzzle works

`engine.js` hashes `<catalog version>|<YYYY-MM-DD>` into a seeded PRNG, then:

1. picks one answer from the catalog,
2. chooses 5 of its 6 true clues and 3 of its 4 herrings,
3. shuffles the 8 chosen clues into a random card order.

That's 24 distinct decks per answer without writing new clues.

## Adding puzzles

**Append** a new entry to `puzzles.js` with 6 true clues and 4 herrings:

```js
{
  answer: "Lantern",
  clues: [
    { text: "A true clue about a lantern.", true: true },
    // ... 6 true, 4 false
  ]
}
```

Herrings should be true of a believable *wrong* answer — that's what makes them
work. Never reorder, edit, or delete existing entries: that would rewrite old
daily puzzles and break streaks.

Tune point values in `RULES` in `engine.js`; the rules panel reads them
automatically.

## Tests

```bash
node --test tests/engine.test.js
```

## Files

```
index.html      menu, game, and all overlays
styles.css      pixel theme, animations, themes, skins, responsive layout
config.js       Firebase config (fill this in for real accounts)
backend.js      Firebase auth/data with local fallback
fish-svg.js     detailed pixel fish generator
shop-data.js    shop catalog and preset avatars
puzzles.js      answer catalog (the content)
engine.js       RNG, deck builder, scoring, validation, share text
app.js          screens, events, effects, economy, UI wiring
tests/          node:test suite
```
