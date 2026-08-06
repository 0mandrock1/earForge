// Network-first for the app shell (index.html/JS/CSS) so fixes always reach
// clients on next load, with cache as an offline fallback only. Audio is
// synthesized (Web Audio), so caching JS/CSS/HTML is enough for offline play.
const CACHE = "earforge-v4";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.pathname.includes("/api/")) return; // never cache the leaderboard API
  if (url.origin !== location.origin) return; // leave random.org etc alone
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
      }
      return res;
    }).catch(() =>
      caches.open(CACHE).then(cache => cache.match(e.request))
    )
  );
});
