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
  theme-matched outline, text and icon color (HOW TO PLAY, SHOP, ACCOUNT). On
  landscape phones the menu keeps that normal stacked layout, just scaled down
  so the logo, stats, buttons and footer never overlap.
- **Catchable fish** — detailed pixel herrings spawn randomly across the menu
  in both directions. Red = +1 fish (84%), gold = +3 (10%), blue = +10 (5%),
  and a rainbow gradient herring = +25 (1%). The counter persists, and
  milestones trigger toasts. Red keeps the plucky catch blip, while blue, gold
  and rainbow each have their own brighter chime so rare catches sound distinct.
  A transparent PNG of the normal red fish is included as `red-fish.png`.
- **Economy** — earn fish by catching them and by finishing rounds: you receive
  **12% of your final score** in fish after a global **+20% fish bonus**.
  Daily rounds, arcade payouts and fish from codes all get the boost; the
  clickable menu fish keep their original +1/+3/+10/+25 rewards. Dev-tool fish
  and PRACTICE stay unchanged. Spend fish on card skins, card patterns, and
  board themes.
- **Arcade** — a third big menu button, locked until you finish that day's daily
  (a correct answer or giving up both count). It opens four sections: **DEFAULT**
  for the normal word pool, **CHRISTMAS** for a festive-only event pool,
  **TWISTED** where every round rolls a house rule, and **PRACTICE** where you
  pick the exact setup. DEFAULT and CHRISTMAS are clean rounds with no twist.
  The first three sections open the same six-mode difficulty picker; PRACTICE
  opens its own panel with **WORD** (any answer or random), **TWIST** (none,
  random, or a specific house rule), and **DIFFICULTY**. Those three are custom
  themed listboxes — bigger text, a glowing green menu with CRT scanlines,
  staggered option motion, and tags for festive words, twist payouts and wrong
  clue counts — instead of native OS dropdowns. They support mouse, touch and
  keyboard (↑/↓, Enter, Escape). More wrong clues means a harder deck and more
  fish, but every paying mode pays less than the daily. The rates below already
  include the +20% fish bonus:

  | Mode | Wrong clues | Fish | Timer | Intro chance |
  | --- | ---: | ---: | ---: | ---: |
  | EASY | 1 | 2.4% | — | 25% |
  | ROOKIE | 2 | 3.6% | — | 35% |
  | MEDIUM | 3 | 4.8% | — | 50% |
  | HARD | 4 | 7.2% | — | 65% |
  | FRENZY | 5 | 7.8% | 60s | 75% |
  | EXTREME | 6 | 9% (25% less than daily) | 45s | 85% |

  **PRACTICE** uses the same six difficulties but pays **0 fish** and never
  changes your daily streak, stats, or saved board. Its result screen says
  `PRACTICE · NO FISH EARNED`, and shared text is tagged `PRACTICE · NO FISH`.
  Instant replay remembers your exact word/twist/difficulty picks.

  The two hardest modes are against the clock: a large `mm:ss` clock sits above
  the deck with a draining progress bar. It shifts cyan → amber → orange → red,
  starts beeping once a second at 10 seconds, and adds a pulsing red vignette and
  `FINAL SECONDS!` warning under 5. Running out ends the round automatically
  (`TIME'S UP!`). Burning **every** card also ends the round automatically
  (`ALL BURNED!`) since no clues remain.

  Some rounds open with a quiet **5-second "get ready" card** showing the event
  and mode; in TWISTED and PRACTICE it also shows the chosen house rule in full.
  It is deliberately understated — a thin accent line, soft colours and a quick
  fade — and gets rarer on the modes you replay most, so starting a round stays
  snappy. A slim progress bar counts down, then the card slips away with a small
  `LET'S GO`. You can skip it with the ✕, **SKIP INTRO**, or Escape, and the round
  clock only starts once the board is visible, so no time is lost. Clean sections
  hide the house-rule panel entirely; in TWISTED and PRACTICE, a readable chip
  above the deck keeps the short version and payout in view.

  **TWISTED** rolls a **house rule**; **PRACTICE** lets you pin one, roll one, or
  skip it. Each one either makes the round
  genuinely harder or is an honestly labelled lucky round — no fake challenges:

  | Twist | Effect | Fish |
  | --- | --- | ---: |
  | JACKPOT | Lucky round | ×1.5 |
  | ONE STRIKE | One wrong guess ends it | ×2 |
  | RUSH HOUR | Timed modes only, −15s | ×1.8 |
  | FADE OUT | Clues fade 3s after flipping — remember them | ×2 |
  | GIFT DROP | Festive gift | ×1.5 |

  Twists never change the published scoring rules; they only adjust the fish
  payout and the play shown on the badge.

  Arcade rounds are endless and replayable with a fresh deck each time, and the
  last four answers are remembered so the same word isn't dealt back-to-back.
  They pay
  fish but never touch your daily streak, played count, win rate or best score,
  and they never overwrite the saved daily board. The unlock is remembered for
  the rest of the day (`red-herring:v1:arcade`) and resets at midnight.
