// © 2026 Philippe Müller. All rights reserved. This application, including its design, graphics, content, functionality, and source code, is protected by copyright. Any unauthorized copying, reproduction, modification, distribution, or use of the application or its source code is prohibited.
// Service worker for "Our Table" — makes the app installable and loads fast/offline for the
// app shell itself. Multiplayer still needs a live connection (Supabase requests are always
// passed straight through to the network, never cached), so this is about the shell — the HTML,
// icons, and manifest — not about playing an online game with no signal.
const CACHE_NAME = 'our-table-v195';
// Pictures live in their OWN cache, which a new app version does not throw away: the ~12 MB of covers,
// room pictures and avatars used to be downloaded again from scratch on every visit (network-first with
// no-store) and again on every release, so on a slow connection the home screen painted only the top strip
// of each cover. Images are now served from this cache first. Bump ASSET_CACHE ONLY when an existing image
// file is replaced in place under the same name (a brand-new file just gets fetched the first time).
const ASSET_CACHE = 'our-table-assets-v2';
// Pictures replaced in place under the same name: dropped from ASSET_CACHE on every activation so the new file is fetched (a few hundred KB;
// leaving a name in this list is harmless). Without this, devices that had already loaded the old picture kept showing it for ever.
const REPLACED_ASSETS = ['./assets/rooms/olympic.jpg','./assets/games/clay.jpg','./assets/games/archery.jpg','./assets/games/precision.jpg','./assets/rooms/olympic.jpg','./assets/games/pinball.jpg','./assets/games/balloonblast.jpg','./assets/games/marksman.jpg','./assets/games/hoopfever.jpg','./assets/rooms/fairground.jpg','./assets/games/blackwater.jpg','./assets/games/airhockey.jpg','./assets/games/pong.jpg','./assets/games/invaders.jpg','./assets/games/pool.jpg','./assets/rooms/arcade.jpg','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/apple-touch-icon.png','./assets/ui/home.jpg','./assets/ui/trophies.jpg','./assets/ui/moments.jpg','./assets/ui/family.jpg','./assets/ui/victory.jpg','./assets/icons/icon-maskable-192.png','./assets/icons/icon-maskable-512.png'];
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
  './assets/games/balloonblast.jpg','./assets/games/marksman.jpg','./assets/games/hoopfever.jpg','./assets/rooms/fairground.jpg',
  './assets/games/precision.jpg','./assets/rooms/olympic.jpg','./assets/games/clay.jpg','./assets/games/cl_sky.jpg','./assets/games/cl_grass.jpg','./assets/games/cl_trees.png','./assets/games/cl_hhouse.png','./assets/games/cl_lhouse.png','./assets/games/cl_trap.png','./assets/games/cl_plate.png','./assets/games/cl_stake.png','./assets/games/cl_sock.png','./assets/games/cl_clay.png','./assets/games/cl_clayt.png','./assets/games/cl_frag.png','./assets/games/cl_smoke.png','./assets/games/cl_dust.png','./assets/games/cl_flash.png','./assets/games/cl_shell1.png','./assets/games/cl_shell.png','./assets/games/cl_shells.png','./assets/games/cl_gun.png','./assets/games/cl_clay_w.png','./assets/games/cl_clay_y.png','./assets/games/cl_clay_b.png','./assets/games/cl_clay_p.png','./assets/games/cl_clay_g.png','./assets/games/cl_clay_m.png','./assets/games/cl_frag_w.png','./assets/games/cl_frag_yb.png','./assets/games/cl_pink.png','./assets/games/cl_goldb.png','./assets/games/cl_pellets.png','./assets/games/cl_ring.png','./assets/games/cl_gun_e.png','./assets/games/cl_gun_ou.png','./assets/games/cl_gun_sp.png','./assets/games/cl_gun_si.png','./assets/games/cl_case.png','./assets/games/cl_smokering.png','./assets/games/cl_flare.png','./assets/games/cl_spark.png','./assets/games/cl_sign.png','./assets/games/cl_star.png','./assets/games/cl_trophy.png','./assets/games/cl_wreath.png','./assets/games/cl_banner.png','./assets/games/cl_duel.jpg','./assets/games/cl_vs.png','./assets/games/ac_wind.png','./assets/games/ac_towel.png','./assets/games/ac_target3.png','./assets/games/ac_stand.png','./assets/games/ac_snowfx.png','./assets/games/ac_slide.png','./assets/games/ac_rock3.png','./assets/games/ac_rock2.png','./assets/games/ac_rock1.png','./assets/games/ac_ray.png','./assets/games/ac_quiver.png','./assets/games/ac_pine.png','./assets/games/ac_oak.png','./assets/games/ac_motes.png','./assets/games/ac_gold.png','./assets/games/ac_gate.png','./assets/games/ac_fly.png','./assets/games/ac_flare.png','./assets/games/ac_fir2.png','./assets/games/ac_fir.png','./assets/games/ac_fence2.png','./assets/games/ac_fence.png','./assets/games/ac_bull.png','./assets/games/ac_bow2.png','./assets/games/ac_bottle.png','./assets/games/ac_board3.png','./assets/games/ac_board1.png','./assets/games/ac_birch.png','./assets/games/ac_arch.png','./assets/games/ac_arrow_b.png','./assets/games/ac_arrow_n.png','./assets/games/ac_arrow_r.png','./assets/games/ac_arrow_y.png','./assets/games/ac_bal_b.png','./assets/games/ac_bal_g.png','./assets/games/ac_bal_r.png','./assets/games/ac_bal_y.png','./assets/games/ac_bow.png','./assets/games/ac_bush1.png','./assets/games/ac_bush2.png','./assets/games/ac_disc.png','./assets/games/ac_dune.png','./assets/games/ac_dust.png','./assets/games/ac_face_boss.png','./assets/games/ac_face_hang.png','./assets/games/ac_flag.png','./assets/games/ac_hand.png','./assets/games/ac_hay_r.png','./assets/games/ac_hay_s.png','./assets/games/ac_lantern.png','./assets/games/ac_pop.png','./assets/games/ac_popup.png','./assets/games/ac_ring.png','./assets/games/ac_sign.png','./assets/games/ac_snow.png','./assets/games/ac_spark.png','./assets/games/ac_straw.png','./assets/games/ac_swing.png','./assets/games/ac_trail.png','./assets/games/cl_birds.png','./assets/games/cl_shellbox.png','./assets/games/cl_rain.png','./assets/games/cl_mist.png','./assets/games/cl_medal_g.png','./assets/games/cl_medal_s.png','./assets/games/cl_night_sky.jpg','./assets/games/cl_night_trees.png','./assets/games/cl_night_grass.jpg','./assets/games/cl_winter_sky.jpg','./assets/games/cl_winter_trees.png','./assets/games/cl_winter_grass.jpg','./assets/games/cl_coast_sky.jpg','./assets/games/cl_coast_trees.png','./assets/games/cl_coast_grass.jpg','./assets/games/ps_hall.jpg','./assets/games/ps_arena.jpg','./assets/games/ps_wall.jpg','./assets/games/ps_bench.jpg','./assets/games/ps_target_r.png','./assets/games/ps_target_p.png','./assets/games/ps_hole.png','./assets/games/ps_clip.png','./assets/games/ps_diopter.png','./assets/games/ps_ring.png','./assets/games/ps_rifle.png','./assets/games/ps_pistol.png','./assets/games/ps_puff.png','./assets/games/ps_ripple.png','./assets/games/ps_cone.png','./assets/games/ps_medal_g.png','./assets/games/ps_medal_s.png','./assets/games/ps_medal_b.png','./assets/games/ps_podium.png','./assets/games/ps_plate.png',
  './assets/ui/felt_green.jpg','./assets/ui/felt_blue.jpg','./assets/ui/felt_red.jpg','./assets/ui/felt_wood.jpg','./assets/ui/cardback.png','./assets/ui/chip_white.png','./assets/ui/chip_red.png','./assets/ui/chip_green.png','./assets/ui/chip_black.png','./assets/ui/chip_blue.png','./assets/ui/chip_gold.png','./assets/ui/coin.png','./assets/ui/cup.png','./assets/ui/stack_red.png','./assets/ui/stack_green.png','./assets/ui/stack_blue.png','./assets/ui/stack_black.png',
  './assets/games/pinball.jpg','./assets/games/pb_bg.jpg','./assets/games/pb_hammer.png','./assets/games/pb_jetnoz.png','./assets/games/pb_flame.png','./assets/games/pb_fbump.png','./assets/games/pb_fbumphot.png','./assets/games/pb_lemit.png','./assets/games/pb_lbeam.png','./assets/games/pb_lamp0.png','./assets/games/pb_lamp1.png','./assets/games/pb_lamp2.png','./assets/games/pb_vbump.png','./assets/games/pb_well.png','./assets/games/pb_wellov.png','./assets/games/pb_beatring.png','./assets/games/pb_cbump.png','./assets/games/pb_wellring.png','./assets/games/pb_clockbg.jpg','./assets/games/pb_hand1.png','./assets/games/pb_hand2.png','./assets/games/pb_cap.png','./assets/games/pb_plate.png','./assets/games/pb_plateon.png','./assets/games/pb_pend.png','./assets/games/pb_ring.png','./assets/games/pb_spark.png','./assets/games/pb_bg1.jpg','./assets/games/pb_bg2.jpg','./assets/games/pb_bg3.jpg','./assets/games/pb_roombg.jpg','./assets/games/pb_gear.png','./assets/games/pb_gear2.png','./assets/games/pb_blade.png','./assets/games/pb_gem0.png','./assets/games/pb_gem1.png','./assets/games/pb_gem2.png','./assets/games/pb_gem3.png','./assets/games/pb_gem4.png','./assets/games/pb_socket.png','./assets/games/pb_chest.png','./assets/games/pb_chestopen.png','./assets/games/pb_torch.png','./assets/games/pb_bump.png','./assets/games/pb_bumphit.png','./assets/games/pb_flipL.png','./assets/games/pb_flipR.png','./assets/games/pb_slingL.png','./assets/games/pb_slingR.png','./assets/games/pb_drop.png','./assets/games/pb_stand.png','./assets/games/pb_post.png','./assets/games/pb_spin.png','./assets/games/pb_vault.png','./assets/games/pb_ball.png','./assets/games/ms_bg.jpg','./assets/games/bb_bg.jpg','./assets/games/ms_bull.png','./assets/games/ms_star.png','./assets/games/ms_bottle.png','./assets/games/ms_bell.png','./assets/games/ms_duck.png','./assets/games/ms_goldduck.png','./assets/games/ms_rifle.png','./assets/games/ms_decoy.png','./assets/games/bb_red.png','./assets/games/bb_blue.png','./assets/games/bb_ivory.png','./assets/games/bb_green.png','./assets/games/bb_brass.png','./assets/games/bb_slate.png','./assets/games/bb_joker.png','./assets/games/bb_black.png','./assets/games/bb_dart.png',
  './assets/games/hoopfever_bg.jpg','./assets/games/hf_ball.png','./assets/games/hf_hoop.png','./assets/games/hf_goldhoop.png','./assets/games/hf_post.png',
  './assets/ui/home.jpg','./assets/ui/trophies.jpg','./assets/ui/moments.jpg','./assets/ui/family.jpg','./assets/ui/victory.jpg',
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
  './assets/games/chainreaction.jpg','./assets/games/gauntlet.jpg','./assets/games/abyss.jpg','./assets/games/blackwater.jpg','./assets/games/airhockey.jpg','./assets/rooms/arcade.jpg',
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
