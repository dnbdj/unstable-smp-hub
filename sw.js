/* Network-first: every same-origin request goes to the network, so a new
   deploy shows up on a normal reload. The cache is only a fallback for
   offline use. Cross-origin (YouTube player, thumbnails, skin CDNs) is
   left entirely to the browser. */
const CACHE = "smp-hub-v25";
const ASSETS = ["./", "./index.html", "./styles.css", "./app.js", "./data/episodes.js", "./manifest.json",
  "./icons/official-logo.png", "./icons/official-wordmark.png",
  "./skins/wemmbu.png", "./skins/flamefrags.png", "./skins/parrotx2.png", "./skins/spokeishere.png",
  "./skins/wemmbu-3d.webp", "./skins/flamefrags-3d.webp", "./skins/parrotx2-3d.webp", "./skins/spokeishere-3d.webp"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.origin !== self.location.origin) return;

  e.respondWith((async () => {
    try {
      // no-store keeps the HTTP cache out of the way so the edge copy wins.
      const fresh = await fetch(url.href, { cache: "no-store", credentials: "same-origin" });
      if (fresh && fresh.ok) {
        const c = await caches.open(CACHE);
        c.put(url.href, fresh.clone());
      }
      return fresh;
    } catch {
      const hit = await caches.match(url.href);
      if (hit) return hit;
      if (req.mode === "navigate") {
        const shell = await caches.match("./index.html");
        if (shell) return shell;
      }
      return new Response("Offline", { status: 503, headers: { "content-type": "text/plain" } });
    }
  })());
});
