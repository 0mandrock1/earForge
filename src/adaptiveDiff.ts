// ─── Adaptive difficulty ─────────────────────────────────────────────────────────
// Replaces manual easy/medium/hard picking for solo mode practice (menu -> mode).
// Kept manual in Session setup on purpose: a deliberate fixed-tier stress test
// ("готуюсь підбирати щось конкретне... hard, 20-30 раундів", see guide) is a real
// use case that shouldn't be taken away, just given a smarter starting point.
//
// Tracks a rolling window of the last WINDOW round results per mode and moves the
// tier only when accuracy crosses an OUTER band (>=85% or <=55%), not the guide's
// own 70-85% "sweet spot" band — so normal in-range play never triggers a change,
// only a sustained streak of too-easy or too-hard. Recomputed from render (not
// useState), so it live-updates as soon as App re-renders after an answer instead
// of waiting for a remount.
const KEY = "earforge-adaptive";
const WINDOW = 20;
const MIN_SAMPLES = 10;
const UP = 0.85, DOWN = 0.55;
export type Tier = "easy" | "medium" | "hard";
const ORDER: Tier[] = ["easy", "medium", "hard"];
type Entry = { buf: number[]; tier: Tier };
type Data = Record<string, Entry>;

function load(): Data {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function save(d: Data) {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {}
}

export function getTier(modeId: string): Tier {
  return load()[modeId]?.tier || "medium";
}

// Called once per answered round (from useGameFB.onOk/onBad) — cheap localStorage
// read+write, same cost class as srs.ts's recordResult which already does this per round.
export function recordRound(modeId: string, correct: boolean): void {
  const d = load();
  const e: Entry = d[modeId] || { buf: [], tier: "medium" };
  e.buf = [...e.buf, correct ? 1 : 0].slice(-WINDOW);
  if (e.buf.length >= MIN_SAMPLES) {
    const acc = e.buf.reduce((a, b) => a + b, 0) / e.buf.length;
    const i = ORDER.indexOf(e.tier);
    if (acc >= UP && i < ORDER.length - 1) { e.tier = ORDER[i + 1]; e.buf = e.buf.slice(-Math.floor(WINDOW / 2)); }
    else if (acc <= DOWN && i > 0) { e.tier = ORDER[i - 1]; e.buf = e.buf.slice(-Math.floor(WINDOW / 2)); }
  }
  d[modeId] = e;
  save(d);
}

// Session setup's initial diff suggestion — average tier across the modes currently
// toggled on, so "just hit Start" lands near the right spot without forcing a pick.
export function aggregateTier(modeIds: string[]): Tier {
  if (!modeIds.length) return "medium";
  const idxs = modeIds.map(m => ORDER.indexOf(getTier(m)));
  const avg = Math.round(idxs.reduce((a, b) => a + b, 0) / idxs.length);
  return ORDER[avg];
}
