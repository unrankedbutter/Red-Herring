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
fixed catalog version.

## Features

- **Full-screen, mobile-first layout** — menu and game both fill the viewport
  (`100dvh`), safe-area aware, with internal scrolling on small screens.
- **Main menu** — animated aurora, perspective grid, sparks, neon logo, and a
  daily stat bar (streak / played / win rate / best). Two main square actions
  (PLAY, SETTINGS — with a gear-outline icon) and three compact tools, each with
  its own theme-matched outline, text and icon color (HOW TO PLAY, SHOP, ACCOUNT).
- **Catchable fish** — detailed pixel herrings spawn randomly across the menu
  in both directions. Red = +1 fish (84%), gold = +3 (10%), blue = +10 (5%),
  and a rainbow gradient herring = +25 (1%). The counter persists, and
  milestones trigger toasts.
- **Economy** — earn fish by catching them and by finishing rounds: you receive
  **10% of your final score** in fish. Spend them in the shop on card skins and
  board themes.
- **Shop** — buy and equip six card skins and six themes, sorted by price.
  The badge on the menu's SHOP button counts how many items you can afford.
  Each skin recolors both the card and the fish on its back. Everything is saved
  to your profile. New accounts inherit guest progress.
- **Accounts** — create an email/password account, log in, edit your name and
  profile picture, or sign in with Google. Pick a preset pixel avatar or upload
  your own image (downscaled before saving). See `CONFIGURATION` below.
- **Card deck** — a tidy grid of up to four cards per row (two on phones),
  centered after each burn. Tap any flipped card to enlarge it full-screen.
- **Real burn effect** — the bottom of the card burns away first: a glowing
  flame line climbs upward as the card chars and dissolves, with smoke and ash.
- **Real herrings** — false clues are borrowed from the true clues of *other*
  questions, so they feel believable. About 25% of rounds take all three from
  the same other question to create a convincing fake identity.
- **Puzzle pool** — 23 answers with six true clues and four herrings each; the
  date seed deals 5 truths + 3 herrings per round.
- **Polish** — springy eased animations, glossy card shine, pointer tilt,
  floating score popups, a brief green/red screen flash on correct/wrong
  answers, result stamp and count-up, and 8-bit Web Audio sounds.

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

For testing shops/themes, open **Settings → CODES** and enter `RHDEV2026`
(you can also type it anywhere in the game). A DEV bar appears at the top of the
shop with +100 / +1K / +10K fish and an "unlock all items" button. Change
`DEV_CODE` near the top of `app.js` before publishing to make it your own.

**Dev changes never save.** They live in a memory-only copy of your progress, so
fish, unlocks, stats and board state earned in dev mode vanish when you press
**HIDE DEV TOOLS** (in the shop bar or Settings → CODES) or reload the page.

The CODES tab also has a **dev word editor**: add an answer with 5+ true clues
and 3+ herring clues (one per line) to test custom puzzles. Those words are
in-memory too and disappear when dev tools are hidden or the page reloads. If
today's round is already finished, new words apply from the next round.

### Release code

Enter `RELEASE` in **Settings → CODES** (or type it anywhere) to claim **+125
fish**. It is a one-time reward saved to your profile, unlike the temporary dev
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
