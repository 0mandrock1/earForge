// ─── Spaced repetition (leaky bucket) ───────────────────────────────────────────
// Per mode, tracks a weight per answer-key: wrong answers add weight, correct answers
// bleed it off. weightedPick then biases toward higher-weight (recently-missed) items,
// so mistakes resurface sooner instead of drowning uniformly in the full pool.
// Not used for BPM mode — the target is a continuous value, not a discrete label,
// so there's no stable "key" to accumulate weight against.
const SRS_KEY = "earforge-srs";
type SrsData = Record<string, Record<string, number>>;
const MAX_WEIGHT = 5;

function load(): SrsData {
  try { return JSON.parse(localStorage.getItem(SRS_KEY) || "{}"); } catch { return {}; }
}
function save(d: SrsData) {
  try { localStorage.setItem(SRS_KEY, JSON.stringify(d)); } catch {}
}

export function recordResult(modeId: string, key: string, correct: boolean) {
  const d = load();
  d[modeId] = d[modeId] || {};
  const cur = d[modeId][key] || 0;
  const next = correct ? Math.max(0, cur - 1) : Math.min(MAX_WEIGHT, cur + 2);
  if (next === 0) delete d[modeId][key];
  else d[modeId][key] = next;
  save(d);
}

// Weighted random pick among candidates: weight = 1 + srsWeight*2, so a recently-missed
// item (weight 5) is ~11x more likely to come up than a clean one (weight 0).
export function weightedPick<T>(modeId: string, items: T[], keyFn: (t: T) => string, randFn: () => number): T {
  const d = load()[modeId] || {};
  const weights = items.map(it => 1 + (d[keyFn(it)] || 0) * 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = randFn() * total;
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}
