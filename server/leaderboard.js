// Self-hosted replacement for the Vercel /api/leaderboard function (was Upstash Redis).
// Local JSON file store instead — no external service dependency.
const http = require("http");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "leaderboard.json");
const PORT = process.env.PORT || 4173;
const MODES = ["noteId", "intervals", "bpm", "key"];

function loadDb() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, "utf8")); }
  catch { return Object.fromEntries(MODES.map(m => [m, {}])); }
}
function saveDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db));
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  if (req.method === "GET") {
    const db = loadDb();
    const result = {};
    for (const mode of MODES) {
      result[mode] = Object.entries(db[mode] || {})
        .map(([nick, v]) => ({ nick, ...v }))
        .filter(e => e.total > 0)
        .sort((a, b) => b.pct - a.pct || b.best - a.best)
        .slice(0, 10);
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
    return;
  }

  if (req.method === "POST") {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => {
      try {
        const { nick, stats, bestStreak } = JSON.parse(body || "{}");
        if (!nick || !stats) { res.writeHead(400); res.end(JSON.stringify({ error: "Missing fields" })); return; }
        const safeNick = String(nick).slice(0, 32);
        const db = loadDb();
        for (const mode of MODES) {
          const s = stats[mode] || { ok: 0, total: 0 };
          if (s.total === 0) continue;
          db[mode] = db[mode] || {};
          db[mode][safeNick] = { ok: s.ok, total: s.total, pct: Math.round((s.ok / s.total) * 100), best: bestStreak || 0 };
        }
        saveDb(db);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    });
    return;
  }

  res.writeHead(405);
  res.end(JSON.stringify({ error: "Method not allowed" }));
});

server.listen(PORT, () => console.log(`earforge-api listening on :${PORT}`));
