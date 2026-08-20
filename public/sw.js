// Bewusst minimal: nur statische, nicht personalisierte Assets werden
// vorab gecacht. Dashboard/Event-Seiten werden NICHT gecacht, weil sie
// pro Nutzer unterschiedliche, sensible Daten zeigen — ein Cache-Fehler
// dort koennte sonst die Daten eines Nutzers im Browser eines anderen
// anzeigen. Der Service Worker existiert vor allem, damit der Browser
// die App ueberhaupt als installierbar erkennt (PWA-Grundvoraussetzung).

const CACHE_NAME = "feierlich-static-v1";
const STATIC_ASSETS = ["/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isStaticAsset = STATIC_ASSETS.includes(url.pathname);

  if (isStaticAsset) {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
    return;
  }

  // Alles andere: immer echtes Netzwerk, kein Caching personalisierter Inhalte.
});
