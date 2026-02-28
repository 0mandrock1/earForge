import { Redis } from "@upstash/redis";

const MODES = ["noteId", "intervals", "bpm", "key"];

type Entry = { ok: number; total: number; pct: number; best: number };
type StatsMap = Record<string, { ok: number; total: number }>;

function createRedis(): Redis | null {
  // Vercel Marketplace: Redis → Create (Upstash)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  // Vercel KV (fallback, same Upstash under the hood)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }
  return null;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const redis = createRedis();
  if (!redis) return res.status(503).json({ error: "Redis not configured" });

  try {
    if (req.method === "GET") {
      const result: Record<string, Array<{ nick: string } & Entry>> = {};
      await Promise.all(
        MODES.map(async (mode) => {
          const raw = (await redis.hgetall<Record<string, string>>(`lb:${mode}`)) ?? {};
          result[mode] = Object.entries(raw)
            .map(([nick, v]) => ({ nick, ...(JSON.parse(v) as Entry) }))
            .filter((e) => e.total > 0)
            .sort((a, b) => b.pct - a.pct || b.best - a.best)
            .slice(0, 10);
        })
      );
      return res.json(result);
    }

    if (req.method === "POST") {
      const { nick, stats, bestStreak } = req.body as {
        nick: string;
        stats: StatsMap;
        bestStreak: number;
      };
      if (!nick || !stats) return res.status(400).json({ error: "Missing fields" });

      const safeNick = String(nick).slice(0, 32);

      await Promise.all(
        MODES.map(async (mode) => {
          const s = stats[mode] ?? { ok: 0, total: 0 };
          if (s.total === 0) return;
          const entry: Entry = {
            ok: s.ok,
            total: s.total,
            pct: Math.round((s.ok / s.total) * 100),
            best: bestStreak ?? 0,
          };
          await redis.hset(`lb:${mode}`, { [safeNick]: JSON.stringify(entry) });
        })
      );
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
}
