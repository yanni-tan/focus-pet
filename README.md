# Focus Pet 🐾

A cozy focus/pomodoro app with an illustrated companion. Pick a cat or dog, name
them, and start a focus session — your pet happily works on their own little
project (painting or gardening) while you work on yours. Wander off for too long
and they get curious → concerned → impatient → upset, a gentle nudge to come
back. Finish the session and the pet celebrates; their finished piece is saved to
your gallery.

Built to the spec in `focus-pet-PRD.md` (kept in `~/Downloads`).

## Run locally

ES modules need to be served over http (not `file://`):

```bash
cd "Focus Pet"
python3 -m http.server 8000
```

Then open http://localhost:8000.

## How it works

- **No build, no backend, no account.** Vanilla ES modules + CSS. Everything is
  local (`localStorage`); artifacts store a seed and render deterministically.
- **Timestamp-based timer** (`store.js`): `elapsed = now - startedAt - totalPausedMs`.
  Robust against background-tab throttling; the tick loop only refreshes the UI.
- **Emotional escalation** is a pure function of how long you've been paused, so it
  stays correct even after the tab was backgrounded. Thresholds live in
  `js/config.js` and are trivially tunable.
- **App-exit detection** (`lib/visibility.js`) auto-pauses when the tab is hidden and
  recomputes the pet's mood on return. A web notification fires at the 5-min
  "upset" mark if you've granted permission (opt-in from Settings).
- **Wake Lock** keeps the screen awake while focusing.

## The art is swappable (the important bit)

All the pet art lives behind one component: `js/companion.js`. The rest of the app
only ever calls:

```js
companion.setState('impatient'); // §6.1 emotional state
companion.setProgress(0.6);       // 0..1, drives the painting/plant
```

v1 is layered SVG + CSS programmer-art. To ship real illustrations later, replace
**only** `companion.js` (e.g. drop in a Rive `.riv` whose state machine maps 1:1 to
the states below) — no other file changes.

### Companion states (the animation brief)

`idle · focusing · waiting · curious · concerned · impatient · upset · sulking ·
celebrating · farewell`

## File map

```
index.html
styles.css
js/
  config.js            constants: thresholds, presets, species, activities, copy
  store.js             single source of truth: timing, escalation, actions, stats
  companion.js         ← the swappable art layer (SVG cat/dog + artifact)
  app.js               router / screen shell
  lib/
    util.js            helpers: clock/duration format, seeded RNG, DOM builder
    persistence.js     localStorage load/save
    visibility.js      app-exit auto-pause
    notifications.js   come-back nudge
    wakeLock.js        keep screen awake
  screens/
    onboarding.js  home.js  focus.js  completion.js  gallery.js  profile.js  settings.js
```

## Not yet (future / out of scope per PRD §15)

Capacitor mobile wrap + local notifications, Rive/illustrated assets, more
activities & variants, cloud sync, ambient soundscapes, grace-day streaks.
