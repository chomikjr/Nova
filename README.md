# Nova OS

A free game desktop that runs in the browser: windows, a dock, a start menu,
search, widgets, and 50 games, with XP, achievements, daily and weekly
challenges, trending, likes and cloud-synced progress. Plain HTML/CSS/JS with no build step.

## Run it

```bash
cd nova-arcade
python3 -m http.server 8080      # then visit http://localhost:8080
```

Deploys as-is to any static host (Vercel, GitHub Pages, Netlify, a Raspberry Pi…).

## What's in it

- **Desktop:** giant day/clock, widgets (Jump back in, Quick play, Daily challenge,
  Level, Now playing, Favorites/Popular, System status), right-click menu.
- **Windows:** drag, resize, snap to top to maximize, minimize to the dock. Games
  open full size by default (Settings → System).
- **Dock / Start / Search:** pinned apps, running games, FPS counter, clock. Press
  `/` or `Ctrl+K` anywhere to search games, apps and actions. Nicknames work
  ("dino", "flappy", "8 ball"). Misses offer a one-click game request.
- **Apps:** Games, Music, Achievements, Leaderboard, Profile, Settings, Notes,
  Request a Game, Update Log, About & Credits, Admin (owner only).
- **Progression:** XP (play time, new games, records, daily login), levels and
  titles, 26 achievements, daily + weekly challenges, day streaks, a weekly XP race,
  favorites, likes, recently played, "More like this" and "Up next".
- **OS extras:** lock screen (and 5-minute idle lock), split screen (drag to the left/right
  edge), notification center, Customize mode for home widgets, `?` shortcuts, confetti.
- **Owner Admin app:** site stats, grouped game requests, most played (owner account only).
- **Deep links:** `/#play=2048`, `/#app=music`.

## Files

```
index.html            Nova OS shell
assets/os.css/os.js   Window manager, dock, start menu, search, widgets, apps
assets/core.css/js    Shared core: registry, auth/cloud, scores, XP/achievements,
                      settings, audio engine, wallpapers, modals, icons
assets/thumbs.js      Animated covers for games without an image
assets/game.css       Game page layout for original games
assets/game-shell.js  Engine for original games (see games/_template.html)
games/snake.html      Neon Snake (original)
games/play.html       Player for hosted open-source games
games/ports/          49 open-source games + covers (_thumbs)
supabase/setup.sql    Database schema, security rules and triggers
CREDITS.md            Authors and licenses of the hosted games
```

## Adding a game

- **Open-source game:** copy its built files into `games/ports/<id>/` and add a
  `port({...})` entry to the `games` array in `assets/core.js` (`entry` and `dir`
  if the start page isn't `<id>/index.html`). Put `popular: true` to list it under
  Popular, and add a 640×400 cover at `games/ports/_thumbs/<id>.webp`.
  Only add games whose license allows hosting them, and keep their license file.
- **Original game:** copy `games/_template.html` and follow its header comment.

## Accounts (Supabase)

- Project `nova-arcade`. The URL and publishable key are in `config.cloud`; security
  comes from row-level security in `supabase/setup.sql`.
- **Syncs:** scores, settings, game options, open-source game saves, XP, achievements,
  favorites, recents, notes. XP feeds the global "Top players" board.
- **Owner:** emails in `public.app_owner` (kept out of this repo) get the owner role, and
  only they can use the username "Ryan".
- **Game requests** go to `public.game_requests`. Read them in the Admin app or the Supabase table editor.
- **Trending/likes:** `game_stats`, `game_likes`, and the `trending_v2()` aggregate function.
- See `docs/PROGRESS.md` for the full handoff log and the list of games that can't be added.
- **Email confirmation:** Supabase's built-in mailer only reaches your own team. Turn off
  *Confirm email* (Authentication → Sign In / Providers → Email) or add custom SMTP.

## Customizing

- **Version and changelog:** `config.version` / `config.changelog` in `core.js`
- **Achievements, daily challenges, level titles:** `ACHIEVEMENTS`, `DAILY_TYPES`,
  `LEVEL_TITLES` in `core.js`
- **Wallpapers:** `PRESETS` in `core.js`. **Music:** `TRACKS`. **Sounds:** `SFX`
- **Apps / dock:** `APPS` and `PINNED` in `os.js`
