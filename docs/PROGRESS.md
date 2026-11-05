# Nova OS — progress log & handoff

_Last updated: 2026-11-03. Read this first when resuming._

## Current state
- Live code: `main` on github.com/chomikjr/nova-arcade (Vercel deploys from it once imported).
- 50 games (1 original + 49 open-source). Everything is free; `auth.isPro()` always returns true.
- Nova OS shell: `index.html` + `assets/os.js` / `assets/os.css`. Shared core: `assets/core.js`.
- Supabase project `nova-arcade` (ref `oazqmjnkkyqwxpsglgcb`). Tables: profiles, player_data, scores (+ `leaderboard` view),
  game_stats, game_likes, game_requests, app_owner. RPCs: username_available, trending, trending_v2, is_owner, site_stats.
  The owner email lives only in the database. `supabase/setup.sql` mirrors every migration.
- Last full regression (2026-11-03): all 50 games open in OS windows with no page errors; all apps open.

## Owner to-dos
- Supabase → Authentication → Sign In / Providers → Email: turn OFF "Confirm email" (otherwise sign-ups stall).
- Import the repo on vercel.com/new if not done (the Vercel connector lacked access to the "rick-studios" team).
- Do one real sign-up on the live site (Claude could only test against a stand-in backend; the sandbox can't reach Supabase).

## Decisions (keep consistent)
- Only host games whose license allows it, keep their license file, strip trackers/ads/injected scripts.
- Remakes made by other people are OK; Claude doesn't write remakes itself.
- Teen audience: no gambling-style mechanics (spin wheels, loot boxes), no public activity feeds of other users.

## Games requested but NOT added (copyright / license)
- **gn-math.dev:** Undertale, Deltarune, FNAF series, ULTRAKILL, Half-Life, Quake III, Buckshot Roulette, R.E.P.O., People Playground,
  DDLC, Bendy, That's Not My Neighbor, Do Not Take This Cat Home, Bad Parenting, Class of '09, A Bite at Freddy's, WebFishing,
  Speedstars, BFDI: Branches, Bowmasters, Magic Tiles 3, Flappy Dunk, Hill Climb Racing, Drive Mad, Cheese Chompers 3D.
- **Duck Math-style staples:** Slope, Retro Bowl, Run 3, Geometry Dash, Subway Surfers, Minecraft/Eaglercraft, Cookie Clicker, 1v1.LOL,
  Moto X3M, Drift Hunters, Basketball Stars, Tiny Fishing, Smash Karts, Paper.io, Happy Wheels, Snow Rider 3D, BitLife,
  Fireboy & Watergirl, Vex, Stickman Hook, Tunnel Rush, Crossy Road, Fruit Ninja, Temple Run 2, Cut the Rope, Bloons TD, Papa's games,
  Wordle (NYT version), Mario / Sonic / Pokémon.
- **chomik-and-more-chomik-v2 (392 folders):** 380+ are commercial games without a license (Among Us, Angry Birds, Bloons TD 1-2,
  Clash Royale, Cookie Clicker, Cuphead, Minecraft builds, Eaglercraft/Resent client, Roblox 2016, Pokémon/Mario/Zelda ROMs,
  Retro Bowl, Slope 1-2, Run 3, Subway Surfers, Geometry Dash, Moto X3M, Papa's games, Vex 3-7, FNAF, Undertale, Hollow Knight,
  Pizza Tower, Getting Over It, Granny, Baldi's Basics, Friday Night Funkin' (its source is Apache-2.0 but the art/music aren't open), etc.).
  Also skipped: Ninja vs EVILCORP and PolyBranch (no license), Popcat Classic (code is MIT, but the cat photo isn't the authors'),
  Evil Glitch (no license), Chill Radio (copyrighted music), webretro/ruffle (emulators; their ROMs/SWFs are copyrighted).
- **Excluded open-source ones:** Javascript Racer (Sega sprites), Snakes (licensed-only assets), Gauntlet (ripped sprites + licensed audio),
  Kittens Game (license forbids rehosting), Mahjong (no license), Minesweeper Classic (needs Compass build; pitpik's MIT one is used instead).
- **Still needs a build step:** Cube Composer (PureScript).
- **Built here from source:** Candy Box 2 (TypeScript 1.8 `lib/tsc.js` from microsoft/TypeScript tag v1.8.10, `tsc ... --out`, unminified),
  Q1K3 (`pack_map.c` + `pack_model.php` → `build/l`, `build/m`; served via the repo's dev `index.html`).

## Galaxy redesign + Nova Browser (2026-11-04)
- Look: one purple/black galaxy palette (no per-app rainbow colors). New default wallpaper "Galaxy" (`assets/core.js` PRESETS.galaxy).
  Fonts: Orbitron (display), Space Grotesk (UI), JetBrains Mono (labels). Theme overrides live in `assets/galaxy.css` (loaded after os.css).
- Desktop: big spaced day name + search bar ("Search games or the web") on the left, widget stack on the right, full-width taskbar
  (Start, search, pinned apps, running games, FPS, full screen, notifications, clock). Start menu is a launcher panel.
- Nova Browser app = Scramjet proxy. Page: `proxy/index.html` (tabs, address bar, server menu, new-tab page), SW: `proxy/sw.js` (scope /proxy/),
  servers + quick links: `proxy/config.js`. Runtime files are copied to `proxy/lib/` at deploy by `scripts/build-proxy.js`
  (Scramjet 1.1.0 + bare-mux 2.1.9 + libcurl-transport, see package.json). Needs a Wisp server hosted off Vercel: `wisp-server/` (see its README).
- Desktop search and the `/` palette open the Browser for URLs / web searches.

## Done so far
- **OS:** windows (drag/resize/max/min, snap to top, split screen left/right), dock (FPS, clock, running games, bell), Start menu
  (search, apps, recent, random, lock, install), `/`-search palette with nicknames + "Request X", right-click menu, `?` shortcuts,
  lock screen + 5-min idle lock, notification center, Customize mode (reorder/hide widgets, synced), deep links `#play=` / `#app=`.
- **Apps:** Games (featured, trending, continue, because-you-played, popular/more, filters, sorts incl. Most liked), Music (3 generated
  tracks + visualizer), Achievements (26), Leaderboard (weekly XP race, all-time, Neon Snake), Profile (level, stats, trophy case,
  avatar colors, favorites, recents), Settings, Notes, Request a Game, Update Log, About & Credits, Admin (owner only).
- **Progression:** XP, levels/titles, daily + weekly challenges, streaks, favorites, likes, confetti on big moments.
- **Game windows:** favorite, like, restart, info (with "More like this"), fullscreen, controls hint on open, "Up next" after a session.
- **Perf:** wallpaper pauses under full-size games. 12 wallpapers (default: Void).
- **PWA:** manifest + icons + network-only `sw.js`.

## Next ideas (in priority order)
1. Profile badges/titles on leaderboard rows (would need a small `profiles.badge` column + allowed update grant).
2. Optional "Theater mode" for game windows (dim desktop, hide dock).
3. Lazy-load covers in long rows; virtualize the library if it grows past ~150 games.
4. Build Cube Composer (needs PureScript toolchain).
5. More licensed games: check js13k winners / itch.io open-source jams one by one (license + asset rights).
6. Friends/follows only if privacy-safe for a teen audience (opt-in, no activity feed by default).

## How to test locally
`python3 -m http.server 8765` in the repo root, then open http://localhost:8765. Inside the Claude sandbox, Playwright needs
`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`, and the server must be started in the same command as the test (background
processes get killed between calls). A fake Supabase client for offline testing was used at /tmp/claude-0/fake-supabase.js
(not in the repo).
