# EarForge 🎧

A browser-based ear-training game — no install, no signup (nickname optional), just open it and train. PWA — installable on your phone and playable offline.

## Modes

| Mode | Description |
|---|---|
| 🎵 Note ID | Guess the note by ear |
| 🎼 Intervals | Identify the interval between two notes |
| 🥁 BPM Tap | Guess the metronome tempo, with your own tap counter |
| 🎹 Key Detect | Identify the key from a chord progression |
| 🎸 Chords | Identify chord quality (major/minor/diminished/augmented/7th) |

Each mode has 3 difficulty levels (adaptive — they adjust to your accuracy) and a short explainer before its first run.

Beyond individual modes:

- 📚 **Session** — combine several modes into one mixed round set, with a summary and comparison to your last session.
- 🔁 **Weak Spots** — an auto-session built from whatever you currently mix up most (spaced repetition, `src/srs.ts`).
- 📖 **Guide** — a static page at `public/guide/` explaining the mechanics and terminology.
- ⚡ **Hacks** — `public/hacks/` with practical ear-training tips.
- 🏆 **Leaderboard** — optional, by nickname, with an optional password (see below).

Progress is saved in the browser (localStorage), per profile/nickname. UI is available in Ukrainian or English (switcher in the header).

## Development

```
npm install
npm run dev
```

## Build

```
npm run build
```

Output lands in `dist/`.

## Architecture (brief)

- `src/App.tsx` — thin wrapper (state via `useReducer`, screen routing).
- `src/constants.ts` — music theory (notes, intervals, chords), CSS animations, helpers.
- `src/i18n.ts` — ua/en translations (UI strings, mode text, tutorials).
- `src/audio.ts` — `useAudio()`, synthesis on plain Web Audio API (no Tone.js, deliberately — bundle size and stability on iOS Safari).
- `src/storage.ts` — all localStorage handling (profiles, progress, tutorial skip-state).
- `src/srs.ts` — spaced repetition (leaky-bucket weighting on answers), feeds both "Weak Spots" and the next-question choice within each mode.
- `src/reducer.ts` — XP/levels/streak/stats.
- `src/components/` — shared UI (Header, Menu, Login, Leaderboard, tutorial dialog, etc.).
- `src/modes/` — one file per mode, plus `Session.tsx` (mixed session / weak spots) and `ModeScreen.tsx` (single-mode wrapper with tutorial and adaptive difficulty).
- `server/leaderboard.js` — a separate self-hosted Node server (JSON file, no DB). Optional per-nickname password: the first POST with a password locks it in (sha256, no salt — deliberately lightweight for a purely-for-fun leaderboard); an empty password leaves the nickname open forever.
- `public/guide/`, `public/hacks/` — static pages outside the SPA build, linked from the menu in a new tab.
- PWA: `public/manifest.json` + `public/sw.js` (stale-while-revalidate; does not cache `/api/` or cross-origin requests).

Deployed under a subpath (`/earforge/`), so `vite.config.ts` sets `base: '/earforge/'`, and any API fetch goes through `import.meta.env.BASE_URL` (never hardcode `/api/...`).

## Hosting

Live at https://mandrock-tools.duckdns.org/earforge/ — static assets served via nginx on a Hetzner VPS; the leaderboard API is a separate Node process under pm2 (`earforge-api`, port 4173, JSON file instead of Vercel/Upstash), proxied via `/earforge/api/` → `127.0.0.1:4173`.

Deploy:

```
npm run build
cp -r dist/* /var/www/html/earforge/
# after changes to server/leaderboard.js:
cp server/leaderboard.js /root/earforge-api/ && pm2 restart earforge-api
```

See `PROMPT.md` for the full architecture context, decision history, and known gaps.
