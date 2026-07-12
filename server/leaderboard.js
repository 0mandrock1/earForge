// Self-hosted replacement for the Vercel /api/leaderboard function (was Upstash Redis).
// Local JSON file store. Per-nick auth is optional both ways:
//  - first submission for a nick with a password sets it (sha256 hash stored, never
//    the plaintext) -> later submissions to that nick must match it.
//  - first submission with NO password leaves the nick open forever -> anyone can
//    post progress under it, no check, ever. This is the default/expected mode for
//    a low-stakes personal leaderboard.
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DB_PATH = path.join(__dirname, "leaderboard.json");
const PORT = process.env.PORT || 4173;
const MODES = ["noteId", "intervals", "bpm", "key", "chords"];

function hash(pw) {
  if (!pw) return "";
  return crypto.createHash("sha256").update(String(pw)).digest("hex");
}

function loadDb() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, "utf8")); }
  catch { return { _auth: {}, ...Object.fromEntries(MODES.map(m => [m, {}])) }; }
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
        const { nick, stats, bestStreak, password } = JSON.parse(body || "{}");
        if (!nick || !stats) { res.writeHead(400); res.end(JSON.stringify({ error: "Missing fields" })); return; }
        const safeNick = String(nick).slice(0, 32);
        const db = loadDb();
        db._auth = db._auth || {};

        const existingHash = db._auth[safeNick];
        const givenHash = hash(password);
        if (existingHash === undefined) {
          // First time this nick posts: claim it. Empty hash = stays open forever.
          db._auth[safeNick] = givenHash;
        } else if (existingHash && givenHash !== existingHash) {
          // Nick is password-protected and the password doesn't match: reject.
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Wrong password for this nickname" }));
          return;
        }
        // existingHash === "" (claimed as open) falls through here -> anyone can post.

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