- **Shop** — four tabs: **CARD SKINS** (14), **PATTERNS** (10), **THEMES** (14),
  and **EVENT**. Every tab opens with an **OWNED** shelf, so event purchases stay
  visible in the normal tabs with a small **EVENT** badge even if the event tab is
  gone later. The EVENT tab splits its owned shelf into separate CARD SKINS,
  PATTERNS and THEMES rows. All items are sorted by price. The free starting theme is **Classic**
  — a brighter plain red/white/black starter look with no glow or aurora. New
  permanent cosmetics include **Chrome**, **Copper**, **Aurora** and **Sunburst**.
  The **EVENT** tab is a snowy, limited winter shelf with three festive card skins,
  three patterns and three themes (Frostlit, Evergreen, Gingerbread). Event gear
  remains equippable forever once bought. The three tabs preview in three
  different ways: card skins show a mini card back and front using the real skin,
  themes show a tiny menu screen in that theme's palette, and patterns show the
  real animated card-back design with a mini fish. Patterns change the card back
  independently of the skin and now inherit the equipped skin's colors, so event
  patterns recolor too. **Stripes** are clean diagonal ribbons while **Candy
  Wrap** is a wrapped sweet with twisted ends and a spinning center. **Grid**,
  **Waves**, **Dots**, **Snowflakes** and **Fairy Lights** use layered artwork
  and slower, smoother motion. The badge on the menu's SHOP button counts
  affordable items. Each skin recolors both the card and the fish on its back.
  Everything is saved
  to your profile. A fresh guest starts with **0 fish**
  and only the free Classic skin/theme plus Solid pattern; the large fish counts
  and unlocked event gear seen during testing were temporary test data. New
  accounts inherit guest progress.
- **Accounts** — create an email/password account, log in with email or Google,
  and edit your name and profile picture. Pick a preset pixel avatar or upload
  your own image (downscaled before saving). In cloud mode the ACCOUNT panel
  shows a sync status and a **SYNC NOW** button so progress can be pulled from
  the cloud at any time. See `CONFIGURATION` below.
- **Card deck** — a tidy grid of up to four cards per row (two on phones),
  centered after each burn. Tap any flipped card to enlarge it full-screen.
- **Pixel burn effect** — the card breaks into a grid of tiny pixels that fly
  off bottom row first, then the card dissolves upward like disintegrating
  pixel art.
- **Real herrings** — false clues are borrowed from the true clues of *other*
  questions, so they feel believable. About 25% of rounds take all three from
  the same other question to create a convincing fake identity.
- **Puzzle pool** — 43 answers with six true clues and four herrings each; the
  date seed deals 5 truths + 3 herrings per daily round. Arcade picks a random
  answer from a fresh seed and deals the mode's number of herrings instead. The
  Christmas event uses its own separate 34-word festive catalog and never
  mixes into the daily pool. New entries are only ever appended so old daily
  puzzles and streaks stay exactly the same.
- **Polish** — springy eased animations, a lift-and-glow card hover with glossy
  shine and pointer tilt, floating score popups, a brief green/red screen flash
  on correct/wrong answers, result stamp and count-up, and 8-bit Web Audio
  sounds.
- **Answer assist** — pause after typing (or leave the box) and a close
  spelling from the current round's real answer pool quietly replaces the typo
  so a missed key does not cost a wrong guess. True short forms work too
  (`bike` → `Bicycle`, `santa` → `Santa Claus`, `turkey` → `Roast Turkey`), but
  only when that answer is actually in the current round's pool. A distinctive
  single word from a two-word answer snaps to the full name; a generic word such
  as `roast` or `tree` instead earns a free **CLOSE!** hint with masked initials
  and costs no wrong guess. A related but different word still will not count —
  `tooth` is not `Toothbrush`, `paint` is not `Paintbrush`, and `tree` is not
  `Christmas Tree`. Default and Twisted arcade use the normal catalog, Christmas
  arcade uses the festive catalog, and Practice can draw from either.

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
- **Publish the Firestore rules below.** This is the step people miss: leaving
  the default "deny all" rules lets you log in but silently blocks all sync, so
  each device keeps its own progress. The ACCOUNT panel then shows
  **SYNC FAILED** with the exact error.
