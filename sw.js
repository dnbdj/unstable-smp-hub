/* Offline-first cache for the Hub (static assets only; YouTube streams stay online). */
const CACHE = "smp-hub-v19";
const ASSETS = ["./", "./index.html", "./styles.css", "./app.js", "./config.js", "./data/episodes.js", "./manifest.json",
  "./icons/official-logo.png", "./icons/official-wordmark.png",
  "./skins/wemmbu.png", "./skins/flamefrags.png", "./skins/parrotx2.png", "./skins/spokeishere.png",
  "./skins/wemmbu-3d.webp", "./skins/flamefrags-3d.webp", "./skins/parrotx2-3d.webp", "./skins/spokeishere-3d.webp"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (u.hostname.includes("youtube") || u.hostname.includes("google") || u.hostname.includes("mc-heads") || u.hostname.includes("minotar")) return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
