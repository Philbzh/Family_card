// © 2026 Philippe Müller. All rights reserved. This application, including its design, graphics, content, functionality, and source code, is protected by copyright. Any unauthorized copying, reproduction, modification, distribution, or use of the application or its source code is prohibited.
// Service worker for "Our Table" — makes the app installable and loads fast/offline for the
// app shell itself. Multiplayer still needs a live connection (Supabase requests are always
// passed straight through to the network, never cached), so this is about the shell — the HTML,
// icons, and manifest — not about playing an online game with no signal.
const CACHE_NAME = 'our-table-v42';
// Pictures live in their OWN cache, which a new app version does not throw away: the ~12 MB of covers,
// room pictures and avatars used to be downloaded again from scratch on every visit (network-first with
// no-store) and again on every release, so on a slow connection the home screen painted only the top strip
// of each cover. Images are now served from this cache first. Bump ASSET_CACHE ONLY when an existing image
// file is replaced in place under the same name (a brand-new file just gets fetched the first time).
const ASSET_CACHE = 'our-table-assets-v1';
// Pictures replaced in place under the same name: dropped from ASSET_CACHE on every activation so the new file is fetched (a few hundred KB;
// leaving a name in this list is harmless). Without this, devices that had already loaded the old picture kept showing it for ever.
const REPLACED_ASSETS = ['./assets/games/blackwater.jpg'];
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
  './assets/games/blackjack.png','./assets/games/battle.png','./assets/games/yahtzee.jpg',
  './assets/games/roulette.jpg','./assets/games/uno.png','./assets/games/romme.png',
  './assets/games/dicedual.png','./assets/games/farkle.png','./assets/games/bingo.png',
  './assets/games/lepouilleux.jpg','./assets/games/pig.jpg','./assets/games/slots.jpg',
  './assets/games/drawit.jpg','./assets/games/liarsdice.jpg','./assets/games/summit.jpg',
  './assets/games/summit-board.jpg','./assets/games/vault.jpg',
  './assets/games/bust.jpg','./assets/games/hotbomb.jpg',
  './assets/games/escape.jpg','./assets/games/shutbox.jpg',
  './assets/games/fourrow.jpg','./assets/games/skull.jpg','./assets/games/tension.jpg',
  './assets/games/chainreaction.jpg','./assets/games/gauntlet.jpg','./assets/games/abyss.jpg','./assets/games/blackwater.jpg',
  './assets/blackwater/sfx/torpedo_launch.wav','./assets/blackwater/sfx/sonar_ping.wav',
  './assets/rooms/cards.jpg','./assets/rooms/dice.jpg','./assets/rooms/casino.jpg',
  './assets/rooms/classic.jpg','./assets/rooms/party.jpg','./assets/rooms/coop.jpg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Best-effort and gentle: a few at a time (a burst of 30 downloads would starve the pictures the player is
// actually looking at), and anything already stored is skipped.
function warmGameCovers(){
  return caches.open(ASSET_CACHE).then(cache => {
    const queue = GAME_COVERS.slice();
    const worker = () => {
      const url = queue.shift();
      if (!url) return Promise.resolve();
      return cache.match(url)
        .then(hit => hit || fetch(url, { cache: 'reload' }).then(res => { if (res && res.ok) return cache.put(url, res); }))
        .catch(() => {})
        .then(worker);
    };
    return Promise.all([worker(), worker(), worker()]);
  });
}

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME && k !== ASSET_CACHE).map(k => caches.delete(k))))
      .then(() => caches.open(ASSET_CACHE).then(c => Promise.all(REPLACED_ASSETS.map(u => c.delete(u)))))
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

  // Pictures: cache first, then the network (and remember what the network gave). They only change when a file
  // is replaced, which is what ASSET_CACHE's version is for.
  if (url.pathname.includes('/assets/')) {
    e.respondWith(
      caches.open(ASSET_CACHE).then(cache =>
        cache.match(e.request).then(hit => hit || fetch(e.request).then(res => {
          if (res && res.ok) cache.put(e.request, res.clone());
          return res;
        }).catch(() => caches.match(e.request)))
      )
    );
    return;
  }

  // Everything else (the app itself): network-first, cache as a fallback only. This app is edited constantly (game rules, cover art,
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
