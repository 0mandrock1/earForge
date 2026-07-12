# EarForge — agent prompt for further development

## What this is
A browser-based ear-training app (React + Vite + TS + Tailwind). Four modes:
Note ID, Intervals, BPM Tap, Key Detect — each with 3 difficulty levels.
Web Audio API synth (`useAudio` hook in `src/App.tsx`), localStorage progress,
optional global leaderboard backed by `server/leaderboard.js` (self-hosted,
JSON file — not Vercel/Upstash anymore).

Live at: https://mandrock-tools.duckdns.org/earforge/
Hosting: static `dist/` served by nginx on Hetzner VPS at
`/var/www/html/earforge/`; API is a plain Node http server managed by pm2
(`earforge-api`, port 4173), proxied at `/earforge/api/`.

## Architecture notes for whoever picks this up
- `src/App.tsx` is the single source of truth (~1150 lines, no component
  splitting yet — that's real tech debt, not a style choice).
- `useAudio()` is a hand-rolled Web Audio wrapper: oscillator + gain per note,
  linear ADSR-ish envelope in `_tone`. `playInterval` deliberately overlaps
  note1's release with note2's attack (see comment there) — don't "fix" the
  gap back in, it was intentional.
- i18n via `T` object (ua/en). Any new UI string needs both.
- Progress/profiles are localStorage only (`SK`/`TK`/`PK2`/`UK` keys); the
  leaderboard is opt-in/best-effort and fails silently offline.
- Deployed under a subpath (`/earforge/`), so `vite.config.ts` has
  `base: '/earforge/'` and any fetch to the API must use
  `import.meta.env.BASE_URL` — don't hardcode `/api/...`.

## Status: all 5 original gaps have been addressed
1. **Component split** — done. `src/` is now: `constants.ts` (music theory +
   CSS + helpers), `i18n.ts` (T + lang context), `audio.ts` (useAudio),
   `storage.ts` (localStorage), `srs.ts` (spaced repetition), `reducer.ts`,
   `components/common.tsx` (shared UI), `components/{Login,Menu,Leaderboard}.tsx`,
   `modes/{NoteId,Intervals,Bpm,Key,Chords,ModeScreen}.tsx`. `App.tsx` is now
   ~65 lines of pure orchestration.
2. **Spaced repetition** — `src/srs.ts`. Leaky-bucket weight per (mode, answer
   key): wrong +2 (capped at 5), correct -1, weight 0 = removed. `weightedPick`
   biases the next-question pick toward high-weight items (~11x more likely
   at max weight vs a clean item). Wired into noteId/intervals/key/chords via
   `recordResult()` in each mode's onPick handler. **Not** wired into BPM —
   the target is a continuous value, no stable discrete key to attach weight to.
3. **Chords mode** — `modes/Chords.tsx`, 5th mode. Qualities maj/min/dim/aug/
   maj7/dom7 (canonical order in `constants.ts` CHORDS, index-aligned across
   ua/en so language toggle doesn't break identity). Tier slicing: easy=3,
   medium=4, hard=6, same pattern as the other modes. Uses the new
   `audio.playChord(notes)` (N notes struck together).
4. **PWA/offline** — `public/manifest.json` + `public/sw.js` (stale-while-
   revalidate, skips `/api/` and cross-origin requests) + registration in
   `main.tsx`. Icons are generated placeholders (`public/icon-192.png`,
   `icon-512.png`) — swap for real artwork whenever, they're just solid-purple
   "EF" squares right now.
5. **Leaderboard auth** — optional both ways, enforced server-side in
   `server/leaderboard.js`. First POST for a nick claims it: empty password
   = open forever (anyone can post as that nick, no check, ever — this is
   the default/expected mode for casual use). Non-empty password = sha256
   hash stored, later POSTs must match or get 401. Client sends the locally-
   stored plaintext password over HTTPS on every submission; server never
   stores plaintext. This is deliberately lightweight (no salt, no rate
   limiting) — proportionate to a for-fun leaderboard, not a real auth system.

## Round 3: Session mode, Weak Spots, mnemonic hints, BPM compare, guide page
1. **Session mode** (`modes/Session.tsx`) — setup screen (pick modes, difficulty,
   round count 10/15/20/30) -> mixed-mode runner -> summary (per-mode accuracy delta,
   XP gained, ▲/▼ vs last session via `localStorage["earforge-last-session"]`).
   Each mode component now accepts an `onAdvance` prop: when set, "Next" hands
   control back to the session runner instead of generating another same-mode round.
   `SessionRunner` forces a remount per round via `key={idx}` so every mode always
   starts from a fresh internal round state regardless of which mode is next.
2. **IMPORTANT side-effect fix**: adding Session mode surfaced a real bug — CORRECT/
   WRONG dispatches used to bucket stats under `st.screen`, which works standalone
   (screen === modeId) but breaks in a session (screen === "session" while multiple
   modes cycle underneath). Fixed by passing `mode` explicitly through
   `useGameFB(streak, dispatch, modeId)` -> `dispatch({type, mode: modeId})` ->
   reducer uses `a.mode || st.screen`. This also makes standalone stats tracking
   more robust in general, not just session-safe.
3. **Weak Spots mode** — same Session runner, auto-configured: skips setup, pulls
   only modes with `srs.getWeakKeys(mode).length>0`, rounds = min(weakCount*2, 20).
   Empty state ("🎉 all clean") when nothing is currently weighted anywhere.
   `weakOnly` prop threads into each mode's round generator to hard-filter the
   candidate pool to only currently-weak keys (falls back to the full weak set,
   never to the full pool, so it never silently becomes a normal round).
4. **Mnemonic hints on wrong answers** — `IV_MNEMONIC`/`CHORD_MNEMONIC` in
   constants.ts (same source material as the tutorials, condensed to one line),
   keyed by semitone count / chord-quality index (language-independent identity).
   Shown inline under the options in Intervals/Chords only when the answer was wrong.
5. **BPM A/B compare** — "🔊 Compare" button after answering plays the target tempo
   then the guessed tempo back to back (4 beats each); more useful than reading
   "faster/slower" as text.
6. **Comprehensive guide page** — `public/guide/index.html`, static (not part of
   the SPA build), served at `/earforge/guide/`. Dark theme pulled from the app's
   own palette (per-mode accent colors), sidebar nav, glossary, mechanics
   explained (XP/streak, SRS weighting, sessions, weak spots, leaderboard auth),
   collapsible use-case scenarios. Linked from the in-app menu (opens in a new tab).

## Known gaps / rough edges
- **BPM/pitch detection ceiling** — hard difficulty tolerances (±5% BPM,
  2-octave Note ID) were picked by feel, not tested against real listeners.
- **SRS weight still isn't visible in the main UI** — Weak Spots mode surfaces it
  indirectly (only weak items appear), but there's no raw "here's your weight per
  item" debug view.
- **Abandoning a session mid-way** (hitting the header back-arrow) just unmounts
  SessionFlow — no confirmation, no partial summary. Low-stakes given how short
  sessions are, but worth a confirm dialog if it becomes annoying.
- **PORT hardcoded in server/leaderboard.js** — deliberately, not process.env.PORT.
  The VPS shell/pm2 environment carries an ambient PORT var from unrelated tooling
  that silently overrode the default on every `pm2 restart --update-env`, crash-
  looping the service on EADDRINUSE. If this ever needs to be configurable again,
  use a dedicated env var name (e.g. EARFORGE_PORT), not the generic PORT.
- **Chord mode icon 🎸** and the **PWA icons** (generated "EF" placeholders) are
  both cosmetic placeholders, fine functionally, swap whenever.

## Constraints when making changes
- Keep the audio engine dependency-free (no Tone.js, plain Web Audio) —
  earlier prototype used Tone.js, current version deliberately doesn't
  (bundle size + iOS Safari reliability).
- Any new fetch to the API must go through `import.meta.env.BASE_URL`.
- Test iOS Safari specifically if touching `useAudio` — see the
  `ensureCtx`/silent-buffer-unlock comments, iOS breaks easily here.
- Build with `npm run build`, deploy is: copy `dist/*` to
  `/var/www/html/earforge/` on the VPS, restart nothing (static files).
  API changes: edit `server/leaderboard.js`, copy to `/root/earforge-api/`,
  `pm2 restart earforge-api`.
