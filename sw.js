// Service worker for "Our Table" — makes the app installable and loads fast/offline for the
// app shell itself. Multiplayer still needs a live connection (Supabase requests are always
// passed straight through to the network, never cached), so this is about the shell — the HTML,
// icons, and manifest — not about playing an online game with no signal.
const CACHE_NAME = 'our-table-v4';
const APP_SHELL = [
  './CardTableV17_2fixed.html',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];
// Game cover art -- deliberately NOT part of APP_SHELL's install-time cache.addAll() below.
// addAll() is atomic: if even one of these fetches fails (a flaky connection on exactly the kind
// of network this app is trying to be resilient to), the whole install rejects and no service
// worker gets registered at all -- breaking offline support entirely to chase a smaller polish
// win. Warmed individually and best-effort after activate instead, so a slow/failed image can
// never take down the shell that actually matters.
const GAME_COVERS = [
  './assets/games/maumau.png','./assets/games/texas.png','./assets/games/fivecard.png',
  './assets/games/blackjack.png','./assets/games/battle.png','./assets/games/yahtzee.png',
  './assets/games/roulette.png','./assets/games/uno.png','./assets/games/romme.png',
  './assets/games/dicedual.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

function warmGameCovers(){
  return caches.open(CACHE_NAME).then(cache =>
    Promise.allSettled(GAME_COVERS.map(url =>
      fetch(url, { cache: 'no-store' }).then(res => { if (res && res.ok) return cache.put(url, res); })
    ))
  );
}

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => warmGameCovers())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Never cache Supabase calls — multiplayer state must always be fresh.
  if (url.hostname.endsWith('supabase.co')) return;
  // Cross-origin requests (fonts, etc.) — just pass through, don't try to cache/opaque-response them.
  if (url.origin !== self.location.origin) return;

  // Network-first, cache as a fallback only. This app is edited constantly (game rules, cover art,
  // CSS all change between visits), so a cache-first strategy — even with a background revalidate —
  // means a returning player can sit on a stale build for a while. Always try the network first and
  // only fall back to the cache when there's genuinely no connection.
  //
  // Critically, the fetch() below must itself bypass the browser's ordinary HTTP cache (not just
  // the Cache Storage API): a plain fetch(e.request) is still subject to normal HTTP heuristic
  // caching/If-Modified-Since, so a static file server that sends Last-Modified headers (like the
  // local dev server) can hand back a stale disk-cached body even inside "network-first" code —
  // no cache miss, no error, just old bytes. { cache: 'no-store' } forces a real round-trip.
  e.respondWith(
    fetch(e.request, { cache: 'no-store' }).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
