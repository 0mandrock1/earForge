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

## Known gaps worth tackling (priority order)
1. **Component split** — `App.tsx` is a monolith. Extract at minimum:
   audio engine, i18n/T, OptGrid+Btn+NextBtn, per-mode game screens.
2. **No spaced repetition** — misses aren't resurfaced. A simple
   leaky-bucket ("wrong answers come back sooner") would meaningfully
   improve retention for daily practice.
3. **No chord/triad mode beyond Key Detect's cadence** — a dedicated
   "identify the chord quality" mode (maj/min/dim/aug/7ths) is a natural
   fifth game mode reusing the existing engine.
4. **No PWA/offline support** — no manifest.json or service worker. Given
   this is used for short daily sessions on a phone, installability +
   offline caching of the JS bundle (audio is synthesized, no asset
   fetching needed) is low-effort, high-value.
5. **Leaderboard has no auth** — nickname + optional password exists in the
   UI (`onLogin`) but the API doesn't check it; anyone can overwrite anyone
   else's leaderboard entry by nick. Either enforce the password
   server-side or drop the pretense of it being protected.
6. **BPM/pitch detection ceiling** — hard difficulty tolerances (±5% BPM,
   2-octave Note ID) were picked by feel, not tested against real listeners.
   If revisiting difficulty curves, get a few practice sessions of data
   first (the leaderboard's `pct`/`total` per mode is exactly this data).

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