- Set Firestore rules so users can only touch their own save, and let the game
  record code redemptions:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /codeUses/{code} {
      allow read: if true;
      allow create, update: if
        request.resource.data.keys().hasOnly(['code', 'count', 'updated']) &&
        request.resource.data.code == code &&
        request.resource.data.count is int &&
        request.resource.data.count >= 0;
      allow delete: if false;

      match /claims/{claimId} {
        allow read: if true;
        allow create: if
          request.resource.data.keys().hasOnly(['id', 'code', 'owner', 'at']) &&
          request.resource.data.id == claimId &&
          request.resource.data.code == code &&
          claimId.matches('^[A-Za-z0-9_-]{3,80}$');
        allow update, delete: if false;
      }
    }
  }
}
```

The `codeUses` rules let signed-in players and guests share one worldwide
counter per code. They are public because this is a game reward, not private
player data. Guests are tracked by a generated install id stored in their
browser; signed-in players are tracked by their account uid.

The config keys are public by design — security comes from the rules, not from
hiding them. If the config is missing or SDK loading fails, the game falls back
to **local-browser accounts**: create/login/edit still works on that device,
but there is no cross-device sync. The menu shows which mode is active
(`LOCAL · GUEST`, etc.).

**Cross-device sync checklist:** `config.js` must contain the Firebase keys,
Email/Password sign-in must be enabled, and the Firestore rules above must be
published. Sign in with the **same email** on both devices. On sign-in the game
automatically pulls the cloud save before showing your profile; you can also
tap **SYNC NOW** any time. If the status says **SYNC FAILED**, the Firestore
rules are almost certainly still denying access — fix them and reload.

### Private dev fish tool

For testing shops/themes, open **Settings → CODES**, enter `RHDEV2026`, and
press **REDEEM CODE**. Codes are never claimed just by typing — the button is
required. A DEV bar appears at the top of the shop with +100 / +1K / +10K fish
and an "unlock all items" button. Change
`DEV_CODE` near the top of `app.js` before publishing to make it your own.

The CODES tab only holds the code field, the redeem button, the one-time
release reward and the permanent unlock-all reward — there is no word picker or
"play a word" panel. When dev mode is on it just points you to the shop, where
the free-fish tools live. Code and login fields and buttons use the same roomier
sizing throughout.

**Dev changes never save to your profile.** They live in a memory-only copy of
your progress, so fish, unlocks, stats and board state earned in dev mode vanish
when you press **HIDE** in the shop's DEV bar or reload the page. Hiding dev
tools restores the real saved board, and dev mode opens the Arcade button
immediately so every mode can be tested. Picking words for yourself now lives
in **Arcade → PRACTICE**, which pays no fish.

### Codes

Enter a code in **Settings → CODES** and press **REDEEM CODE**:

- `RHDEV2026` — private, temporary dev tools in the shop.
- `RELEASE` — one-time **175 base fish**, which becomes **+210 fish** after the
  global +20% fish bonus.
- `BONUS` — one-time **125 base fish**, which becomes **+150 fish** after the
  global +20% fish bonus.
- `givemeeverythingplease` — permanently unlocks every shop item: all skins,
  themes, patterns and event cosmetics. It can be entered again later if new
  items are added. It does not change your fish, stats or daily progress.

Codes are case-insensitive. Dev mode must be hidden before a reward code can be
claimed.

To add another code, add one entry to the `CODES` object near the top of
`app.js`:

```js
// One claim per account, and only 100 claims worldwide:
MYCODE: {
  once: true,
  uses: 100,
  fish: 50,
  sound: "coin",
  message: (n) => "+" + n + " FISH!"
}
```

Options:

- `fish: N` grants N fish with the +20% bonus.
- `unlockAll: true` unlocks every shop item.
- `dev: true` reveals dev tools (never counted or globally limited).
- `sound` and `message` control the popup.
- `once: true` means **one claim per profile/account**. Leave it out to let the
  same profile redeem again later (like `givemeeverythingplease`).
- `uses: N` means **only N total redemptions worldwide**. Every redemption,
  including repeat redemptions, spends one use.
- Omit `uses`, or set `unlimited: true`, for **unlimited worldwide uses**.

So `BONUS` with `once: true` and no `uses` can be claimed once per account by
any number of accounts. A code with `once: true, uses: 100` can be claimed once
per account, but only by the first 100 accounts. A code with `uses: 100` and no
`once` lets any account redeem repeatedly until the 100 uses are gone.

Worldwide limits use Firestore (`codeUses/{code}`), so publish the rules shown
above. They need to be published only once; adding new codes does not need a
rules change. Unlimited codes never touch Firestore — they use a local counter
plus the normal synced profile save for `once: true`. A capped code refuses to
pay out if Firestore is unavailable, rather than risk over-issuing it.

`index.html` now loads local CSS/JS with a fresh query on every page load. You
do **not** need to type `?v=2`, bump a version, or wait for the 10-minute GitHub
Pages cache when you edit a code. You may need one final hard refresh
(`Ctrl+Shift+R` / `Cmd+Shift+R`) to pick up this new `index.html`; after that,
normal reloads always fetch your latest code.

## Storage

`localStorage` keys under `red-herring:v1:*` hold today's board, stats, sound
preference, fish count, local accounts/session, and a cache of cloud data.
Signed-in profiles are stored in Firestore at `users/{uid}`. Code redemptions
are stored at `codeUses/{code}` with one `claims/{claimId}` document per use.

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
