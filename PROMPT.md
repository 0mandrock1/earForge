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

## Remaining known gaps
- **BPM/pitch detection ceiling** — hard difficulty tolerances (±5% BPM,
  2-octave Note ID) were picked by feel, not tested against real listeners.
  If revisiting difficulty curves, get a few practice sessions of data first
  (the leaderboard's `pct`/`total` per mode is exactly this data).
- **SRS weight isn't visible anywhere** — no UI shows which items are
  currently "due"/weighted. A small debug view or a "review weak spots"
  mode that only draws from the weighted pool would make the mechanism
  legible instead of invisible.
- **Chord mode icon 🎸 is a placeholder pick** — collides conceptually with
  "guitar" when this is chords in general (works fine on a keyboard/DAW
  context too). Not urgent, just noting the choice was arbitrary.
- **Real PWA icons** — current ones are a generated purple square with "EF".
  Fine functionally, but swap them for actual artwork when there's time.

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
