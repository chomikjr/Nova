/* ==========================================================================
   NOVA ARCADE — core.js
   Shared by the hub and every game page. Exposes window.Arcade with:
     Arcade.config      site + plan config
     Arcade.games       game registry (add new games here)
     Arcade.auth        accounts (client-side demo — swap for a real backend)
     Arcade.scores      per-user high scores + stats
     Arcade.settings    persisted user settings
     Arcade.audio       synthesized SFX + generative music (no audio files needed)
     Arcade.bg          animated background presets
     Arcade.ui          modals, toasts, settings/auth/profile/upgrade panels
     Arcade.icon(name)  inline SVG icons
   ========================================================================== */
(function () {
  'use strict';

  /* Inside an OS window (iframe) or ?embed=1: no wallpaper/music of our own */
  const EMBED = (() => { try { return window.self !== window.top || /[?&]embed=1/.test(location.search); } catch (e) { return true; } })();
  if (EMBED) document.documentElement.classList.add('is-embed');

  const ROOT = (() => {
    const src = document.currentScript && document.currentScript.src;
    return src ? src.replace(/assets\/core\.js(\?.*)?$/, '') : './';
  })();

  /* ------------------------------------------------------------------------
     CONFIG — edit these when you set up the backend and payments
     ------------------------------------------------------------------------ */
  const config = {
    siteName: 'Nova Arcade',
    root: ROOT,
    /* Cloud accounts (Supabase). Paste your project's URL and *anon/publishable*
       key here (Project Settings → API). Both are safe to ship in the browser —
       security comes from the row-level-security rules in supabase/setup.sql.
       Leave empty to fall back to device-only accounts. */
    cloud: {
      supabaseUrl: 'https://oazqmjnkkyqwxpsglgcb.supabase.co',
      supabaseAnonKey: 'sb_publishable_h-I9xAYcRlVRze13k2v40Q_CZ6Rf8C3'
    },
    version: '3.1',
    changelog: [
      { v: '3.1', date: 'Nov 2026', items: ['Music stations: Hip Hop, Lo-Fi and more, playing real songs', 'Song list, skip back/forward, shuffle and a seek bar in the Music app', 'Media keys and lock-screen controls work for stations', 'Stations keep playing in a background tab'] },
      { v: '3.0', date: 'Nov 2026', items: ['Nova OS: windows, split screen, dock, start menu, lock screen and customizable widgets', 'Everything is free — no more Pro', '36 new games (Antimatter Dimensions, Candy Box 2, Wordle+, n-gon, Solitaire, Q1K3, Pac-Man…)', 'XP, levels, achievements, daily + weekly challenges, streaks and a weekly XP race', 'Favorites, likes, trending, recently played and game requests'] },
      { v: '2.0', date: 'Oct 2026', items: ['Cloud accounts with sync across devices', 'Global leaderboards', '13 open-source games'] },
      { v: '1.0', date: 'Oct 2026', items: ['Nova Arcade launches with Neon Snake'] }
    ]
  };

  /* ------------------------------------------------------------------------
     GAME REGISTRY — the OS builds its library from this list (order matters:
     popular first). Original games: path → their page. Open-source ports:
     folder in games/ports/ (dir, entry), opened through games/play.html.
     image → cover in games/ports/_thumbs/, thumb → animated canvas cover.
     ------------------------------------------------------------------------ */
  const port = (o) => Object.assign({ status: 'live', path: 'games/play.html?g=' + o.id, dir: o.id, entry: 'index.html' }, o);
  const games = [
    // ----- Popular -----
    port({ id: '2048', title: '2048', popular: true, tags: ['Puzzle'], hue: 35, image: '2048',
      tagline: 'Slide, merge, and chase the 2048 tile.', author: 'Gabriele Cirulli', license: 'MIT', repo: 'gabrielecirulli/2048', controls: 'Arrow keys / swipe' }),
    port({ id: 'antimatter', title: 'Antimatter Dimensions', popular: true, tags: ['Idle'], hue: 100, image: 'antimatter',
      tagline: 'The legendary idle game. Buy dimensions, break infinity.', author: 'IvarK & team', license: 'MIT', repo: 'IvarK/AntimatterDimensionsSourceCode', controls: 'Mouse · M to max all' }),
    port({ id: 'pacman', title: 'Pac-Man', popular: true, tags: ['Arcade', 'Classic'], hue: 55, image: 'pacman',
      tagline: 'Eat the dots, dodge the ghosts. An HTML5 remake.', author: 'Dale Harvey', license: 'WTFPL', repo: 'daleharvey/pacman', controls: 'Arrows to move · N new game' }),
    port({ id: 'hextris', title: 'Hextris', popular: true, tags: ['Puzzle', 'Arcade'], hue: 205, image: 'hextris',
      tagline: 'Fast-paced hexagonal Tetris. Rotate to match falling blocks.', author: 'Hextris team', license: 'GPL-3.0', repo: 'Hextris/hextris', controls: 'Left / Right to rotate' }),
    port({ id: 'trex', title: 'T-Rex Runner', popular: true, tags: ['Arcade', 'Classic'], hue: 0, thumb: 'trex', image: 'trex',
      tagline: 'The famous Chrome offline dino, endlessly running.', author: 'Chromium authors (via wayou)', license: 'BSD-3-Clause', repo: 'wayou/t-rex-runner', controls: 'Space / Up to jump, Down to duck' }),
    { id: 'snake', title: 'Neon Snake', path: 'games/snake.html', status: 'live', original: true, popular: true,
      tagline: 'Our own snake with power-ups, combos, skins and four modes.', tags: ['Arcade', 'Classic'], hue: 150, thumb: 'snake', image: 'snake', controls: 'Arrows / WASD / swipe' },
    port({ id: 'tetris', title: 'Tetris Classic', popular: true, tags: ['Puzzle', 'Classic'], hue: 230, image: 'tetris',
      tagline: 'Clean, no-frills falling-block puzzling.', author: 'Jake Gordon', license: 'MIT', repo: 'jakesgordon/javascript-tetris', controls: 'Arrows to move/rotate, Space to start' }),
    port({ id: 'clumsy-bird', title: 'Clumsy Bird', popular: true, tags: ['Arcade'], hue: 95, image: 'clumsy-bird',
      tagline: 'Flap through the pipes. One more try, always.', author: 'Ellison Leão', license: 'GPL-3.0', repo: 'ellisonleao/clumsy-bird', controls: 'Space / click to flap' }),
    port({ id: 'hexgl', title: 'HexGL', popular: true, tags: ['Racing', '3D'], hue: 190, image: 'hexgl',
      tagline: 'Futuristic anti-gravity racing in full 3D.', author: 'Thibaut Despoulain', license: 'MIT', repo: 'BKcore/HexGL', controls: 'Arrows to steer, A/D to air-brake' }),
    port({ id: 'tower', title: 'Tower Builder', popular: true, tags: ['Arcade'], hue: 10, image: 'tower',
      tagline: 'Drop floors at the perfect moment and build sky-high.', author: 'BMQB', license: 'MIT', repo: 'iamkun/tower_game', controls: 'Click / tap to drop' }),
    port({ id: 'untrusted', title: 'Untrusted', popular: true, tags: ['Puzzle', 'Coding'], hue: 120, image: 'untrusted',
      tagline: 'Hack the game’s own code to escape each level.', author: 'Alex Nisnevich & Greg Shuflin', license: 'CC BY-NC-SA 3.0', repo: 'AlexNisnevich/untrusted', controls: 'Arrows to move · edit the code' }),
    port({ id: 'candybox2', title: 'Candy Box 2', popular: true, tags: ['Idle', 'Adventure'], hue: 330, image: 'candybox2',
      tagline: 'The legendary ASCII adventure that starts with a few candies.', author: 'aniwey', license: 'GPL-3.0', repo: 'candybox2/candybox2.github.io', controls: 'Mouse · keyboard in quests' }),
    port({ id: 'adarkroom', title: 'A Dark Room', popular: true, tags: ['Adventure', 'Idle'], hue: 25, thumb: 'darkroom', image: 'adarkroom',
      tagline: 'A minimalist text adventure that grows into something huge.', author: 'Doublespeak Games', license: 'MPL-2.0', repo: 'doublespeakgames/adarkroom', controls: 'Mouse' }),
    port({ id: 'trimps', title: 'Trimps', popular: true, tags: ['Idle', 'Strategy'], hue: 200, image: 'trimps',
      tagline: 'Gather, breed and battle your way through endless zones.', author: 'Trimps team', license: 'GPL-2.0', repo: 'Trimps/Trimps.github.io', controls: 'Mouse' }),
    port({ id: 'pong', title: 'Pong', popular: true, tags: ['Arcade', 'Classic', 'Multiplayer'], hue: 300, image: 'pong',
      tagline: 'The original paddle duel — vs the computer or a friend.', author: 'Jake Gordon', license: 'MIT', repo: 'jakesgordon/javascript-pong', controls: '1 / 2 to start · Q/A and P/L' }),
    port({ id: 'breakout', title: 'Breakout', popular: true, tags: ['Arcade', 'Classic'], hue: 330, image: 'breakout',
      tagline: 'Smash every brick with paddle and ball.', author: 'Jake Gordon', license: 'MIT', repo: 'jakesgordon/javascript-breakout', controls: 'Arrows / mouse · Space to start' }),
    port({ id: 'pool', title: 'Classic 8-Ball', popular: true, tags: ['Sports', 'Multiplayer'], hue: 120, image: 'pool',
      tagline: 'Realistic 8-ball pool versus a friend or the computer.', author: 'Chen Shmilovich', license: 'MIT', repo: 'henshmi/Classic-Pool-Game', controls: 'Mouse to aim, hold to power' }),
    port({ id: 'solitaire', title: 'Solitaire', popular: true, tags: ['Cards', 'Classic'], hue: 140, image: 'solitaire',
      tagline: 'Classic Klondike. Drag cards, build the foundations, beat your time.', author: 'Justin Hatzimalis', license: 'MIT', repo: 'jhatzimalis/solitaire', controls: 'Drag or click cards' }),
    port({ id: 'minesweeper', title: 'Minesweeper', popular: true, tags: ['Puzzle', 'Classic'], hue: 210, image: 'minesweeper',
      tagline: 'Clear the field without hitting a mine. Three difficulties.', author: 'Peter Dematté', license: 'MIT', repo: 'pitpik/minesweeper', controls: 'Click to reveal · right-click to flag' }),
    port({ id: 'sudoku', title: 'Mini Sudoku', popular: true, tags: ['Puzzle', 'Classic'], hue: 250, image: 'sudoku',
      tagline: 'Quick 6×6 sudoku with hints, notes and four difficulties.', author: 'Valentyn Kolesnikov', license: 'MIT', repo: 'minisudoku/minisudoku.github.io', controls: 'Click a cell, pick a number' }),
    port({ id: 'chess', title: 'Chess', popular: true, tags: ['Board', 'Strategy'], hue: 30, image: 'chess',
      tagline: 'Play chess against a built-in engine.', author: 'Attogram Project', license: 'MIT', repo: 'attogram/chess', controls: 'Click to move pieces' }),
    port({ id: 'asteroids', title: 'Asteroids', popular: true, tags: ['Shooter', 'Classic'], hue: 280, thumb: 'void', image: 'asteroids',
      tagline: 'Vector-style rock blasting in deep space.', author: 'Doug McInnes', license: 'MIT', repo: 'dmcinnes/HTML5-Asteroids', controls: 'Arrows to fly, Space to shoot' }),
    port({ id: 'particle-clicker', title: 'Particle Clicker', popular: true, tags: ['Idle'], hue: 15, image: 'particle-clicker',
      tagline: 'Run a physics lab and discover the universe, one click at a time.', author: 'CERN Webfest team', license: 'MIT', repo: 'particle-clicker/particle-clicker', controls: 'Mouse' }),
    port({ id: 'radius-raid', title: 'Radius Raid', popular: true, tags: ['Shooter'], hue: 340, image: 'radius-raid',
      tagline: 'Twin-stick space shooter packed with power-ups.', author: 'Jack Rugile', license: 'MIT', repo: 'jackrugile/radius-raid-js13k', controls: 'WASD to move, mouse to aim & fire' }),
    port({ id: 'wordle', title: 'Wordle+', popular: true, tags: ['Puzzle', 'Word'], hue: 120, image: 'wordle',
      tagline: 'Guess the five-letter word in six tries — infinite games.', author: 'MikhaD', license: 'GPL-3.0', repo: 'MikhaD/wordle', controls: 'Type your guess · Enter' }),
    port({ id: 'n-gon', title: 'n-gon', popular: true, tags: ['Shooter', 'Platformer'], hue: 210, image: 'n-gon',
      tagline: 'Physics roguelike: pick up wild tech and blast through levels.', author: 'landgreen', license: 'GPL-3.0', repo: 'landgreen/n-gon', controls: 'WASD · mouse to aim & fire' }),
    port({ id: 'fluid', title: 'Fluid Simulator', popular: true, tags: ['Chill', 'Toy'], hue: 300, image: 'fluid',
      tagline: 'Swirl glowing liquid with your mouse. Weirdly relaxing.', author: 'Pavel Dobryakov', license: 'MIT', repo: 'PavelDoGreat/WebGL-Fluid-Simulation', controls: 'Drag to paint · Space for splats' }),
    port({ id: 'flappy-2048', title: 'Flappy 2048', popular: true, tags: ['Arcade', 'Puzzle'], hue: 40, image: 'flappy-2048',
      tagline: '2048, but you’re flapping through the tiles.', author: 'hczhcz', license: 'MIT', repo: 'hczhcz/Flappy-2048', controls: 'Space / click to flap' }),
    port({ id: 'space-company', title: 'Space Company', popular: true, tags: ['Idle', 'Strategy'], hue: 230, image: 'space-company',
      tagline: 'Build a space empire from a single mine to the stars.', author: 'sparticle999', license: 'MIT', repo: 'sparticle999/SpaceCompany', controls: 'Mouse' }),
    // ----- More games -----
    port({ id: 'q1k3', title: 'Q1K3', tags: ['Shooter', '3D'], hue: 15, image: 'q1k3',
      tagline: 'A tiny retro FPS in just 13 KB. Grab the nailgun and clear the base.', author: 'Dominic Szablewski', license: 'MIT', repo: 'phoboslab/q1k3', controls: 'WASD + mouse · click to shoot' }),
    port({ id: 'space-huggers', title: 'Space Huggers', tags: ['Shooter', 'Platformer'], hue: 290, image: 'space-huggers',
      tagline: 'Run-and-gun through destructible alien worlds.', author: 'Frank Force', license: 'GPL-3.0', repo: 'KilledByAPixel/SpaceHuggers', controls: 'Arrows / WASD · Z or click to shoot' }),
    port({ id: 'astray', title: 'Astray', tags: ['Puzzle', '3D'], hue: 50, thumb: 'maze', image: 'astray',
      tagline: 'Roll a glowing ball through dark 3D labyrinths.', author: 'Rye Terrell', license: 'Unlicense', repo: 'wwwtyro/Astray', controls: 'Arrow keys / WASD' }),
    port({ id: 'underrun', title: 'Underrun', tags: ['Shooter', '3D'], hue: 20, image: 'underrun',
      tagline: 'Twin-stick shooter in a dark, glowing facility.', author: 'Dominic Szablewski', license: 'MIT', repo: 'phoboslab/underrun', entry: 'index-debug.html', controls: 'WASD to move, mouse to shoot' }),
    port({ id: 'hearts', title: 'Hearts', tags: ['Cards'], hue: 140, image: 'hearts',
      tagline: 'The classic trick-taking card game against three AI players.', author: 'Yujian Yao', license: 'BSD-2-Clause', repo: 'yyjhao/html5-hearts', controls: 'Mouse' }),
    port({ id: 'platformer', title: 'Tiny Platformer', tags: ['Platformer'], hue: 15, image: 'platformer',
      tagline: 'Jump, stomp monsters and grab every coin.', author: 'Jake Gordon', license: 'MIT', repo: 'jakesgordon/javascript-tiny-platformer', controls: 'Left/Right to move, Space to jump' }),
    port({ id: 'delta', title: 'Delta', tags: ['Shooter'], hue: 260, image: 'delta',
      tagline: 'Retro wave-based space shooter.', author: 'Jake Gordon', license: 'MIT (music removed)', repo: 'jakesgordon/javascript-delta', controls: 'Arrows to move, Space to shoot' }),
    port({ id: 'dead-valley', title: 'Dead Valley', tags: ['Survival'], hue: 70, image: 'dead-valley',
      tagline: 'Top-down zombie survival in an abandoned town.', author: 'Doug McInnes', license: 'CC BY-NC 4.0', repo: 'dmcinnes/dead-valley', controls: 'Arrows · Space · E to enter cars' }),
    port({ id: 'paintrun', title: 'Paint Run', tags: ['Puzzle'], hue: 280, image: 'paintrun',
      tagline: 'Paint every tile of the maze without running out of moves.', author: 'Ashley Boucher', license: 'MIT', repo: 'ahl389/paint-run2', controls: 'Arrow keys' }),
    port({ id: 'garbage', title: 'Hyperspace Garbage Collection', tags: ['Arcade'], hue: 0, image: 'garbage',
      tagline: 'Sweep space junk with a gravity-powered ship.', author: 'razh', license: 'MIT', repo: 'razh/game-off-2013', controls: 'Mouse' }),
    port({ id: 'pond', title: 'The Pond', tags: ['Arcade', 'Chill'], hue: 30, image: 'pond',
      tagline: 'Grow your fish by eating others. Calm and beautiful.', author: 'Zolmeister', license: 'GPL-3.0', repo: 'attogram/pond-lite', controls: 'Mouse / touch' }),
    port({ id: 'taptaptap', title: 'Tap Tap Tap', tags: ['Arcade'], hue: 190, image: 'taptaptap',
      tagline: 'Tap to the rhythm — every tap matters.', author: 'Mahdi Al-Farra', license: 'MIT', repo: 'MahdiF/taptaptap', entry: 'play/index.html', controls: 'Click / tap' }),
    port({ id: 'thehouse', title: 'The House', tags: ['Puzzle', 'Chill'], hue: 195, image: 'thehouse',
      tagline: 'A short, strange puzzle about a house in your head.', author: 'Artur Kot', license: 'MIT', repo: 'arturkot/the-house-game', entry: '', controls: 'Mouse' }),
    port({ id: 'twisty', title: 'Twisty Polyhedra', tags: ['Puzzle', '3D'], hue: 90, image: 'twisty',
      tagline: 'Rubik’s-style puzzles on wild 3D shapes.', author: 'Aditya Ravi Mishra', license: 'GPL-3.0', repo: 'aditya-r-m/twisty-polyhedra', controls: 'Drag to rotate' }),
    port({ id: 'black-hole-square', title: 'Black Hole Square', tags: ['Puzzle'], hue: 190, image: 'black-hole-square',
      tagline: 'Slide blocks into the black hole. Minimal, clever, satisfying.', author: 'Quinten Clause', license: 'MIT', repo: 'Quinten/black-hole-square', controls: 'Swipe / arrow keys' }),
    port({ id: 'ns-shaft', title: 'NS-Shaft', tags: ['Arcade', 'Classic'], hue: 0, image: 'ns-shaft',
      tagline: 'Drop down platform after platform — don’t hit the spikes.', author: 'iPel', license: 'Apache-2.0', repo: 'iPel/NS-SHAFT', controls: 'Left / Right arrows' }),
    port({ id: 'dante', title: 'Dante', tags: ['Adventure', '3D'], hue: 15, image: 'dante',
      tagline: 'Deliver lost souls through a 3D inferno. A js13k winner.', author: 'Salvatore Previti', license: 'MIT', repo: 'SalvatorePreviti/js13k-2022', controls: 'WASD / arrows · E to interact' }),
    port({ id: 'xx142', title: 'xx142-b2.exe', tags: ['Platformer', 'Puzzle'], hue: 140, image: 'xx142',
      tagline: 'Hack an alien network before the antivirus deletes you.', author: 'Ben Clark & Salvatore Previti', license: 'MIT', repo: 'bencoder/js13k-2019', controls: 'WASD / arrows · Backspace to kill' }),
    port({ id: 'edge-not-found', title: 'Edge Not Found', tags: ['Puzzle'], hue: 0, image: 'edge-not-found',
      tagline: 'A brain-bending puzzle about a world that wraps around.', author: 'Tom Hermans', license: 'MIT', repo: 'Auroriax/js13k-2020', controls: 'Arrows / WASD' }),
    port({ id: 'littlejs-puzzle', title: 'Match Puzzle', tags: ['Puzzle'], hue: 320, image: 'littlejs-puzzle',
      tagline: 'Swap tiles to match three and chain combos.', author: 'Frank Force (LittleJS)', license: 'MIT', repo: 'KilledByAPixel/LittleJS', dir: 'littlejs', entry: 'examples/puzzle/index.html', controls: 'Click / drag' }),
    port({ id: 'littlejs-platformer', title: 'Pixel Blaster', tags: ['Platformer', 'Shooter'], hue: 200, image: 'littlejs-platformer',
      tagline: 'Blast through a destructible pixel world.', author: 'Frank Force (LittleJS)', license: 'MIT', repo: 'KilledByAPixel/LittleJS', dir: 'littlejs', entry: 'examples/platformer/index.html', controls: 'Arrows / WASD · Z to shoot' }),
    // ----- From the Nova repo (games/<folder>/) -----
    port({ id: '1', title: '1', tags: ['Puzzle'], hue: 4, image: '1', dir: '../1',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: '10-minutes-till-dawn', title: '10 Minutes Till Dawn', tags: ['Arcade'], hue: 201, image: '10-minutes-till-dawn', dir: '../10-minutes-till-dawn',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: '100ng', title: '100 Player Pong', tags: ['Arcade'], hue: 11, image: '100ng', dir: '../100ng',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: '1v1lol', title: '1v1.LOL', tags: ['Shooter'], hue: 72, image: '1v1lol', dir: '../1v1lol',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: '1v1space', title: '1v1.space', tags: ['Shooter'], hue: 117, image: '1v1space', dir: '../1v1space',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: '2048-multitask', title: '2048 Multitask', tags: ['Puzzle'], hue: 258, image: '2048-multitask', dir: '../2048-multitask',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: '4x4-offroader', title: '4x4 Offroader', tags: ['Racing'], hue: 274, image: '4x4-offroader', dir: '../4x4-offroader',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: '9007199254740992', title: '9007199254740992', tags: ['Puzzle'], hue: 86, image: '9007199254740992', dir: '../9007199254740992',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'achievementunlocked', title: 'Achievement Unlocked', tags: ['Puzzle'], hue: 13, image: 'achievementunlocked', dir: '../achievementunlocked',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'adofai', title: 'A Dance of Fire And Ice', tags: ['Music'], hue: 243, image: 'adofai', dir: '../adofai',
      tagline: 'Stay on the beat.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / Space' }),
    port({ id: 'adrenalinechallenge', title: 'Adrenaline Challenge', tags: ['Arcade'], hue: 215, image: 'adrenalinechallenge', dir: '../adrenalinechallenge',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'adventure-drivers', title: 'Adventure Drivers', tags: ['Racing'], hue: 165, image: 'adventure-drivers', dir: '../adventure-drivers',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'ages-of-conflict', title: 'Ages of Conflict', tags: ['Strategy'], hue: 326, image: 'ages-of-conflict', dir: '../ages-of-conflict',
      tagline: 'Plan smart and outlast the opposition.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'alienhominid', title: 'Alien Hominid', tags: ['Arcade'], hue: 214, image: 'alienhominid', dir: '../alienhominid',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'amanda-adventurer', title: 'Amanda The Adventurer', tags: ['Horror'], hue: 200, image: 'amanda-adventurer', dir: '../amanda-adventurer',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'amazing-strange-rope-police-vice-spider', title: 'Amazing Strange Rope Police', tags: ['Arcade'], hue: 189, image: 'amazing-strange-rope-police-vice-spider', dir: '../amazing-strange-rope-police-vice-spider',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'amidst-the-clouds', title: 'Amidst the Clouds', tags: ['Adventure'], hue: 288, image: 'amidst-the-clouds', dir: '../amidst-the-clouds',
      tagline: 'Explore a whole world from your browser.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'among-us', title: 'Among Us', tags: ['Adventure'], hue: 114, image: 'among-us', dir: '../among-us',
      tagline: 'Explore a whole world from your browser.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'angry-birds', title: 'Angry Birds', tags: ['Arcade'], hue: 23, image: 'angry-birds', dir: '../angry-birds',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'angry-sharks', title: 'Angry Sharks', tags: ['Arcade'], hue: 263, image: 'angry-sharks', dir: '../angry-sharks',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'aquapark-slides', title: 'Aquapark Slides', tags: ['Arcade'], hue: 182, image: 'aquapark-slides', dir: '../aquapark-slides',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'arcade-neon-golf', title: 'Arcade Neon Golf', tags: ['Sports'], hue: 83, image: 'arcade-neon-golf', dir: '../arcade-neon-golf',
      tagline: 'Pick up and play, then go for the win.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / keyboard' }),
    port({ id: 'avalanche', title: 'Avalanche', tags: ['Arcade'], hue: 58, image: 'avalanche', dir: '../avalanche',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'awesometanks', title: 'Awesome Tanks', tags: ['Shooter'], hue: 205, image: 'awesometanks', dir: '../awesometanks',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'awesometanks2', title: 'Awesome Tanks', tags: ['Shooter'], hue: 285, image: 'awesometanks2', dir: '../awesometanks2',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'backrooms', title: 'Backrooms', tags: ['Horror'], hue: 302, image: 'backrooms', dir: '../backrooms',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'bad-ice-cream', title: 'Bad Ice Cream', tags: ['Platformer'], hue: 349, image: 'bad-ice-cream', dir: '../bad-ice-cream',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'bad-ice-cream-2', title: 'Bad Ice Cream 2', tags: ['Platformer'], hue: 86, image: 'bad-ice-cream-2', dir: '../bad-ice-cream-2',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'bad-ice-cream-3', title: 'Bad Ice Cream 3', tags: ['Platformer'], hue: 265, image: 'bad-ice-cream-3', dir: '../bad-ice-cream-3',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'bad-monday-sim', title: 'Bad Monday Simulator', tags: ['Arcade'], hue: 305, image: 'bad-monday-sim', dir: '../bad-monday-sim',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'bad-parenting', title: 'Bad Parenting', tags: ['Horror'], hue: 169, image: 'bad-parenting', dir: '../bad-parenting',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'baldis-basics', title: 'Baldi\'s Basics', tags: ['Horror'], hue: 184, image: 'baldis-basics', dir: '../baldis-basics',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'ballistic-chickens', title: 'Ballistic Chickens', tags: ['Arcade'], hue: 147, image: 'ballistic-chickens', dir: '../ballistic-chickens',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'baseball-bros', title: 'Baseball Bros', tags: ['Sports'], hue: 342, image: 'baseball-bros', dir: '../baseball-bros',
      tagline: 'Pick up and play, then go for the win.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / keyboard' }),
    port({ id: 'basket-random', title: 'Basket Random', tags: ['Sports'], hue: 349, image: 'basket-random', dir: '../basket-random',
      tagline: 'Pick up and play, then go for the win.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / keyboard' }),
    port({ id: 'basketball-stars', title: 'Basketball Stars', tags: ['Sports'], hue: 138, image: 'basketball-stars', dir: '../basketball-stars',
      tagline: 'Pick up and play, then go for the win.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / keyboard' }),
    port({ id: 'basketbros-io', title: 'Basket Bros', tags: ['Sports'], hue: 252, image: 'basketbros-io', dir: '../basketbros-io',
      tagline: 'Pick up and play, then go for the win.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / keyboard' }),
    port({ id: 'battleforgondor', title: 'Battle for Gondor', tags: ['Strategy'], hue: 159, image: 'battleforgondor', dir: '../battleforgondor',
      tagline: 'Plan smart and outlast the opposition.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'bendy', title: 'Bendy and the Ink Machine', tags: ['Horror'], hue: 201, image: 'bendy', dir: '../bendy',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'bergentruck201x', title: 'Bergentruck 201X', tags: ['Platformer'], hue: 276, image: 'bergentruck201x', dir: '../bergentruck201x',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'bigredbutton', title: 'Big Red Button', tags: ['Arcade'], hue: 204, image: 'bigredbutton', dir: '../bigredbutton',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'bitts', title: 'Big Ice Tower Tiny Square', tags: ['Platformer'], hue: 301, image: 'bitts', dir: '../bitts',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'blackknight', title: 'Black Knight', tags: ['Platformer'], hue: 121, image: 'blackknight', dir: '../blackknight',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'block-blast', title: 'Block Blast', tags: ['Puzzle'], hue: 81, image: 'block-blast', dir: '../block-blast',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'bloodmoney', title: 'Bloodmoney!', tags: ['Horror'], hue: 37, image: 'bloodmoney', dir: '../bloodmoney',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'bloonstd', title: 'Bloons TD', tags: ['Strategy'], hue: 2, image: 'bloonstd', dir: '../bloonstd',
      tagline: 'Plan smart and outlast the opposition.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'bloonstd2', title: 'BloonsTD 2', tags: ['Strategy'], hue: 48, image: 'bloonstd2', dir: '../bloonstd2',
      tagline: 'Plan smart and outlast the opposition.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'bloxors', title: 'Bloxors', tags: ['Puzzle'], hue: 270, image: 'bloxors', dir: '../bloxors',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'bntts', title: 'Big NEON Tower Tiny Square', tags: ['Platformer'], hue: 342, image: 'bntts', dir: '../bntts',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'bobtherobber2', title: 'Bob The Robber 2', tags: ['Arcade'], hue: 91, image: 'bobtherobber2', dir: '../bobtherobber2',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'bowmasters', title: 'Bowmasters', tags: ['Shooter'], hue: 222, image: 'bowmasters', dir: '../bowmasters',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'boxhead2play', title: 'Boxhead', tags: ['Shooter'], hue: 292, image: 'boxhead2play', dir: '../boxhead2play',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'boxing-random', title: 'Boxing Random', tags: ['Sports'], hue: 150, image: 'boxing-random', dir: '../boxing-random',
      tagline: 'Pick up and play, then go for the win.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / keyboard' }),
    port({ id: 'breakingthebank', title: 'Breaking The Bank', tags: ['Puzzle'], hue: 57, image: 'breakingthebank', dir: '../breakingthebank',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'btts', title: 'Big Tower Tiny Square', tags: ['Platformer'], hue: 258, image: 'btts', dir: '../btts',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'btts2', title: 'Big Tower Tiny Square 2', tags: ['Platformer'], hue: 8, image: 'btts2', dir: '../btts2',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'buckshot-roulette', title: 'Buckshot Roulette', tags: ['Horror'], hue: 221, image: 'buckshot-roulette', dir: '../buckshot-roulette',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'burger-and-frights', title: 'Burger & Frights', tags: ['Horror'], hue: 236, image: 'burger-and-frights', dir: '../burger-and-frights',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'cannon-basketball-4', title: 'Cannon Basketball 4', tags: ['Sports'], hue: 261, image: 'cannon-basketball-4', dir: '../cannon-basketball-4',
      tagline: 'Pick up and play, then go for the win.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / keyboard' }),
    port({ id: 'canyondefense', title: 'Canyon Defense', tags: ['Strategy'], hue: 107, image: 'canyondefense', dir: '../canyondefense',
      tagline: 'Plan smart and outlast the opposition.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'capybara-clicker', title: 'Capybara Clicker', tags: ['Idle'], hue: 92, image: 'capybara-clicker', dir: '../capybara-clicker',
      tagline: 'Click, upgrade and watch the numbers climb.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'cars-simulator', title: 'Cars Simulator', tags: ['Racing'], hue: 233, image: 'cars-simulator', dir: '../cars-simulator',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'cat-ninja', title: 'Cat Ninja', tags: ['Platformer'], hue: 242, image: 'cat-ninja', dir: '../cat-ninja',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'cell-machine', title: 'Cell Machine', tags: ['Sandbox'], hue: 77, image: 'cell-machine', dir: '../cell-machine',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'champion-island', title: 'Champion Island', tags: ['Arcade'], hue: 320, image: 'champion-island', dir: '../champion-island',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'championarcher', title: 'Champion Archer', tags: ['Shooter'], hue: 57, image: 'championarcher', dir: '../championarcher',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'circlo', title: 'circloO', tags: ['Puzzle'], hue: 211, image: 'circlo', dir: '../circlo',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'clash-royale', title: 'Clash Royale', tags: ['Strategy'], hue: 351, image: 'clash-royale', dir: '../clash-royale',
      tagline: 'Plan smart and outlast the opposition.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'club-penguin', title: 'Club Penguin', tags: ['Adventure'], hue: 128, image: 'club-penguin', dir: '../club-penguin',
      tagline: 'Explore a whole world from your browser.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'cluster-rush', title: 'Cluster Rush', tags: ['Puzzle'], hue: 354, image: 'cluster-rush', dir: '../cluster-rush',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'cnpingpong', title: 'Table Tennis Ultimate Tournament', tags: ['Sports'], hue: 102, image: 'cnpingpong', dir: '../cnpingpong',
      tagline: 'Pick up and play, then go for the win.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / keyboard' }),
    port({ id: 'connect3', title: 'Connect 3', tags: ['Puzzle'], hue: 238, image: 'connect3', dir: '../connect3',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'cookie-clicker', title: 'Cookie Clicker', tags: ['Idle'], hue: 97, image: 'cookie-clicker', dir: '../cookie-clicker',
      tagline: 'Click, upgrade and watch the numbers climb.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'core-ball', title: 'Core Ball', tags: ['Music'], hue: 184, image: 'core-ball', dir: '../core-ball',
      tagline: 'Stay on the beat.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / Space' }),
    port({ id: 'craftmine', title: 'CraftMine', tags: ['Sandbox'], hue: 306, image: 'craftmine', dir: '../craftmine',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'crazycattle3d', title: 'CrazyCattle3D', tags: ['Arcade'], hue: 226, image: 'crazycattle3d', dir: '../crazycattle3d',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'creativekillchamber', title: 'Creative Kill Chamber', tags: ['Sandbox'], hue: 122, image: 'creativekillchamber', dir: '../creativekillchamber',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'crossyroad', title: 'Crossy Road', tags: ['Arcade'], hue: 212, image: 'crossyroad', dir: '../crossyroad',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'csgo-clicker', title: 'CS:GO Clicker', tags: ['Shooter', 'Idle'], hue: 83, image: 'csgo-clicker', dir: '../csgo-clicker',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'ctr', title: 'Cut the Rope', tags: ['Puzzle'], hue: 256, image: 'ctr', dir: '../ctr',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'ctr-holiday', title: 'Cut the Rope: Holiday Gift', tags: ['Puzzle'], hue: 277, image: 'ctr-holiday', dir: '../ctr-holiday',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'ctr-tr', title: 'Cut the Rope: Time Travel', tags: ['Puzzle'], hue: 305, image: 'ctr-tr', dir: '../ctr-tr',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'cubefield', title: 'Cubefield', tags: ['Arcade'], hue: 324, image: 'cubefield', dir: '../cubefield',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'cupcake2048', title: '2048 Cupcakes', tags: ['Puzzle'], hue: 245, image: 'cupcake2048', dir: '../cupcake2048',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'cuphead', title: 'Cuphead', tags: ['Platformer'], hue: 157, image: 'cuphead', dir: '../cuphead',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'deal-or-no-deal', title: 'Deal or No Deal', tags: ['Arcade'], hue: 194, image: 'deal-or-no-deal', dir: '../deal-or-no-deal',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'death-run-3d', title: 'Death Run 3D', tags: ['Platformer'], hue: 31, image: 'death-run-3d', dir: '../death-run-3d',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'defend-the-tank', title: 'Defend the Tank', tags: ['Shooter', 'Strategy'], hue: 30, image: 'defend-the-tank', dir: '../defend-the-tank',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'deltarune', title: 'Deltarune', tags: ['Adventure'], hue: 153, image: 'deltarune', dir: '../deltarune',
      tagline: 'Explore a whole world from your browser.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'doctor-acorn2', title: 'Doctor Acorn 2', tags: ['Puzzle'], hue: 124, image: 'doctor-acorn2', dir: '../doctor-acorn2',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'doge2048', title: 'DOGE 2048', tags: ['Puzzle'], hue: 250, image: 'doge2048', dir: '../doge2048',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'dogeminer', title: 'Dogeminer', tags: ['Idle'], hue: 87, image: 'dogeminer', dir: '../dogeminer',
      tagline: 'Click, upgrade and watch the numbers climb.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'dogeminer2', title: 'Dogeminer 2', tags: ['Idle'], hue: 279, image: 'dogeminer2', dir: '../dogeminer2',
      tagline: 'Click, upgrade and watch the numbers climb.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'doodle-jump', title: 'Doodle Jump', tags: ['Platformer'], hue: 215, image: 'doodle-jump', dir: '../doodle-jump',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'doublewires', title: 'Double Wires', tags: ['Arcade'], hue: 218, image: 'doublewires', dir: '../doublewires',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'dragon-vs-bricks', title: 'Dragon Vs Bricks', tags: ['Arcade'], hue: 91, image: 'dragon-vs-bricks', dir: '../dragon-vs-bricks',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'draw-the-hill', title: 'Draw the Hill', tags: ['Arcade'], hue: 63, image: 'draw-the-hill', dir: '../draw-the-hill',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'drift-hunters', title: 'Drift Hunters', tags: ['Racing'], hue: 350, image: 'drift-hunters', dir: '../drift-hunters',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'drive-mad', title: 'Drive Mad', tags: ['Racing'], hue: 244, image: 'drive-mad', dir: '../drive-mad',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'drive-mad-2', title: 'Drive Mad 2', tags: ['Racing'], hue: 355, image: 'drive-mad-2', dir: '../drive-mad-2',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'ducklife1', title: 'Duck Life', tags: ['Puzzle'], hue: 353, image: 'ducklife1', dir: '../ducklife1',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'ducklife2', title: 'Duck Life 2', tags: ['Arcade'], hue: 176, image: 'ducklife2', dir: '../ducklife2',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'ducklife3', title: 'Duck Life 3', tags: ['Arcade'], hue: 355, image: 'ducklife3', dir: '../ducklife3',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'ducklife4', title: 'Duck Life 4', tags: ['Arcade'], hue: 170, image: 'ducklife4', dir: '../ducklife4',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'edge-surf', title: 'Edge Surf', tags: ['Arcade'], hue: 171, image: 'edge-surf', dir: '../edge-surf',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'eel-slap', title: 'Eel Slap!', tags: ['Arcade'], hue: 146, image: 'eel-slap', dir: '../eel-slap',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'elasticman', title: 'Elastic Man', tags: ['Platformer'], hue: 340, image: 'elasticman', dir: '../elasticman',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'endlesswar3', title: 'Endless War 3', tags: ['Shooter'], hue: 4, image: 'endlesswar3', dir: '../endlesswar3',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'escapingtheprison', title: 'Escaping the Prison', tags: ['Puzzle'], hue: 3, image: 'escapingtheprison', dir: '../escapingtheprison',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'evil-glitch', title: 'Evil Glitch', tags: ['Arcade'], hue: 179, image: 'evil-glitch', dir: '../evil-glitch',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'evolution', title: 'Evolution', tags: ['Idle'], hue: 150, image: 'evolution', dir: '../evolution',
      tagline: 'Click, upgrade and watch the numbers climb.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'evoworld', title: 'EvoWorld.io', tags: ['Adventure'], hue: 245, image: 'evoworld', dir: '../evoworld',
      tagline: 'Explore a whole world from your browser.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'exo', title: 'Exo', tags: ['Platformer'], hue: 37, image: 'exo', dir: '../exo',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'factoryballs', title: 'Factory Balls Forever', tags: ['Puzzle'], hue: 101, image: 'factoryballs', dir: '../factoryballs',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'fancypantsadventures', title: 'Fancy Pants Adventures', tags: ['Platformer'], hue: 229, image: 'fancypantsadventures', dir: '../fancypantsadventures',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'fancypantsadventures2', title: 'Fancy Pants Adventures 2', tags: ['Platformer'], hue: 357, image: 'fancypantsadventures2', dir: '../fancypantsadventures2',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'fancypantsadventures3', title: 'Fancy Pants Adventures 3', tags: ['Platformer'], hue: 178, image: 'fancypantsadventures3', dir: '../fancypantsadventures3',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'fears-to-fathom', title: 'Fears to Fathom: Home Alone', tags: ['Horror'], hue: 128, image: 'fears-to-fathom', dir: '../fears-to-fathom',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'fireboywatergirlforesttemple', title: 'Fireboy & Watergirl - Forest Temple', tags: ['Platformer'], hue: 174, image: 'fireboywatergirlforesttemple', dir: '../fireboywatergirlforesttemple',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'flappybird', title: 'Flappy Bird', tags: ['Arcade'], hue: 214, image: 'flappybird', dir: '../flappybird',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'flashtetris', title: 'Flash Tetris', tags: ['Puzzle'], hue: 28, image: 'flashtetris', dir: '../flashtetris',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'flippy-fish', title: 'Flippy Fish', tags: ['Arcade'], hue: 214, image: 'flippy-fish', dir: '../flippy-fish',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'fnaf', title: 'Five Nights at Freddy\'s', tags: ['Horror'], hue: 214, image: 'fnaf', dir: '../fnaf',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'fnaf-sl', title: 'Five Nights at Freddy\'s Sister Location', tags: ['Horror'], hue: 126, image: 'fnaf-sl', dir: '../fnaf-sl',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'fnaf-ucn', title: 'Five Nights at Freddy\'s UCN', tags: ['Horror'], hue: 201, image: 'fnaf-ucn', dir: '../fnaf-ucn',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'fnaf2', title: 'Five Nights at Freddy\'s 2', tags: ['Horror'], hue: 292, image: 'fnaf2', dir: '../fnaf2',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'fnaf3', title: 'Five Nights at Freddy\'s 3', tags: ['Horror'], hue: 111, image: 'fnaf3', dir: '../fnaf3',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'fnaf4', title: 'Five Nights at Freddy\'s 4', tags: ['Horror'], hue: 294, image: 'fnaf4', dir: '../fnaf4',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'fnaw', title: 'Five Nights at Winston\'s', tags: ['Horror'], hue: 49, image: 'fnaw', dir: '../fnaw',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'fnf-hit-single-real', title: 'FNF: Hit Single Real', tags: ['Music'], hue: 51, image: 'fnf-hit-single-real', dir: '../fnf-hit-single-real',
      tagline: 'Stay on the beat.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / Space' }),
    port({ id: 'football-bros', title: 'Football Bros', tags: ['Sports'], hue: 41, image: 'football-bros', dir: '../football-bros',
      tagline: 'Pick up and play, then go for the win.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / keyboard' }),
    port({ id: 'freeriderjumps', title: 'Free Rider Jumps', tags: ['Racing', 'Platformer'], hue: 262, image: 'freeriderjumps', dir: '../freeriderjumps',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'fridaynightfunkin', title: 'Friday Night Funkin\'', tags: ['Music'], hue: 213, image: 'fridaynightfunkin', dir: '../fridaynightfunkin',
      tagline: 'Stay on the beat.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / Space' }),
    port({ id: 'froggys-battle', title: 'Froggy\'s battle', tags: ['Arcade'], hue: 349, image: 'froggys-battle', dir: '../froggys-battle',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'fruitninja', title: 'Fruit Ninja', tags: ['Platformer'], hue: 71, image: 'fruitninja', dir: '../fruitninja',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'frying-nemo', title: 'Frying Nemo', tags: ['Arcade'], hue: 286, image: 'frying-nemo', dir: '../frying-nemo',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'game-inside', title: 'Game Inside a Game', tags: ['Puzzle'], hue: 194, image: 'game-inside', dir: '../game-inside',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'generic-fishing-game', title: 'Generic Fishing Game', tags: ['Arcade'], hue: 186, image: 'generic-fishing-game', dir: '../generic-fishing-game',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'geodash', title: 'Geometry Dash', tags: ['Music'], hue: 162, image: 'geodash', dir: '../geodash',
      tagline: 'Stay on the beat.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / Space' }),
    port({ id: 'geodash-lite', title: 'Geometry Dash Lite', tags: ['Music'], hue: 73, image: 'geodash-lite', dir: '../geodash-lite',
      tagline: 'Stay on the beat.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / Space' }),
    port({ id: 'georgeandtheprinter', title: 'George and the Printer', tags: ['Puzzle'], hue: 284, image: 'georgeandtheprinter', dir: '../georgeandtheprinter',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'getaway-shootout', title: 'Getaway Shootout', tags: ['Shooter'], hue: 261, image: 'getaway-shootout', dir: '../getaway-shootout',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'getting-over-it', title: 'Getting Over It', tags: ['Platformer'], hue: 118, image: 'getting-over-it', dir: '../getting-over-it',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'gimme-the-airpod', title: 'Gimme the Airpod', tags: ['Arcade'], hue: 152, image: 'gimme-the-airpod', dir: '../gimme-the-airpod',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'glass-city', title: 'Glass City', tags: ['Arcade'], hue: 181, image: 'glass-city', dir: '../glass-city',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'go-ball', title: 'Go Ball', tags: ['Arcade'], hue: 19, image: 'go-ball', dir: '../go-ball',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'goodnight', title: 'Goodnight', tags: ['Horror'], hue: 94, image: 'goodnight', dir: '../goodnight',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'google-feud', title: 'Google Feud', tags: ['Puzzle'], hue: 113, image: 'google-feud', dir: '../google-feud',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'google-snake', title: 'Google Snake', tags: ['Arcade'], hue: 55, image: 'google-snake', dir: '../google-snake',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'granny', title: 'Granny', tags: ['Horror'], hue: 330, image: 'granny', dir: '../granny',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'granny2', title: 'Granny 2', tags: ['Horror'], hue: 32, image: 'granny2', dir: '../granny2',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'gravity-soccer', title: 'Gravity Soccer', tags: ['Sports'], hue: 351, image: 'gravity-soccer', dir: '../gravity-soccer',
      tagline: 'Pick up and play, then go for the win.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / keyboard' }),
    port({ id: 'greybox', title: 'Grey-Box Testing', tags: ['Puzzle'], hue: 91, image: 'greybox', dir: '../greybox',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'grindcraft', title: 'Grindcraft', tags: ['Sandbox', 'Idle'], hue: 49, image: 'grindcraft', dir: '../grindcraft',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'gunspin', title: 'Gun Spin', tags: ['Shooter'], hue: 289, image: 'gunspin', dir: '../gunspin',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'half-life', title: 'Half-Life', tags: ['Shooter'], hue: 265, image: 'half-life', dir: '../half-life',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'handshakes', title: 'Handshakes', tags: ['Arcade'], hue: 87, image: 'handshakes', dir: '../handshakes',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'happy-hop', title: 'Happy Hop', tags: ['Platformer'], hue: 203, image: 'happy-hop', dir: '../happy-hop',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'hba', title: 'Hover Bot Arena', tags: ['Arcade'], hue: 42, image: 'hba', dir: '../hba',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'helicopter', title: 'Helicopter', tags: ['Arcade'], hue: 216, image: 'helicopter', dir: '../helicopter',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'hexempire', title: 'Hex Empire', tags: ['Strategy'], hue: 66, image: 'hexempire', dir: '../hexempire',
      tagline: 'Plan smart and outlast the opposition.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'hillclimbracing', title: 'Hill Climb Racing', tags: ['Racing'], hue: 129, image: 'hillclimbracing', dir: '../hillclimbracing',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'hollow-knight', title: 'Hollow Knight', tags: ['Platformer'], hue: 232, image: 'hollow-knight', dir: '../hollow-knight',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'house-of-hazards', title: 'House of Hazards', tags: ['Arcade'], hue: 131, image: 'house-of-hazards', dir: '../house-of-hazards',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'human-expenditure-program', title: 'Human Expenditure Program', tags: ['Adventure'], hue: 303, image: 'human-expenditure-program', dir: '../human-expenditure-program',
      tagline: 'Explore a whole world from your browser.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'hungry-lamu', title: 'Hungry Lamu', tags: ['Arcade'], hue: 130, image: 'hungry-lamu', dir: '../hungry-lamu',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'idle-breakout', title: 'Idle Breakout', tags: ['Idle'], hue: 323, image: 'idle-breakout', dir: '../idle-breakout',
      tagline: 'Click, upgrade and watch the numbers climb.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'idle-shark', title: 'Idle Shark', tags: ['Idle'], hue: 71, image: 'idle-shark', dir: '../idle-shark',
      tagline: 'Click, upgrade and watch the numbers climb.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'impossiblequiz', title: 'The Impossible Quiz', tags: ['Puzzle'], hue: 241, image: 'impossiblequiz', dir: '../impossiblequiz',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'interactivebuddy', title: 'Interactive Buddy', tags: ['Arcade'], hue: 17, image: 'interactivebuddy', dir: '../interactivebuddy',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'jetpack-joyride', title: 'Jetpack Joyride', tags: ['Arcade'], hue: 228, image: 'jetpack-joyride', dir: '../jetpack-joyride',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'just-fall', title: 'Just Fall', tags: ['Platformer'], hue: 323, image: 'just-fall', dir: '../just-fall',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'just-one-boss', title: 'Just One Boss', tags: ['Arcade'], hue: 104, image: 'just-one-boss', dir: '../just-one-boss',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'kindergarten', title: 'Kindergarten', tags: ['Puzzle'], hue: 81, image: 'kindergarten', dir: '../kindergarten',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'kindergarten-2', title: 'Kindergarten 2', tags: ['Puzzle'], hue: 138, image: 'kindergarten-2', dir: '../kindergarten-2',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'kindergarten-3', title: 'Kindergarten 3', tags: ['Puzzle'], hue: 317, image: 'kindergarten-3', dir: '../kindergarten-3',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'kitchen-gun-game', title: 'Kitchen Gun Game', tags: ['Shooter'], hue: 9, image: 'kitchen-gun-game', dir: '../kitchen-gun-game',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'kittencannon', title: 'Kitten Cannon', tags: ['Arcade'], hue: 151, image: 'kittencannon', dir: '../kittencannon',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'knife-master', title: 'Knife Master', tags: ['Arcade'], hue: 75, image: 'knife-master', dir: '../knife-master',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'krunker', title: 'Krunker', tags: ['Shooter'], hue: 96, image: 'krunker', dir: '../krunk&r',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'learntofly', title: 'Learn to Fly', tags: ['Arcade'], hue: 29, image: 'learntofly', dir: '../learntofly',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'learntofly2', title: 'Learn to Fly 2', tags: ['Arcade'], hue: 13, image: 'learntofly2', dir: '../learntofly2',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'level-devil', title: 'Level Devil', tags: ['Platformer'], hue: 322, image: 'level-devil', dir: '../level-devil',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'madalin-stunt-cars-2', title: 'Madalin Stunt Cars 2', tags: ['Racing'], hue: 13, image: 'madalin-stunt-cars-2', dir: '../madalin-stunt-cars-2',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'madalin-stunt-cars-3', title: 'Madalin Stunt Cars 3', tags: ['Racing'], hue: 194, image: 'madalin-stunt-cars-3', dir: '../madalin-stunt-cars-3',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'mario', title: 'Mario', tags: ['Platformer'], hue: 131, image: 'mario', dir: '../mario',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'mario-composer', title: 'Mario Composer', tags: ['Platformer', 'Music'], hue: 328, image: 'mario-composer', dir: '../mario-composer',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'mario-vs-luigi', title: 'Mario vs Luigi', tags: ['Platformer'], hue: 158, image: 'mario-vs-luigi', dir: '../mario-vs-luigi',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'marvinspectrum', title: 'Marvin Spectrum', tags: ['Puzzle'], hue: 75, image: 'marvinspectrum', dir: '../marvinspectrum',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'matrixrampage', title: 'Matrix Rampage', tags: ['Shooter', 'Strategy'], hue: 231, image: 'matrixrampage', dir: '../matrixrampage',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'melon-playground', title: 'Melon Playground', tags: ['Sandbox'], hue: 154, image: 'melon-playground', dir: '../melon-playground',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'meme2048', title: 'Meme 2048', tags: ['Puzzle'], hue: 183, image: 'meme2048', dir: '../meme2048',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'merge-round-racers', title: 'Merge Round Racers', tags: ['Racing'], hue: 27, image: 'merge-round-racers', dir: '../merge-round-racers',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'mineblocks', title: 'Mine Blocks', tags: ['Sandbox'], hue: 176, image: 'mineblocks', dir: '../mineblocks',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'minecraft-1.12.2', title: 'Minecraft 1.12.2 (Eaglercraft)', tags: ['Sandbox'], hue: 91, image: 'minecraft-1.12.2', dir: '../minecraft-1.12.2',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'minecraft-1.5.2', title: 'Minecraft 1.5.2', tags: ['Sandbox'], hue: 119, image: 'minecraft-1.5.2', dir: '../minecraft-1.5.2',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'minecraft-1.8.8', title: 'Minecraft 1.8.8 (EaglercraftX)', tags: ['Sandbox'], hue: 218, image: 'minecraft-1.8.8', dir: '../minecraft-1.8.8',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'minecraft-1.9.4', title: 'Minecraft 1.9.4', tags: ['Sandbox'], hue: 221, image: 'minecraft-1.9.4', dir: '../minecraft-1.9.4',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'minecraft-a1.2.6', title: 'Minecraft Alpha 1.2.6', tags: ['Sandbox'], hue: 5, image: 'minecraft-a1.2.6', dir: '../minecraft-a1.2.6',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'minecraft-b1.1-02', title: 'Minecraft Beta 1.1_02', tags: ['Sandbox'], hue: 222, image: 'minecraft-b1.1-02', dir: '../minecraft-b1.1_02',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'minecraft-b1.3-01', title: 'Minecraft Beta 1.3_01', tags: ['Sandbox', 'Puzzle'], hue: 177, image: 'minecraft-b1.3-01', dir: '../minecraft-b1.3_01',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'minecraft-b1.4-01', title: 'Minecraft Beta 1.4_01', tags: ['Sandbox', 'Puzzle'], hue: 298, image: 'minecraft-b1.4-01', dir: '../minecraft-b1.4_01',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'minecraft-b1.7.3', title: 'Minecraft Beta 1.7.3', tags: ['Sandbox'], hue: 66, image: 'minecraft-b1.7.3', dir: '../minecraft-b1.7.3',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'minecraft-tu31', title: 'Minecraft Legacy Console (TU31)', tags: ['Sandbox', 'Puzzle'], hue: 300, image: 'minecraft-tu31', dir: '../minecraft-tu31',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'miniputt', title: 'Mini Putt', tags: ['Sports'], hue: 33, image: 'miniputt', dir: '../miniputt',
      tagline: 'Pick up and play, then go for the win.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / keyboard' }),
    port({ id: 'missiles', title: 'Missile Game', tags: ['Shooter'], hue: 136, image: 'missiles', dir: '../missiles',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'monkey-mart', title: 'Monkey Mart', tags: ['Arcade'], hue: 299, image: 'monkey-mart', dir: '../monkey-mart',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'motox3m', title: 'Moto X3M', tags: ['Racing'], hue: 200, image: 'motox3m', dir: '../motox3m',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'motox3m-pool', title: 'Moto X3M Pool Party', tags: ['Racing'], hue: 261, image: 'motox3m-pool', dir: '../motox3m-pool',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'motox3m-spooky', title: 'Moto X3M Spooky Land', tags: ['Racing'], hue: 190, image: 'motox3m-spooky', dir: '../motox3m-spooky',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'motox3m-winter', title: 'Moto X3M Winter', tags: ['Racing'], hue: 218, image: 'motox3m-winter', dir: '../motox3m-winter',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'motox3m2', title: 'Moto X3M 2', tags: ['Racing'], hue: 158, image: 'motox3m2', dir: '../motox3m2',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'mr-mine', title: 'Mr. Mine', tags: ['Idle'], hue: 50, image: 'mr-mine', dir: '../mr-mine',
      tagline: 'Click, upgrade and watch the numbers climb.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'my-rusty-submarine', title: 'My Rusty Submarine', tags: ['Arcade'], hue: 190, image: 'my-rusty-submarine', dir: '../my-rusty-submarine',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'ninja', title: 'Ninja', tags: ['Platformer'], hue: 171, image: 'ninja', dir: '../ninja',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'ninjavsevilcorp', title: 'Ninja vs EVILCORP', tags: ['Platformer'], hue: 6, image: 'ninjavsevilcorp', dir: '../ninjavsevilcorp',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'noob-steve-parkour', title: 'Noob Steve Parkour', tags: ['Platformer'], hue: 26, image: 'noob-steve-parkour', dir: '../noob-steve-parkour',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'nsresurgence', title: 'Neon Square Resurgence', tags: ['Platformer'], hue: 343, image: 'nsresurgence', dir: '../nsresurgence',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'ocarina-of-time', title: 'Zelda: Ocarina of Time', tags: ['Adventure'], hue: 198, image: 'ocarina-of-time', dir: '../ocarina-of-time',
      tagline: 'Explore a whole world from your browser.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'offlineparadise', title: 'Offline Paradise', tags: ['Arcade'], hue: 13, image: 'offlineparadise', dir: '../OfflineParadise',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'om-bounce', title: 'Om Nom Bounce', tags: ['Puzzle'], hue: 260, image: 'om-bounce', dir: '../om-bounce',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'ovo', title: 'OvO', tags: ['Platformer'], hue: 21, image: 'ovo', dir: '../ovo',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'ovo-dimensions', title: 'OvO Dimensions', tags: ['Platformer'], hue: 309, image: 'ovo-dimensions', dir: '../ovo-dimensions',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'pandemic2', title: 'Pandemic 2', tags: ['Strategy'], hue: 136, image: 'pandemic2', dir: '../pandemic2',
      tagline: 'Plan smart and outlast the opposition.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'papasburgeria', title: 'Papa\'s Burgeria', tags: ['Arcade'], hue: 177, image: 'papasburgeria', dir: '../papasburgeria',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'papasfreezeria', title: 'Papa\'s Freezeria', tags: ['Arcade'], hue: 11, image: 'papasfreezeria', dir: '../papasfreezeria',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'papaspizzaria', title: 'Papa\'s Pizzaria', tags: ['Arcade'], hue: 352, image: 'papaspizzaria', dir: '../papaspizzaria',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'papaswingeria', title: 'Papa\'s Wingeria', tags: ['Arcade'], hue: 104, image: 'papaswingeria', dir: '../papaswingeria',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'paperio2', title: 'Paper.io 2', tags: ['Adventure'], hue: 197, image: 'paperio2', dir: '../paperio2',
      tagline: 'Explore a whole world from your browser.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'papery-planes', title: 'Papery Planes', tags: ['Arcade'], hue: 356, image: 'papery-planes', dir: '../papery-planes',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'people-playground', title: 'People Playground', tags: ['Sandbox'], hue: 120, image: 'people-playground', dir: '../people-playground',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'pixel-gun-survival', title: 'Pixel Gun Survival', tags: ['Shooter'], hue: 357, image: 'pixel-gun-survival', dir: '../pixel-gun-survival',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'pizza-tower', title: 'Pizza Tower', tags: ['Platformer'], hue: 221, image: 'pizza-tower', dir: '../pizza-tower',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'pokemon-diamond', title: 'Pokémon Diamond', tags: ['Adventure'], hue: 75, image: 'pokemon-diamond', dir: '../pokemon-diamond',
      tagline: 'Explore a whole world from your browser.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'pokemon-firered', title: 'Pokemon Fire Red', tags: ['Adventure'], hue: 244, image: 'pokemon-firered', dir: '../pokemon-firered',
      tagline: 'Explore a whole world from your browser.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'pokemon-ruby', title: 'Pokemon Ruby', tags: ['Adventure'], hue: 153, image: 'pokemon-ruby', dir: '../pokemon-ruby',
      tagline: 'Explore a whole world from your browser.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'polybranch', title: 'PolyBranch', tags: ['Arcade'], hue: 95, image: 'polybranch', dir: '../polybranch',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'polytrack', title: 'PolyTrack', tags: ['Racing'], hue: 302, image: 'polytrack', dir: '../polytrack',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'popcat-classic', title: 'Popcat Classic', tags: ['Idle'], hue: 45, image: 'popcat-classic', dir: '../popcat-classic',
      tagline: 'Click, upgrade and watch the numbers climb.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'poppy-playtime', title: 'Poppy Playtime', tags: ['Horror'], hue: 109, image: 'poppy-playtime', dir: '../poppy-playtime',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'portalflash', title: 'Portal (Flash)', tags: ['Arcade'], hue: 155, image: 'portalflash', dir: '../portalflash',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'protektor', title: 'Protektor', tags: ['Strategy'], hue: 9, image: 'protektor', dir: '../protektor',
      tagline: 'Plan smart and outlast the opposition.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'push-the-square', title: 'Push the Square', tags: ['Puzzle'], hue: 129, image: 'push-the-square', dir: '../push-the-square',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'push-your-luck', title: 'Push Your Luck', tags: ['Puzzle'], hue: 11, image: 'push-your-luck', dir: '../push-your-luck',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'rabbit-samurai', title: 'Rabbit Samurai', tags: ['Platformer'], hue: 202, image: 'rabbit-samurai', dir: '../rabbit-samurai',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'rabbit-samurai2', title: 'Rabbit Samurai 2', tags: ['Platformer'], hue: 72, image: 'rabbit-samurai2', dir: '../rabbit-samurai2',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'raft', title: 'Raft', tags: ['Sandbox'], hue: 286, image: 'raft', dir: '../raft',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'ragdoll-archers', title: 'Ragdoll Archers', tags: ['Shooter'], hue: 217, image: 'ragdoll-archers', dir: '../ragdoll-archers',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'repo', title: 'R.E.P.O.', tags: ['Adventure'], hue: 285, image: 'repo', dir: '../repo',
      tagline: 'Explore a whole world from your browser.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'resent-client', title: 'Resent Client (Minecraft)', tags: ['Sandbox'], hue: 98, image: 'resent-client', dir: '../resent-client',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'retro-bowl', title: 'Retro Bowl', tags: ['Sports'], hue: 330, image: 'retro-bowl', dir: '../retro-bowl',
      tagline: 'Pick up and play, then go for the win.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / keyboard' }),
    port({ id: 'retro-bowl-college', title: 'Retro Bowl College', tags: ['Sports'], hue: 34, image: 'retro-bowl-college', dir: '../retro-bowl-college',
      tagline: 'Pick up and play, then go for the win.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / keyboard' }),
    port({ id: 'riddleschool', title: 'Riddle School', tags: ['Puzzle'], hue: 83, image: 'riddleschool', dir: '../riddleschool',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'riddleschool2', title: 'Riddle School 2', tags: ['Puzzle'], hue: 83, image: 'riddleschool2', dir: '../riddleschool2',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'riddleschool3', title: 'Riddle School 3', tags: ['Puzzle'], hue: 264, image: 'riddleschool3', dir: '../riddleschool3',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'riddleschool4', title: 'Riddle School 4', tags: ['Puzzle'], hue: 77, image: 'riddleschool4', dir: '../riddleschool4',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'riddleschool5', title: 'Riddle School 5', tags: ['Puzzle'], hue: 258, image: 'riddleschool5', dir: '../riddleschool5',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'riddletransfer', title: 'Riddle Transfer', tags: ['Puzzle'], hue: 28, image: 'riddletransfer', dir: '../riddletransfer',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'riddletransfer2', title: 'Riddle Transfer 2', tags: ['Puzzle'], hue: 98, image: 'riddletransfer2', dir: '../riddletransfer2',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'roblox', title: 'Roblox', tags: ['Adventure'], hue: 279, image: 'roblox', dir: '../roblox',
      tagline: 'Explore a whole world from your browser.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'rocket-derby', title: 'Rocket Soccer Derby', tags: ['Racing'], hue: 262, image: 'rocket-derby', dir: '../rocket-derby',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'rolling-forests', title: 'Rolling Forests', tags: ['Arcade'], hue: 169, image: 'rolling-forests', dir: '../rolling-forests',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'rolly-vortex', title: 'Rolly Vortex', tags: ['Music'], hue: 260, image: 'rolly-vortex', dir: '../rolly-vortex',
      tagline: 'Stay on the beat.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / Space' }),
    port({ id: 'rooftop-snipers', title: 'Rooftop Snipers', tags: ['Shooter'], hue: 163, image: 'rooftop-snipers', dir: '../rooftop-snipers',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'run-3', title: 'Run 3', tags: ['Platformer'], hue: 74, image: 'run-3', dir: '../run-3',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'sand-game', title: 'Sand Game', tags: ['Sandbox'], hue: 88, image: 'sand-game', dir: '../sand-game',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'sandboxels', title: 'Sandboxels', tags: ['Sandbox'], hue: 194, image: 'sandboxels', dir: '../sandboxels',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'sandstriker-io', title: 'SandStriker.io', tags: ['Shooter'], hue: 344, image: 'sandstriker-io', dir: '../sandstriker-io',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'sans-badtime', title: 'Bad Time Simulator', tags: ['Music'], hue: 289, image: 'sans-badtime', dir: '../sans-badtime',
      tagline: 'Stay on the beat.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / Space' }),
    port({ id: 'santy-is-home', title: 'Santy is Home', tags: ['Horror'], hue: 211, image: 'santy-is-home', dir: '../santy-is-home',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'scrapmetal', title: 'Scrap Metal 3', tags: ['Arcade'], hue: 81, image: 'scrapmetal', dir: '../scrapmetal',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'shellshockers', title: 'Shellshockers', tags: ['Shooter'], hue: 335, image: 'shellshockers', dir: '../shellshockers',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'shotinthedark', title: 'Shot in the Dark', tags: ['Arcade'], hue: 133, image: 'shotinthedark', dir: '../shotinthedark',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'shuttledeck', title: 'Shuttledeck', tags: ['Arcade'], hue: 167, image: 'shuttledeck', dir: '../shuttledeck',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'sky-car-stunt', title: 'Sky Car Stunt', tags: ['Racing'], hue: 164, image: 'sky-car-stunt', dir: '../sky-car-stunt',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'sleepingbeauty', title: 'Sleeping Beauty', tags: ['Puzzle'], hue: 168, image: 'sleepingbeauty', dir: '../sleepingbeauty',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'slice-master-3d', title: 'Slice Master 3D', tags: ['Arcade'], hue: 266, image: 'slice-master-3d', dir: '../slice-master-3d',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'slime-rush-td', title: 'Slime Rush TD', tags: ['Strategy'], hue: 283, image: 'slime-rush-td', dir: '../slime-rush-td',
      tagline: 'Plan smart and outlast the opposition.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'slope', title: 'Slope', tags: ['Arcade'], hue: 56, image: 'slope', dir: '../slope',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'slope-2', title: 'Slope 2', tags: ['Arcade'], hue: 359, image: 'slope-2', dir: '../slope-2',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'slope-ball', title: 'Slope Ball', tags: ['Arcade'], hue: 90, image: 'slope-ball', dir: '../slope-ball',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'sm63', title: 'Super Mario 63', tags: ['Platformer'], hue: 182, image: 'sm63', dir: '../sm63',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'sm64', title: 'Super Mario 64', tags: ['Platformer'], hue: 359, image: 'sm64', dir: '../sm64',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'smashkarts', title: 'Smash Karts', tags: ['Racing'], hue: 190, image: 'smashkarts', dir: '../smashkarts',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'smokingbarrels', title: 'Smoking Barrels', tags: ['Shooter'], hue: 34, image: 'smokingbarrels', dir: '../smokingbarrels',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'snow-rider-3d', title: 'Snow Rider 3D', tags: ['Racing'], hue: 337, image: 'snow-rider-3d', dir: '../snow-rider-3d',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'snowbattle', title: 'SnowBattle.io', tags: ['Adventure'], hue: 0, image: 'snowbattle', dir: '../snowbattle',
      tagline: 'Explore a whole world from your browser.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'soccer-random', title: 'Soccer Random', tags: ['Sports'], hue: 166, image: 'soccer-random', dir: '../soccer-random',
      tagline: 'Pick up and play, then go for the win.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / keyboard' }),
    port({ id: 'soccer-skills', title: 'Soccer Skills Euro Cup', tags: ['Sports'], hue: 163, image: 'soccer-skills', dir: '../soccer-skills',
      tagline: 'Pick up and play, then go for the win.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / keyboard' }),
    port({ id: 'solar-smash', title: 'Solar Smash', tags: ['Arcade'], hue: 107, image: 'solar-smash', dir: '../solar-smash',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'soldier-legend', title: 'Soldier Legend', tags: ['Arcade'], hue: 225, image: 'soldier-legend', dir: '../soldier-legend',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'sonic-exe', title: 'Sonic.exe', tags: ['Horror'], hue: 314, image: 'sonic-exe', dir: '../sonic-exe',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'sort-the-court', title: 'Sort the Court', tags: ['Puzzle', 'Strategy'], hue: 17, image: 'sort-the-court', dir: '../sort-the-court',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'spacebar-clicker', title: 'Spacebar Clicker', tags: ['Idle'], hue: 180, image: 'spacebar-clicker', dir: '../spacebar-clicker',
      tagline: 'Click, upgrade and watch the numbers climb.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'spacegarden', title: 'Space Garden', tags: ['Idle'], hue: 220, image: 'spacegarden', dir: '../spacegarden',
      tagline: 'Click, upgrade and watch the numbers climb.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'stack', title: 'Stack', tags: ['Puzzle'], hue: 263, image: 'stack', dir: '../stack',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'stack-bump-3d', title: 'Stack Bump 3D', tags: ['Puzzle'], hue: 246, image: 'stack-bump-3d', dir: '../stack-bump-3d',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'starve', title: 'Starve.io', tags: ['Adventure'], hue: 184, image: 'starve', dir: '../starve',
      tagline: 'Explore a whole world from your browser.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'station-141', title: 'Station 141', tags: ['Horror', 'Puzzle'], hue: 322, image: 'station-141', dir: '../station-141',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'stealingthediamond', title: 'Stealing The Diamond', tags: ['Puzzle'], hue: 129, image: 'stealingthediamond', dir: '../stealingthediamond',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'stick-archers', title: 'Stick Archers', tags: ['Shooter'], hue: 110, image: 'stick-archers', dir: '../stick-archers',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'stick-duel-battle', title: 'Stick Duel Battle', tags: ['Arcade'], hue: 277, image: 'stick-duel-battle', dir: '../stick-duel-battle',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'stick-merge', title: 'Stick Merge', tags: ['Arcade'], hue: 102, image: 'stick-merge', dir: '../stick-merge',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'stickman-boost', title: 'Stickman Boost', tags: ['Arcade'], hue: 255, image: 'stickman-boost', dir: '../stickman-boost',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'stickman-golf', title: 'Super Stickman Golf', tags: ['Sports'], hue: 108, image: 'stickman-golf', dir: '../stickman-golf',
      tagline: 'Pick up and play, then go for the win.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / keyboard' }),
    port({ id: 'stickman-hook', title: 'Stickman Hook', tags: ['Arcade'], hue: 299, image: 'stickman-hook', dir: '../stickman-hook',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'stickman-survival', title: 'Stickman vs Zombies', tags: ['Shooter'], hue: 242, image: 'stickman-survival', dir: '../Stickman-Survival',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'stickwar', title: 'Stick War', tags: ['Strategy'], hue: 99, image: 'stickwar', dir: '../stickwar',
      tagline: 'Plan smart and outlast the opposition.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'stormthehouse2', title: 'Storm The House 2', tags: ['Shooter'], hue: 355, image: 'stormthehouse2', dir: '../stormthehouse2',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'stumble-guys', title: 'Stumble Guys', tags: ['Adventure'], hue: 132, image: 'stumble-guys', dir: '../stumble-guys',
      tagline: 'Explore a whole world from your browser.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'subway-surfers', title: 'Subway Surfers', tags: ['Arcade'], hue: 193, image: 'subway-surfers', dir: '../subway-surfers',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'subway-surfers-ny', title: 'Subway Surfers New York', tags: ['Arcade'], hue: 245, image: 'subway-surfers-ny', dir: '../subway-surfers-ny',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'super-mario-ds', title: 'Super Mario 64 DS', tags: ['Platformer'], hue: 21, image: 'super-mario-ds', dir: '../super-mario-ds',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'superhot', title: 'SUPERHOT', tags: ['Shooter'], hue: 183, image: 'superhot', dir: '../superhot',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'supermarioconstruct', title: 'Super Mario Construct', tags: ['Platformer'], hue: 181, image: 'supermarioconstruct', dir: '../supermarioconstruct',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'surviv', title: 'Surviv.io', tags: ['Shooter'], hue: 2, image: 'surviv', dir: '../surviv',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'sushi-unroll', title: 'Sushi Unroll', tags: ['Puzzle'], hue: 124, image: 'sushi-unroll', dir: '../sushi-unroll',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'swerve', title: 'Swerve', tags: ['Arcade'], hue: 233, image: 'swerve', dir: '../swerve',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'synesthesia', title: 'Synesthesia', tags: ['Music'], hue: 227, image: 'synesthesia', dir: '../synesthesia',
      tagline: 'Stay on the beat.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / Space' }),
    port({ id: 'tactical-weapon-pack-2', title: 'Tactical Weapon Pack 2', tags: ['Shooter'], hue: 192, image: 'tactical-weapon-pack-2', dir: '../tactical-weapon-pack-2',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'tacticalassasin2', title: 'Tactical Assasin 2', tags: ['Shooter'], hue: 92, image: 'tacticalassasin2', dir: '../tacticalassasin2',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'tank-trouble-2', title: 'Tank Trouble 2', tags: ['Shooter'], hue: 312, image: 'tank-trouble-2', dir: '../tank-trouble-2',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'tanuki-sunset', title: 'Tanuki Sunset', tags: ['Arcade'], hue: 72, image: 'tanuki-sunset', dir: '../tanuki-sunset',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'temple-run-2', title: 'Temple Run 2', tags: ['Arcade'], hue: 139, image: 'temple-run-2', dir: '../temple-run-2',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'thats-not-my-neighbor', title: 'That\'s not my neighbor', tags: ['Horror'], hue: 15, image: 'thats-not-my-neighbor', dir: '../thats-not-my-neighbor',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'the-final-earth', title: 'The Final Earth', tags: ['Strategy'], hue: 256, image: 'the-final-earth', dir: '../the-final-earth',
      tagline: 'Plan smart and outlast the opposition.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'the-hotel', title: 'The Hotel', tags: ['Horror'], hue: 123, image: 'the-hotel', dir: '../the-hotel',
      tagline: 'Survive the night — if you can.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'thebattle', title: 'The Battle', tags: ['Strategy'], hue: 334, image: 'thebattle', dir: '../thebattle',
      tagline: 'Plan smart and outlast the opposition.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'theheist', title: 'The Heist', tags: ['Puzzle'], hue: 273, image: 'theheist', dir: '../theheist',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'there-is-no-game', title: 'There Is No Game', tags: ['Puzzle'], hue: 337, image: 'there-is-no-game', dir: '../there-is-no-game',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'thisistheonlylevel', title: 'This Is The Only Level', tags: ['Puzzle'], hue: 312, image: 'thisistheonlylevel', dir: '../thisistheonlylevel',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'tiger-sim3d', title: 'Tiger Simulator 3D', tags: ['Arcade'], hue: 281, image: 'tiger-sim3d', dir: '../tiger-sim3d',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'time-shooter-3-swat', title: 'Time Shooter 3', tags: ['Shooter'], hue: 279, image: 'time-shooter-3-swat', dir: '../time-shooter-3-swat',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'tiny-fishing', title: 'Tiny Fishing', tags: ['Arcade'], hue: 84, image: 'tiny-fishing', dir: '../tiny-fishing',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'tiny-islands', title: 'Tiny Islands', tags: ['Sandbox'], hue: 124, image: 'tiny-islands', dir: '../tiny-islands',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'tosstheturtle', title: 'Toss The Turtle', tags: ['Arcade'], hue: 179, image: 'tosstheturtle', dir: '../tosstheturtle',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'totm', title: 'Tomb of the Mask', tags: ['Arcade'], hue: 287, image: 'totm', dir: '../totm',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'townscaper', title: 'Townscaper', tags: ['Sandbox'], hue: 293, image: 'townscaper', dir: '../townscaper',
      tagline: 'Build, break and experiment however you like.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'tube-jumpers', title: 'Tube Jumpers', tags: ['Platformer'], hue: 342, image: 'tube-jumpers', dir: '../tube-jumpers',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'tunnel-rush', title: 'Tunnel Rush', tags: ['Music'], hue: 352, image: 'tunnel-rush', dir: '../tunnel-rush',
      tagline: 'Stay on the beat.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / Space' }),
    port({ id: 'turbo-moto-racer', title: 'Turbo Moto Racer', tags: ['Racing'], hue: 71, image: 'turbo-moto-racer', dir: '../turbo-moto-racer',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'twitch-tetris', title: 'Twitch Tetris', tags: ['Puzzle'], hue: 24, image: 'twitch-tetris', dir: '../twitch-tetris',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'undertale', title: 'UNDERTALE', tags: ['Adventure'], hue: 313, image: 'undertale', dir: '../undertale',
      tagline: 'Explore a whole world from your browser.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'undertale-yellow', title: 'Undertale Yellow', tags: ['Adventure'], hue: 188, image: 'undertale-yellow', dir: '../undertale-yellow',
      tagline: 'Explore a whole world from your browser.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'unicycle-hero', title: 'Unicycle Hero', tags: ['Arcade'], hue: 16, image: 'unicycle-hero', dir: '../unicycle-hero',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'veloce', title: 'Veloce', tags: ['Racing'], hue: 349, image: 'veloce', dir: '../veloce',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'vex3', title: 'Vex 3', tags: ['Platformer'], hue: 117, image: 'vex3', dir: '../vex3',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'vex4', title: 'Vex 4', tags: ['Platformer'], hue: 304, image: 'vex4', dir: '../vex4',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'vex5', title: 'Vex 5', tags: ['Platformer'], hue: 123, image: 'vex5', dir: '../vex5',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'vex6', title: 'Vex 6', tags: ['Platformer'], hue: 302, image: 'vex6', dir: '../vex6',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'vex7', title: 'Vex 7', tags: ['Platformer'], hue: 121, image: 'vex7', dir: '../vex7',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'wallsmash', title: 'Wall Smash', tags: ['Arcade'], hue: 175, image: 'wallsmash', dir: '../wallsmash',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'waterworks', title: 'Waterworks!', tags: ['Puzzle'], hue: 146, image: 'waterworks', dir: '../waterworks',
      tagline: 'Think it through and crack every level.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / arrows' }),
    port({ id: 'weavesilk', title: 'Weave Silk', tags: ['Arcade'], hue: 260, image: 'weavesilk', dir: '../weavesilk',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'win-the-whitehouse', title: 'Win the White House', tags: ['Strategy'], hue: 85, image: 'win-the-whitehouse', dir: '../win-the-whitehouse',
      tagline: 'Plan smart and outlast the opposition.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse' }),
    port({ id: 'wolf3d', title: 'Wolfenstein 3D', tags: ['Shooter'], hue: 342, image: 'wolf3d', dir: '../wolf3d',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' }),
    port({ id: 'worlds-hardest-game', title: 'World\'s Hardest Game', tags: ['Platformer'], hue: 183, image: 'worlds-hardest-game', dir: '../worlds-hardest-game',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'worlds-hardest-game-2', title: 'World\'s Hardest Game 2', tags: ['Platformer'], hue: 60, image: 'worlds-hardest-game-2', dir: '../worlds-hardest-game-2',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'x-trial-racing', title: 'X-Trial Racing', tags: ['Racing'], hue: 179, image: 'x-trial-racing', dir: '../x-trial-racing',
      tagline: 'Floor it and chase the fastest time.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD' }),
    port({ id: 'yoshifabrication', title: 'Yoshi\'s Fabrication Station', tags: ['Platformer'], hue: 213, image: 'yoshifabrication', dir: '../yoshifabrication',
      tagline: 'Run, jump and nail every tricky gap.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Arrows / WASD · Space to jump' }),
    port({ id: 'you-are-bezos', title: 'You Are Jeff Bezos', tags: ['Arcade'], hue: 97, image: 'you-are-bezos', dir: '../you-are-bezos',
      tagline: 'Quick rounds, easy to learn, hard to put down.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'Mouse / keyboard' }),
    port({ id: 'zombs-royale', title: 'ZombsRoyale.io', tags: ['Shooter'], hue: 147, image: 'zombs-royale', dir: '../zombs-royale',
      tagline: 'Lock, load and clear the field.', author: 'Various', license: 'See source', repo: 'chomikjr/Nova', controls: 'WASD + mouse' })
  ];

  /* ------------------------------------------------------------------------
     STORAGE — localStorage is the fast local cache. When signed in to a cloud
     account, synced keys are pushed to the backend automatically.
     ------------------------------------------------------------------------ */
  const SYNCED = /^(scores|settings|opts\.|portsaves|meta|notes|os\.widgets)/;
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem('nova.' + key); return v == null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('nova.' + key, JSON.stringify(value)); }
      catch (e) { return false; }
      if (SYNCED.test(key) && typeof cloud !== 'undefined') cloud.schedulePush();
      return true;
    },
    remove(key) { try { localStorage.removeItem('nova.' + key); } catch (e) {} }
  };

  const emit = (name, detail) => window.dispatchEvent(new CustomEvent('arcade:' + name, { detail }));
  const on = (name, fn) => window.addEventListener('arcade:' + name, (e) => fn(e.detail));

  /* ------------------------------------------------------------------------
     ICONS (Lucide-style, stroke-based)
     ------------------------------------------------------------------------ */
  const ICONS = {
    gamepad: '<line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><rect width="20" height="12" x="2" y="6" rx="2"/>',
    settings: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    volumeX: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    crown: '<path d="m2 6 4 11h12l4-11-6 5-4-7-4 7z"/><path d="M6 21h12"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    star: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
    arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
    keyboard: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    skip: '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>',
    skipBack: '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/>',
    menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1.2"/><circle cx="17.5" cy="10.5" r="1.2"/><circle cx="8.5" cy="7.5" r="1.2"/><circle cx="6.5" cy="12.5" r="1.2"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/>',
    phone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="14" rx="1.5"/><rect width="7" height="7" x="3" y="14" rx="1.5"/>',
    minus: '<path d="M5 12h14"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    square: '<rect width="16" height="16" x="4" y="4" rx="2"/>',
    restore: '<rect width="12" height="12" x="8" y="4" rx="2"/><path d="M4 8v10a2 2 0 0 0 2 2h10"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    shuffle: '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
    sticky: '<path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
    thumbsUp: '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
    power: '<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/>'
  };
  function icon(name, cls) {
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ------------------------------------------------------------------------
     CLOUD (Supabase) — accounts, synced player data, global leaderboards.
     Everything is protected by row-level security in supabase/setup.sql:
     players can only read/write their own data and can never change their
     own plan. When config.cloud is empty the site falls back to device-only
     accounts (localAuth below).
     ------------------------------------------------------------------------ */
  const cloud = {
    enabled: !!(config.cloud.supabaseUrl && config.cloud.supabaseAnonKey),
    client: null, user: null, profile: null, _push: 0, _pulling: false,
    async init() {
      if (!this.enabled) return;
      try {
        let mod = null;
        for (const src of ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm', 'https://esm.sh/@supabase/supabase-js@2', 'https://unpkg.com/@supabase/supabase-js@2/dist/module/index.js?module']) {
          try { mod = await import(src); if (mod && mod.createClient) break; } catch (e) { mod = null; }
        }
        if (!mod) throw new Error('could not load the Supabase library');
        this.client = mod.createClient(config.cloud.supabaseUrl, config.cloud.supabaseAnonKey, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'nova.sb-auth' }
        });
      } catch (e) { console.warn('[nova] cloud unavailable, using device accounts', e); this.enabled = false; return; }
      this.client.auth.onAuthStateChange((evt, session) => {
        if (evt === 'SIGNED_OUT') { this.user = null; this.profile = null; store.remove('cloudProfile'); emit('auth', null); }
        if (evt === 'PASSWORD_RECOVERY') setTimeout(() => openResetPassword(), 300);
      });
      const { data } = await this.client.auth.getSession();
      if (data.session) await this._loadUser(data.session.user);
      else if (store.get('cloudProfile', null)) { store.remove('cloudProfile'); emit('auth', null); }
    },
    async _loadUser(user) {
      this.user = user;
      const { data: prof, error } = await this.client.from('profiles').select('*').eq('id', user.id).single();
      if (error) { console.warn('[nova] profile', error); return; }
      this.profile = prof; store.set('cloudProfile', prof);
      await this.pull();
      emit('auth', auth.current());
    },
    /* merge server data into the local cache (server wins for settings/options,
       scores keep the best of both so nothing played offline is lost) */
    async pull() {
      if (!this.user) return;
      this._pulling = true;
      try {
        const { data } = await this.client.from('player_data').select('data').eq('user_id', this.user.id).maybeSingle();
        const remote = (data && data.data) || {};
        const id = this.user.id, all = store.get('scores', {});
        const local = all[id] || {}, rs = remote.scores || {};
        Object.keys(rs).forEach((g) => {
          const l = local[g], r = rs[g];
          if (!l) { local[g] = r; return; }
          local[g] = { best: Math.max(l.best, r.best), plays: Math.max(l.plays, r.plays), total: Math.max(l.total, r.total),
            time: Math.max(l.time, r.time), history: (l.history.length >= r.history.length ? l.history : r.history) };
        });
        all[id] = local; store.set('scores', all);
        if (remote.settings) { Object.assign(settings._s, remote.settings); store.set('settings', settings._s); applySettings(); bg.applyPage && document.body && bg.applyPage(); }
        Object.keys(remote.opts || {}).forEach((k) => store.set('opts.' + k, remote.opts[k]));
        if (remote.portsaves) store.set('portsaves', Object.assign({}, store.get('portsaves', {}), remote.portsaves));
        if (remote.meta) { const allm = store.get('meta', {}); allm[id] = mergeMeta(allm[id], remote.meta); store.set('meta', allm); }
        if (typeof remote.notes === 'string' && !store.get('notes', '')) store.set('notes', remote.notes);
        if (remote.widgets) store.set('os.widgets', remote.widgets);
      } finally { this._pulling = false; }
      this.schedulePush(10);
    },
    schedulePush(delay) {
      if (!this.user || this._pulling) return;
      clearTimeout(this._push);
      this._push = setTimeout(() => this.push(), delay == null ? 1500 : delay);
    },
    async push() {
      if (!this.user) return;
      const id = this.user.id, opts = {};
      Object.keys(localStorage).forEach((k) => { if (k.startsWith('nova.opts.')) opts[k.slice(10)] = store.get(k.slice(5), {}); });
      const scoresMine = (store.get('scores', {})[id]) || {};
      const metaMine = (store.get('meta', {})[id]) || null;
      const payload = { scores: scoresMine, settings: settings._s, opts, portsaves: store.get('portsaves', {}), meta: metaMine, notes: store.get('notes', ''), widgets: store.get('os.widgets', null) };
      const { error } = await this.client.from('player_data').upsert({ user_id: id, data: payload, updated_at: new Date().toISOString() });
      if (error) console.warn('[nova] sync', error);
      const rows = Object.entries(scoresMine).filter(([, r]) => r.best > 0).map(([g, r]) => ({ user_id: id, game_id: g, best: r.best, plays: r.plays, updated_at: new Date().toISOString() }));
      if (metaMine && metaMine.weekly && metaMine.weekly.xp > 0 && metaMine.weekly.week === meta.week()) rows.push({ user_id: id, game_id: '__xpw:' + metaMine.weekly.week, best: Math.min(100000000, Math.round(metaMine.weekly.xp)), plays: Object.keys(metaMine.tried || {}).length, updated_at: new Date().toISOString() });
      if (metaMine && metaMine.xp > 0) rows.push({ user_id: id, game_id: '__xp', best: Math.min(100000000, Math.round(metaMine.xp)), plays: Object.keys(metaMine.tried || {}).length, updated_at: new Date().toISOString() });
      if (rows.length) { const { error: e2 } = await this.client.from('scores').upsert(rows); if (e2) console.warn('[nova] scores', e2); }
      const stats = Object.entries(scoresMine).filter(([g, r]) => (r.plays > 0 || r.time > 0) && g.length <= 40).map(([g, r]) => ({ user_id: id, game_id: g, plays: Math.min(999999, r.plays | 0), secs: Math.min(99999999, Math.round(r.time || 0)), updated_at: new Date().toISOString() }));
      if (stats.length) { const { error: e3 } = await this.client.from('game_stats').upsert(stats); if (e3) console.warn('[nova] stats', e3); }
      emit('synced');
    }
  };
  window.addEventListener('pagehide', () => { if (cloud.user) cloud.push(); });

  /* ------------------------------------------------------------------------
     AUTH — one interface for both modes. Cloud: email + password via
     Supabase. Device: hashed passwords in localStorage (fallback only).
     ------------------------------------------------------------------------ */
  async function hashPassword(password, salt) {
    if (window.crypto && crypto.subtle) {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 120000, hash: 'SHA-256' }, key, 256);
      return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 2166136261; const s = salt + ':' + password;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return 'fnv' + (h >>> 0).toString(16);
  }
  const randomSalt = () => Array.from(crypto.getRandomValues(new Uint8Array(12))).map((b) => b.toString(16).padStart(2, '0')).join('');

  const friendlyAuthError = (e) => {
    const m = (e && (e.message || e.msg || String(e))) || '';
    if (/invalid login credentials/i.test(m)) return 'Email or password is incorrect.';
    if (/already registered|already exists/i.test(m)) return 'An account with that email already exists. Try logging in.';
    if (/database error saving new user|reserved|duplicate key/i.test(m)) return 'That username is taken. Try another one.';
    if (/email not confirmed/i.test(m)) return 'Confirm your email first — check your inbox for the link.';
    if (/rate limit|too many/i.test(m)) return 'Too many attempts. Wait a minute and try again.';
    if (/password should be/i.test(m)) return 'Use a stronger password (at least 6 characters).';
    return m || 'Something went wrong. Try again.';
  };

  const auth = {
    get mode() { return cloud.enabled ? 'cloud' : 'local'; },
    validateUsername(u) {
      if (!u) return 'Choose a username.';
      if (u.length < 3) return 'Usernames need at least 3 characters.';
      if (u.length > 18) return 'Keep it to 18 characters or fewer.';
      if (!/^[a-zA-Z0-9_]+$/.test(u)) return 'Letters, numbers and underscores only.';
      return '';
    },
    validatePassword(p) { if (!p) return 'Enter a password.'; if (p.length < 6) return 'Use at least 6 characters.'; return ''; },
    validateEmail(e) { if (!e) return 'Enter your email.'; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'That doesn’t look like an email address.'; return ''; },
    async usernameAvailable(u) {
      if (cloud.enabled) await ready;
      if (cloud.enabled && cloud.client) { const { data, error } = await cloud.client.rpc('username_available', { u }); return error ? true : !!data; }
      return !store.get('users', {})[u.toLowerCase()];
    },
    /* returns { user } or { needsConfirm: true } */
    async signUp(username, password, email) {
      if (cloud.enabled) await ready;
      if (cloud.enabled) {
        if (!(await auth.usernameAvailable(username))) throw new Error('That username is taken. Try another one.');
        const { data, error } = await cloud.client.auth.signUp({ email, password, options: { data: { username }, emailRedirectTo: location.origin + location.pathname } });
        if (error) throw new Error(friendlyAuthError(error));
        if (!data.session) return { needsConfirm: true };
        await cloud._loadUser(data.user);
        return { user: auth.current() };
      }
      const users = store.get('users', {}), key = username.toLowerCase();
      if (users[key]) throw new Error('That username is taken on this device.');
      const salt = randomSalt();
      users[key] = { username, salt, hash: await hashPassword(password, salt), created: Date.now(), plan: 'free', hue: Math.floor(Math.random() * 360) };
      store.set('users', users); store.set('session', { user: key }); emit('auth', auth.current());
      return { user: auth.current() };
    },
    async logIn(identifier, password) {
      if (cloud.enabled) await ready;
      if (cloud.enabled) {
        const { data, error } = await cloud.client.auth.signInWithPassword({ email: identifier, password });
        if (error) throw new Error(friendlyAuthError(error));
        await cloud._loadUser(data.user);
        return auth.current();
      }
      const u = store.get('users', {})[identifier.toLowerCase()];
      if (!u || (await hashPassword(password, u.salt)) !== u.hash) throw new Error('Username or password is incorrect.');
      store.set('session', { user: identifier.toLowerCase() }); emit('auth', auth.current());
      return auth.current();
    },
    async resetPassword(email) {
      await ready;
      const { error } = await cloud.client.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
      if (error) throw new Error(friendlyAuthError(error));
    },
    async updatePassword(pw) {
      const { error } = await cloud.client.auth.updateUser({ password: pw });
      if (error) throw new Error(friendlyAuthError(error));
    },
    async logOut() {
      if (cloud.enabled && cloud.user) { await cloud.push(); await cloud.client.auth.signOut(); }
      store.remove('session'); store.remove('cloudProfile'); emit('auth', null);
    },
    current() {
      if (cloud.enabled) {
        const p = cloud.profile || store.get('cloudProfile', null);
        return p ? { id: p.id, username: p.username, created: Date.parse(p.created_at), plan: p.plan, role: p.role, hue: p.hue, cloud: true } : null;
      }
      const s = store.get('session', null); if (!s) return null;
      const u = store.get('users', {})[s.user];
      return u ? { id: s.user, username: u.username, created: u.created, plan: u.plan, hue: u.hue } : null;
    },
    /* Pro is decided by the server (profiles.plan), never by the client */
    async setHue(h) {
      h = Math.round(((h % 360) + 360) % 360);
      if (cloud.enabled && cloud.user) {
        const { error } = await cloud.client.from('profiles').update({ hue: h }).eq('id', cloud.user.id);
        if (error) throw new Error('Couldn’t save your color. Try again.');
        cloud.profile = Object.assign({}, cloud.profile, { hue: h }); store.set('cloudProfile', cloud.profile);
      } else {
        const s = store.get('session', null), users = store.get('users', {});
        if (!s || !users[s.user]) return;
        users[s.user].hue = h; store.set('users', users);
      }
      emit('auth', auth.current());
    },
    /* Everything is free now — kept so older code paths still work */
    isPro() { return true; },
    isOwner() { const u = auth.current(); return !!(u && u.role === 'owner'); }
  };

  /* ------------------------------------------------------------------------
     SCORES & STATS
     ------------------------------------------------------------------------ */
  const blankRec = () => ({ best: 0, plays: 0, total: 0, time: 0, history: [] });
  const scores = {
    _key() { const u = auth.current(); return u ? u.id : '__guest'; },
    _all() { return store.get('scores', {}); },
    get(gameId) { return (this._all()[this._key()] || {})[gameId] || blankRec(); },
    best(gameId) { return this.get(gameId).best; },
    _write(gameId, fn) {
      const all = this._all(), k = this._key();
      all[k] = all[k] || {}; const r = all[k][gameId] || blankRec();
      const out = fn(r); all[k][gameId] = r; store.set('scores', all); return out;
    },
    submit(gameId, score, extra) {
      const res = this._write(gameId, (r) => {
        const isRecord = score > r.best, previousBest = r.best;
        r.plays++; r.total += score; r.time += (extra && extra.seconds) || 0;
        if (isRecord) r.best = score;
        r.history.unshift({ score, at: Date.now(), mode: extra && extra.mode });
        r.history = r.history.slice(0, 15);
        return { isRecord, best: r.best, previousBest };
      });
      emit('score', { gameId, score, isRecord: res.isRecord });
      try { meta.scored(gameId, score, res.isRecord && res.previousBest > 0); } catch (e) {}
      return res;
    },
    /* for games without a score (ports): count the play and time spent */
    recordPlay(gameId, seconds) {
      this._write(gameId, (r) => { r.plays++; r.time += seconds || 0; r.history.unshift({ score: 0, at: Date.now(), mode: 'Session · ' + Math.round(seconds || 0) + 's' }); r.history = r.history.slice(0, 15); });
    },
    addTime(gameId, seconds) { this._write(gameId, (r) => { r.time += seconds; }); },
    /* device leaderboard (instant) */
    leaderboard(gameId, limit) {
      const all = this._all(), users = store.get('users', {}), me = this._key(), prof = store.get('cloudProfile', null);
      const rows = [];
      Object.keys(all).forEach((k) => {
        const r = all[k][gameId]; if (!r || !r.best) return;
        const name = k === '__guest' ? 'Guest' : users[k] ? users[k].username : (prof && prof.id === k ? prof.username : 'Player');
        rows.push({ name, best: r.best, plays: r.plays, hue: users[k] ? users[k].hue : (prof && prof.id === k ? prof.hue : 220), me: k === me });
      });
      return rows.sort((a, b) => b.best - a.best).slice(0, limit || 10);
    },
    /* global leaderboard when cloud is on, device board otherwise */
    async leaderboardAsync(gameId, limit) {
      if (!cloud.enabled || !cloud.client) return { scope: 'device', rows: this.leaderboard(gameId, limit) };
      const { data, error } = await cloud.client.from('leaderboard').select('username,hue,best,plays,user_id').eq('game_id', gameId).order('best', { ascending: false }).limit(limit || 10);
      if (error) return { scope: 'device', rows: this.leaderboard(gameId, limit) };
      const me = cloud.user && cloud.user.id;
      return { scope: 'global', rows: data.map((r) => ({ name: r.username, hue: r.hue, best: Number(r.best), plays: r.plays, me: r.user_id === me })) };
    },
    /* global popularity (cached 10 min). Returns { [gameId]: { players, recent, secs } } */
    async trending() {
      const c = store.get('trendCache', null);
      if (c && Date.now() - c.at < 6e5) return c.map;
      await ready;
      if (!cloud.client) return (c && c.map) || {};
      let { data, error } = await cloud.client.rpc('trending_v2', { days: 7 });
      if (error) ({ data, error } = await cloud.client.rpc('trending', { days: 7 }));
      if (error || !data) return (c && c.map) || {};
      const map = {}; data.forEach((r) => { map[r.game_id] = { players: Number(r.players), recent: Number(r.recent_players), secs: Number(r.total_secs), likes: Number(r.likes || 0) }; });
      store.set('trendCache', { at: Date.now(), map });
      return map;
    },
    /* likes: the set of games I liked (cloud accounts only) */
    _likes: null,
    async myLikes() {
      await ready;
      if (!cloud.user) return new Set();
      if (this._likes) return this._likes;
      const { data } = await cloud.client.from('game_likes').select('game_id').eq('user_id', cloud.user.id);
      this._likes = new Set((data || []).map((r) => r.game_id)); return this._likes;
    },
    async toggleLike(id) {
      await ready;
      if (!cloud.user) throw new Error('signin');
      const mine = await this.myLikes(), on = !mine.has(id);
      const q = on ? cloud.client.from('game_likes').insert({ game_id: id }) : cloud.client.from('game_likes').delete().eq('user_id', cloud.user.id).eq('game_id', id);
      const { error } = await q; if (error) throw new Error('Couldn’t save that. Try again.');
      on ? mine.add(id) : mine.delete(id);
      const c = store.get('trendCache', { at: Date.now(), map: {} }); c.map[id] = c.map[id] || { players: 0, recent: 0, secs: 0, likes: 0 }; c.map[id].likes = Math.max(0, (c.map[id].likes || 0) + (on ? 1 : -1)); store.set('trendCache', c);
      if (on) meta.edit((m) => { m.likesGiven = (m.likesGiven || 0) + 1; });
      emit('likes', { id, on }); return on;
    },
    trendingCached() { const c = store.get('trendCache', null); return (c && c.map) || {}; },
    summary() {
      const mine = this._all()[this._key()] || {};
      let plays = 0, time = 0;
      Object.values(mine).forEach((r) => { plays += r.plays; time += r.time; });
      return { plays, time, games: mine };
    }
  };

  /* ------------------------------------------------------------------------
     META — XP, levels, achievements, daily challenges, streaks, favorites,
     recently played. Stored per user under 'meta' and synced to the cloud.
     ------------------------------------------------------------------------ */
  const blankMeta = () => ({ xp: 0, tried: {}, recent: [], favs: [], ach: {}, secs: 0, sessions: 0,
    streak: { count: 0, last: '' }, daily: { date: '', progress: 0, done: false, seen: {} }, dailiesDone: 0, flags: {} });
  function mergeMeta(a, b) {
    a = Object.assign(blankMeta(), a || {}); b = Object.assign(blankMeta(), b || {});
    const out = Object.assign({}, a);
    out.xp = Math.max(a.xp, b.xp); out.secs = Math.max(a.secs, b.secs); out.sessions = Math.max(a.sessions, b.sessions);
    out.dailiesDone = Math.max(a.dailiesDone, b.dailiesDone);
    out.tried = Object.assign({}, b.tried, a.tried);
    out.ach = Object.assign({}, b.ach, a.ach);
    out.flags = Object.assign({}, b.flags, a.flags);
    out.favs = [...new Set([].concat(a.favs, b.favs))];
    const rec = {}; [].concat(a.recent, b.recent).forEach((r) => { if (!rec[r.id] || rec[r.id].at < r.at) rec[r.id] = r; });
    out.recent = Object.values(rec).sort((x, y) => y.at - x.at).slice(0, 20);
    out.streak = (a.streak.last >= b.streak.last) ? a.streak : b.streak;
    if (a.weekly || b.weekly) { const wa = a.weekly || { week: '', xp: 0 }, wb = b.weekly || { week: '', xp: 0 }; out.weekly = wa.week === wb.week ? { week: wa.week, xp: Math.max(wa.xp, wb.xp) } : (wa.week > wb.week ? wa : wb); }
    out.daily = (a.daily.date > b.daily.date || (a.daily.date === b.daily.date && a.daily.progress >= b.daily.progress)) ? a.daily : b.daily;
    return out;
  }
  const today = (d) => { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const dayHash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  /* route toasts/sounds to the OS when we're inside a game window */
  function notify(msg, iconName, opts) {
    try { if (EMBED && window.top !== window && window.top.Arcade) return window.top.Arcade.ui.toast(msg, iconName, opts); } catch (e) {}
    (window.Arcade && window.Arcade.ui ? window.Arcade.ui.toast : toast)(msg, iconName, opts);
  }

  const LEVEL_TITLES = ['Rookie', 'Player', 'Gamer', 'Grinder', 'Pro Gamer', 'Elite', 'Champion', 'Legend', 'Mythic', 'Immortal'];
  const ACHIEVEMENTS = [
    { id: 'first-game', title: 'Press Start', desc: 'Play your first game', xp: 25, icon: 'play', test: (m) => Object.keys(m.tried).length >= 1 },
    { id: 'try-5', title: 'Explorer', desc: 'Try 5 different games', xp: 75, icon: 'search', goal: 5, prog: (m) => Object.keys(m.tried).length },
    { id: 'try-15', title: 'Globetrotter', desc: 'Try 15 different games', xp: 200, icon: 'cloud', goal: 15, prog: (m) => Object.keys(m.tried).length },
    { id: 'try-all', title: 'Completionist', desc: 'Try every game in the arcade', xp: 500, icon: 'crown', goal: () => games.filter((g) => g.status === 'live').length, prog: (m) => Object.keys(m.tried).filter((id) => games.some((g) => g.id === id)).length },
    { id: 'hour', title: 'Time Flies', desc: 'Play for 1 hour total', xp: 100, icon: 'clock', goal: 3600, prog: (m) => m.secs, fmt: 'time' },
    { id: 'five-hours', title: 'No Life', desc: 'Play for 5 hours total', xp: 300, icon: 'flame', goal: 18000, prog: (m) => m.secs, fmt: 'time' },
    { id: 'streak-3', title: 'Habit', desc: 'Visit 3 days in a row', xp: 75, icon: 'flame', goal: 3, prog: (m) => m.streak.count },
    { id: 'streak-7', title: 'On Fire', desc: 'Visit 7 days in a row', xp: 250, icon: 'flame', goal: 7, prog: (m) => m.streak.count },
    { id: 'daily-1', title: 'Daily Grind', desc: 'Complete a daily challenge', xp: 50, icon: 'check', goal: 1, prog: (m) => m.dailiesDone },
    { id: 'daily-10', title: 'Dedicated', desc: 'Complete 10 daily challenges', xp: 300, icon: 'star', goal: 10, prog: (m) => m.dailiesDone },
    { id: 'favs-3', title: 'Curator', desc: 'Favorite 3 games', xp: 40, icon: 'heart', goal: 3, prog: (m) => m.favs.length },
    { id: 'level-5', title: 'Leveling Up', desc: 'Reach level 5', xp: 100, icon: 'zap', goal: 5, prog: (m) => levelInfo(m.xp).level },
    { id: 'level-10', title: 'Veteran', desc: 'Reach level 10', xp: 400, icon: 'trophy', goal: 10, prog: (m) => levelInfo(m.xp).level },
    { id: 'snake-500', title: 'Snake Charmer', desc: 'Score 500 in Neon Snake', xp: 120, icon: 'trophy', goal: 500, prog: () => scores.best('snake') },
    { id: 'record', title: 'Personal Best', desc: 'Beat your own high score', xp: 30, icon: 'trophy', test: (m) => !!m.flags.record },
    { id: 'night-owl', title: 'Night Owl', desc: 'Play between midnight and 4am', xp: 50, icon: 'clock', test: (m) => !!m.flags.nightOwl },
    { id: 'customize', title: 'Make It Yours', desc: 'Change your wallpaper', xp: 30, icon: 'image', test: (m) => !!m.flags.customized },
    { id: 'account', title: 'Signed Up', desc: 'Create an account to sync progress', xp: 100, icon: 'user', test: () => !!auth.current() },
    { id: 'request', title: 'Suggestion Box', desc: 'Request a game', xp: 30, icon: 'bell', test: (m) => !!m.flags.requested },
    { id: 'notes', title: 'Note Taker', desc: 'Write something in Notes', xp: 20, icon: 'menu', test: () => (store.get('notes', '') || '').trim().length > 0 },
    { id: 'split', title: 'Multitasker', desc: 'Play two games side by side', xp: 60, icon: 'grid', test: (m) => !!m.flags.split },
    { id: 'weekly-1', title: 'Week Warrior', desc: 'Complete a weekly challenge', xp: 150, icon: 'trophy', test: (m) => !!(m.wch && m.wch.done) || !!m.flags.weeklyDone },
    { id: 'likes-5', title: 'Critic', desc: 'Like 5 games', xp: 60, icon: 'thumbsUp', goal: 5, prog: (m) => m.likesGiven || 0 },
    { id: 'favs-10', title: 'Collector', desc: 'Favorite 10 games', xp: 120, icon: 'heart', goal: 10, prog: (m) => m.favs.length },
    { id: 'home-custom', title: 'Interior Designer', desc: 'Customize your home screen', xp: 30, icon: 'settings', test: (m) => !!m.flags.widgets },
    { id: 'try-30', title: 'Arcade Royalty', desc: 'Try 30 different games', xp: 400, icon: 'crown', goal: 30, prog: (m) => Object.keys(m.tried).length }
  ];
  const DAILY_TYPES = [
    { id: 'play3', text: 'Play 3 different games', goal: 3, kind: 'distinct' },
    { id: 'minutes15', text: 'Play for 15 minutes', goal: 900, kind: 'seconds' },
    { id: 'minutes30', text: 'Play for 30 minutes', goal: 1800, kind: 'seconds' },
    { id: 'new', text: 'Try a game you’ve never played', goal: 1, kind: 'new' },
    { id: 'snake300', text: 'Score 300 in Neon Snake', goal: 300, kind: 'score', game: 'snake' },
    { id: 'feature', text: 'Play today’s featured game for 3 minutes', goal: 180, kind: 'featured' }
  ];
  const WEEKLY_TYPES = [
    { id: 'new5', text: 'Try 5 games you’ve never played', goal: 5, kind: 'new' },
    { id: 'hours2', text: 'Play for 2 hours this week', goal: 7200, kind: 'seconds' },
    { id: 'daily3', text: 'Complete 3 daily challenges', goal: 3, kind: 'dailies' },
    { id: 'xp1500', text: 'Earn 1,500 XP this week', goal: 1500, kind: 'xp' },
    { id: 'distinct10', text: 'Play 10 different games', goal: 10, kind: 'distinct' }
  ];
  function levelInfo(xp) {
    let L = 1; while (50 * (L + 1) * L <= xp) L++;
    const base = 50 * L * (L - 1), next = 50 * (L + 1) * L;
    return { level: L, title: LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((L - 1) / 2))], cur: xp - base, need: next - base, pct: Math.min(1, (xp - base) / (next - base)) };
  }

  const meta = {
    achievements: ACHIEVEMENTS, levelInfo,
    _key() { const u = auth.current(); return u ? u.id : '__guest'; },
    get() { return Object.assign(blankMeta(), (store.get('meta', {})[this._key()]) || {}); },
    _save(m) {
      const all = store.get('meta', {}), prev = all[this._key()], wk = this.week();
      const gained = Math.max(0, m.xp - ((prev && prev.xp) || 0));
      if (!m.weekly || m.weekly.week !== wk) m.weekly = { week: wk, xp: 0 };
      m.weekly.xp += gained;
      all[this._key()] = m; store.set('meta', all); emit('meta', m);
    },
    edit(fn) { const m = this.get(); const r = fn(m); this._check(m); this._save(m); return r; },
    week(d) { d = new Date(d || Date.now()); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + '-W' + String(Math.ceil(((t - y0) / 864e5 + 1) / 7)).padStart(2, '0'); },
    addXP(n, reason) {
      if (!n) return;
      this.edit((m) => {
        const before = levelInfo(m.xp).level; m.xp += n; const after = levelInfo(m.xp).level;
        if (after > before) { notify('Level up! You’re now level ' + after + ' · ' + levelInfo(m.xp).title, 'zap', { big: true }); audio.sfx('levelup'); }
      });
    },
    _check(m) {
      ACHIEVEMENTS.forEach((a) => {
        if (m.ach[a.id]) return;
        const goal = typeof a.goal === 'function' ? a.goal() : a.goal;
        const ok = a.test ? a.test(m) : a.prog(m) >= goal;
        if (ok) {
          m.ach[a.id] = Date.now(); m.xp += a.xp;
          notify('Achievement unlocked: ' + a.title + ' · +' + a.xp + ' XP', 'trophy', { big: true, achievement: true });
          try { audio.sfx('record'); } catch (e) {}
        }
      });
    },
    progress(a, m) { m = m || this.get(); const goal = typeof a.goal === 'function' ? a.goal() : (a.goal || 1); const v = a.test ? (a.test(m) ? 1 : 0) : a.prog(m); return { value: Math.min(v, goal), goal: a.test ? 1 : goal, done: !!m.ach[a.id] }; },
    isFav(id) { return this.get().favs.includes(id); },
    toggleFav(id) {
      return this.edit((m) => { const i = m.favs.indexOf(id); if (i >= 0) m.favs.splice(i, 1); else m.favs.unshift(id); return i < 0; });
    },
    featured(date) { const live = games.filter((g) => g.status === 'live'); return live[dayHash('f' + (date || today())) % live.length]; },
    dailyDef(date) { date = date || today(); return DAILY_TYPES[dayHash('d' + date) % DAILY_TYPES.length]; },
    daily() {
      const m = this.get(), d = this.dailyDef();
      const st = m.daily.date === today() ? m.daily : { date: today(), progress: 0, done: false, seen: {} };
      return { def: d, progress: Math.min(st.progress, d.goal), goal: d.goal, done: st.done, featured: this.featured(), xp: 150 };
    },
    weeklyDef(w) { w = w || this.week(); return WEEKLY_TYPES[dayHash('w' + w) % WEEKLY_TYPES.length]; },
    weeklyCh() {
      const m = this.get(), d = this.weeklyDef(), st = m.wch && m.wch.week === this.week() ? m.wch : { progress: 0, done: false };
      let progress = st.progress;
      if (d.kind === 'xp') progress = (m.weekly && m.weekly.week === this.week()) ? m.weekly.xp : 0;
      return { def: d, progress: Math.min(progress, d.goal), goal: d.goal, done: st.done, xp: 500 };
    },
    _weeklyProgress(m, ev) {
      const d = this.weeklyDef(), wk = this.week();
      if (!m.wch || m.wch.week !== wk) m.wch = { week: wk, progress: 0, done: false, seen: {} };
      const st = m.wch; if (st.done) return;
      if (d.kind === 'new' && ev.type === 'play' && ev.isNew) st.progress++;
      if (d.kind === 'distinct' && ev.type === 'play') { st.seen[ev.id] = 1; st.progress = Object.keys(st.seen).length; }
      if (d.kind === 'seconds' && ev.type === 'time') st.progress += ev.secs;
      if (d.kind === 'dailies' && ev.type === 'daily') st.progress++;
      const xpNow = d.kind === 'xp' ? ((m.weekly && m.weekly.week === wk ? m.weekly.xp : 0) + (ev.pendingXp || 0)) : st.progress;
      if (xpNow >= d.goal) { st.done = true; m.flags.weeklyDone = true; m.xp += 500; notify('Weekly challenge complete! +500 XP', 'trophy', { big: true }); try { audio.sfx('record'); } catch (e) {} }
    },
    _dailyProgress(m, ev) {
      this._weeklyProgress(m, ev);
      const d = this.dailyDef();
      if (m.daily.date !== today()) m.daily = { date: today(), progress: 0, done: false, seen: {} };
      const st = m.daily; if (st.done) return;
      if (d.kind === 'distinct' && ev.type === 'play') { st.seen[ev.id] = 1; st.progress = Object.keys(st.seen).length; }
      if (d.kind === 'seconds' && ev.type === 'time') st.progress += ev.secs;
      if (d.kind === 'new' && ev.type === 'play' && ev.isNew) st.progress = 1;
      if (d.kind === 'score' && ev.type === 'score' && ev.id === d.game) st.progress = Math.max(st.progress, ev.score);
      if (d.kind === 'featured' && ev.type === 'time' && ev.id === this.featured().id) st.progress += ev.secs;
      if (st.progress >= d.goal) {
        st.done = true; m.dailiesDone++; m.xp += 150; this._weeklyProgress(m, { type: 'daily' });
        notify('Daily challenge complete! +150 XP', 'star', { big: true }); try { audio.sfx('record'); } catch (e) {}
      }
    },
    /* a game session started */
    played(id) {
      this.edit((m) => {
        const isNew = !m.tried[id], firstEver = !Object.keys(m.tried).length; m.tried[id] = m.tried[id] || Date.now(); m.sessions++;
        m.recent = [{ id, at: Date.now() }].concat(m.recent.filter((r) => r.id !== id)).slice(0, 20);
        const h = new Date().getHours(); if (h < 4) m.flags.nightOwl = true;
        if (isNew) { m.xp += 50; if (!firstEver) notify('New game discovered · +50 XP', 'search'); }
        this._dailyProgress(m, { type: 'play', id, isNew });
      });
    },
    /* time spent playing (called every ~30 s by game pages) */
    tick(id, secs) {
      this.edit((m) => {
        m.secs += secs;
        m._xpAcc = (m._xpAcc || 0) + secs;
        while (m._xpAcc >= 60) { m._xpAcc -= 60; m.xp += 10; }
        this._weeklyProgress(m, { type: 'xp', pendingXp: 0 });
        this._dailyProgress(m, { type: 'time', id, secs });
      });
    },
    scored(id, score, isRecord) {
      this.edit((m) => {
        if (isRecord && score > 0) { m.flags.record = true; m.xp += 25; }
        this._dailyProgress(m, { type: 'score', id, score });
      });
    },
    flag(name) { this.edit((m) => { m.flags[name] = true; }); },
    /* once per page load: daily streak + login XP */
    visit() {
      if (EMBED) return;
      this.edit((m) => {
        const t = today(), y = today(new Date(Date.now() - 864e5));
        if (m.streak.last === t) return;
        m.streak = { count: m.streak.last === y ? m.streak.count + 1 : 1, last: t };
        m.xp += 20 + Math.min(80, m.streak.count * 5);
        const first = !m.sessions;
        setTimeout(() => notify((m.streak.count > 1 ? m.streak.count + '-day streak! ' : 'Daily login bonus! ') + '+' + (20 + Math.min(80, m.streak.count * 5)) + ' XP', 'flame'), first ? 4200 : 1800);
      });
    }
  };

  /* ------------------------------------------------------------------------
     SETTINGS
     ------------------------------------------------------------------------ */
  const DEFAULTS = {
    bg: 'void', music: true, track: 'auto', shuffle: false, musicVol: 0.45, sfx: true, sfxVol: 0.7,
    accent: 'violet', crt: false, reducedMotion: false, shake: true, pauseMusicInGames: true, showFps: true, clock24: false, gamesMaximized: true, lockScreen: true
  };
  const settings = {
    _s: (() => {
      const s = Object.assign({}, DEFAULTS, store.get('settings', {}));
      /* v3.1: music folders arrived — old saved 'neon' becomes 'auto' once so folder stations get picked */
      if (!s.musicV2) { if (s.track === 'neon') s.track = 'auto'; s.musicV2 = true; }
      return s;
    })(),
    get(k) { return this._s[k]; },
    all() { return Object.assign({}, this._s); },
    set(k, v) {
      this._s[k] = v; store.set('settings', this._s);
      applySettings(k); emit('settings', { key: k, value: v });
    },
    reducedMotion() {
      return this._s.reducedMotion || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  };
  function applySettings(changed) {
    const r = document.documentElement;
    r.dataset.accent = settings.get('accent');
    r.dataset.crt = settings.get('crt') ? 'on' : 'off';
    r.dataset.reducedMotion = settings.get('reducedMotion') ? 'on' : 'off';
    if (!changed || changed === 'musicVol' || changed === 'sfxVol' || changed === 'sfx') audio.applyVolumes();
    if (changed === 'music' && !EMBED) settings.get('music') ? audio.music.start() : audio.music.stop();
    if (changed === 'track') audio.music.switchTo(settings.get('track'));
    if (changed === 'shuffle') emit('music', { playing: audio.music.playing });
    if (changed === 'bg' || changed === 'reducedMotion') bg.applyPage();
  }

  /* ------------------------------------------------------------------------
     AUDIO — SFX and the built-in tracks are synthesized with WebAudio.
     Music stations play your own files from assets/audio/<station>/.
     ------------------------------------------------------------------------ */
  const audio = (() => {
    let ctx = null, master, sfxBus, musicBus, noiseBuf, analyser = null;
    const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

    function ensure() {
      if (ctx) return ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      master.connect(comp); comp.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
      analyser = ctx.createAnalyser(); analyser.fftSize = 128; analyser.smoothingTimeConstant = 0.8; musicBus.connect(analyser);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      applyVolumes();
      return ctx;
    }
    function applyVolumes() {
      if (!ctx) return;
      sfxBus.gain.setTargetAtTime(settings.get('sfx') ? settings.get('sfxVol') : 0, ctx.currentTime, 0.02);
      if (music.playing) musicBus.gain.setTargetAtTime(settings.get('musicVol') * 0.6, ctx.currentTime, 0.1);
    }

    function tone(o) {
      const c = ensure(); if (!c) return;
      const t = (o.at != null ? o.at : c.currentTime) + (o.delay || 0);
      const osc = c.createOscillator(); const g = c.createGain();
      osc.type = o.type || 'square';
      osc.frequency.setValueAtTime(o.freq, t);
      if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + (o.slide || o.dur));
      if (o.detune) osc.detune.value = o.detune;
      const vol = o.vol == null ? 0.2 : o.vol;
      const atk = o.attack || 0.005;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + atk);
      g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur + (o.release || 0.05));
      let node = osc;
      if (o.cutoff) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.cutoff; f.Q.value = o.q || 0.7; osc.connect(f); node = f; }
      node.connect(g); g.connect(o.dest || sfxBus);
      osc.start(t); osc.stop(t + o.dur + (o.release || 0.05) + 0.05);
    }
    function noise(o) {
      const c = ensure(); if (!c) return;
      const t = (o.at != null ? o.at : c.currentTime) + (o.delay || 0);
      const src = c.createBufferSource(); src.buffer = noiseBuf;
      const f = c.createBiquadFilter(); f.type = o.filter || 'highpass'; f.frequency.setValueAtTime(o.freq || 1000, t);
      if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
      const g = c.createGain();
      g.gain.setValueAtTime(o.vol == null ? 0.2 : o.vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
      src.connect(f); f.connect(g); g.connect(o.dest || sfxBus);
      src.start(t, Math.random() * 0.5); src.stop(t + o.dur + 0.05);
    }

    const SFX = {
      click: () => tone({ type: 'square', freq: 640, to: 900, dur: 0.04, vol: 0.08, cutoff: 3000 }),
      hover: () => tone({ type: 'sine', freq: 1400, dur: 0.025, vol: 0.03 }),
      toggle: () => { tone({ type: 'triangle', freq: 520, dur: 0.05, vol: 0.12 }); tone({ type: 'triangle', freq: 780, dur: 0.06, vol: 0.1, delay: 0.05 }); },
      eat: () => { tone({ type: 'triangle', freq: 520, to: 1040, dur: 0.08, vol: 0.22 }); tone({ type: 'sine', freq: 1560, dur: 0.06, vol: 0.06, delay: 0.03 }); },
      coin: () => { tone({ type: 'square', freq: 988, dur: 0.06, vol: 0.1, cutoff: 4000 }); tone({ type: 'square', freq: 1319, dur: 0.18, vol: 0.1, cutoff: 4000, delay: 0.06 }); },
      power: () => { [0, 4, 7, 12, 16].forEach((s, i) => tone({ type: 'sawtooth', freq: mtof(64 + s), dur: 0.07, vol: 0.08, cutoff: 3500, delay: i * 0.045 })); },
      combo: (n) => tone({ type: 'square', freq: mtof(72 + Math.min(n || 1, 12)), dur: 0.07, vol: 0.08, cutoff: 3000 }),
      die: () => { tone({ type: 'sawtooth', freq: 420, to: 45, dur: 0.6, slide: 0.55, vol: 0.22, cutoff: 1800 }); noise({ freq: 2000, to: 200, filter: 'lowpass', dur: 0.5, vol: 0.25 }); },
      start: () => { [60, 64, 67, 72].forEach((m, i) => tone({ type: 'square', freq: mtof(m), dur: 0.08, vol: 0.1, cutoff: 3500, delay: i * 0.07 })); },
      pause: () => tone({ type: 'sine', freq: 520, to: 330, dur: 0.15, vol: 0.14 }),
      resume: () => tone({ type: 'sine', freq: 330, to: 520, dur: 0.15, vol: 0.14 }),
      levelup: () => { [72, 76, 79, 84, 88].forEach((m, i) => tone({ type: 'triangle', freq: mtof(m), dur: 0.1, vol: 0.14, delay: i * 0.06 })); },
      record: () => { [67, 72, 76, 79, 84].forEach((m, i) => { tone({ type: 'square', freq: mtof(m), dur: 0.12, vol: 0.08, cutoff: 3000, delay: i * 0.09 }); tone({ type: 'sine', freq: mtof(m + 12), dur: 0.12, vol: 0.05, delay: i * 0.09 }); }); },
      error: () => { tone({ type: 'square', freq: 200, dur: 0.08, vol: 0.1, cutoff: 1200 }); tone({ type: 'square', freq: 160, dur: 0.12, vol: 0.1, cutoff: 1200, delay: 0.1 }); },
      whoosh: () => noise({ filter: 'bandpass', freq: 400, to: 3000, dur: 0.25, vol: 0.12 }),
      tick: () => tone({ type: 'sine', freq: 2000, dur: 0.015, vol: 0.04 })
    };
    function sfx(name, arg) {
      if (!settings.get('sfx')) return;
      const c = ensure(); if (!c || c.state !== 'running') return;
      const f = SFX[name]; if (f) f(arg);
    }

    /* ---- Generative music ---- */
    function kick(t, v) { tone({ at: t, type: 'sine', freq: 150, to: 42, slide: 0.12, dur: 0.22, vol: v || 0.7, dest: musicBus }); }
    function snare(t, v) { noise({ at: t, freq: 1800, dur: 0.16, vol: v || 0.22, dest: musicBus }); tone({ at: t, type: 'triangle', freq: 190, to: 150, dur: 0.08, vol: (v || 0.22) * 0.8, dest: musicBus }); }
    function hat(t, v, open) { noise({ at: t, freq: 7500, dur: open ? 0.14 : 0.04, vol: v || 0.07, dest: musicBus }); }

    function seeded(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

    const TRACKS = {
      neon: {
        name: 'Neon Drive', vibe: 'Synthwave', bpm: 104, len: 64,
        chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], bass: [33, 29, 36, 31],
        step(i, t, sd) {
          const bar = Math.floor(i / 16), s = i % 16, ch = this.chords[bar], root = this.bass[bar];
          if (s % 4 === 0) kick(t, 0.6);
          if (s === 4 || s === 12) snare(t, 0.18);
          if (s % 2 === 1) hat(t, 0.05);
          if (s % 2 === 0) tone({ at: t, type: 'sawtooth', freq: mtof(root + (s % 4 === 2 ? 12 : 0)), dur: sd * 1.6, vol: 0.13, cutoff: 700, q: 4, dest: musicBus });
          const arp = [0, 1, 2, 1, 2, 0, 1, 2];
          tone({ at: t, type: 'square', freq: mtof(ch[arp[s % 8]] + 12), dur: sd * 0.8, vol: 0.035, cutoff: 2600, dest: musicBus });
          if (s === 0) ch.forEach((n, k) => tone({ at: t, type: 'sawtooth', freq: mtof(n), dur: sd * 15, attack: 0.4, release: 0.6, vol: 0.022, cutoff: 1300, detune: k * 7 - 7, dest: musicBus }));
        }
      },
      lofi: {
        name: 'Night Shift', vibe: 'Lo-fi chill', bpm: 76, len: 64, swing: 0.16,
        chords: [[62, 65, 69, 72], [55, 59, 62, 65], [60, 64, 67, 71], [57, 60, 64, 67]], bass: [38, 43, 36, 45],
        init() { const r = seeded(42); this.mel = Array.from({ length: 64 }, (_, i) => (i % 2 === 0 && r() < 0.32) ? [74, 76, 79, 81, 84, 86][Math.floor(r() * 6)] : 0); },
        step(i, t, sd) {
          const bar = Math.floor(i / 16), s = i % 16, ch = this.chords[bar];
          if (s === 0 || s === 7 || s === 10) kick(t, 0.45);
          if (s === 4 || s === 12) snare(t, 0.12);
          if (s % 2 === 0) hat(t, s % 4 === 2 ? 0.035 : 0.05);
          if (s === 0 || s === 6 || s === 10) tone({ at: t, type: 'sine', freq: mtof(this.bass[bar]), dur: sd * 3, vol: 0.22, dest: musicBus });
          if (s === 0 || s === 11) ch.forEach((n) => tone({ at: t + Math.random() * 0.02, type: 'triangle', freq: mtof(n), dur: sd * 5, attack: 0.02, release: 0.5, vol: 0.035, cutoff: 1600, dest: musicBus }));
          if (this.mel[i]) tone({ at: t, type: 'sine', freq: mtof(this.mel[i]), dur: sd * 2, release: 0.4, vol: 0.05, dest: musicBus });
        }
      },
      chip: {
        name: 'Pixel Quest', vibe: 'Chiptune', bpm: 144, len: 64,
        chords: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], bass: [36, 31, 33, 29],
        init() {
          const r = seeded(7); const scale = [0, 2, 4, 7, 9, 12, 14, 16];
          this.mel = Array.from({ length: 64 }, (_, i) => {
            const ch = this.chords[Math.floor(i / 16)];
            if (i % 16 === 0) return ch[0] + 12;
            return r() < 0.55 ? 60 + scale[Math.floor(r() * scale.length)] + (r() < 0.2 ? 12 : 0) : 0;
          });
        },
        step(i, t, sd) {
          const bar = Math.floor(i / 16), s = i % 16;
          if (s === 0 || s === 8 || s === 10) kick(t, 0.5);
          if (s === 4 || s === 12) noise({ at: t, freq: 3000, dur: 0.1, vol: 0.15, dest: musicBus });
          if (s % 2 === 0) hat(t, 0.04);
          if (s % 2 === 0) tone({ at: t, type: 'triangle', freq: mtof(this.bass[bar] + (s % 4 ? 12 : 0)), dur: sd * 1.4, vol: 0.2, dest: musicBus });
          if (this.mel[i]) tone({ at: t, type: 'square', freq: mtof(this.mel[i]), dur: sd * 0.9, vol: 0.045, cutoff: 3200, dest: musicBus });
        }
      }
    };

    /* ---- Music stations: MP3 folders in assets/audio/<station>/ ----
       scripts/build-audio-manifest.js writes assets/audio/manifest.json (Vercel runs it on every deploy). */
    const stations = {
      list: [], loaded: false, _p: null,
      load(force) {
        if (this._p && !force) return this._p;
        this._p = fetch(ROOT + 'assets/audio/manifest.json', { cache: 'no-cache' })
          .then((r) => (r.ok ? r.json() : { stations: [] }))
          .catch(() => ({ stations: [] }))
          .then((m) => {
            const enc = (p) => p.split('/').map(encodeURIComponent).join('/');
            this.list = (m.stations || []).filter((st) => st.tracks && st.tracks.length).map((st) => Object.assign({}, st, {
              key: 'st:' + st.id,
              cover: st.cover ? ROOT + 'assets/audio/' + enc(st.folder) + '/' + enc(st.cover) : null,
              tracks: st.tracks.map((t) => Object.assign({}, t, { src: ROOT + 'assets/audio/' + enc(st.folder) + '/' + enc(t.file) }))
            }));
            this.loaded = true; emit('stations', { list: this.list });
            return this.list;
          });
        return this._p;
      },
      get(id) { return this.list.find((st) => st.id === id) || null; }
    };
    const POS_KEY = 'nova.musicpos';
    const readPos = () => { try { return JSON.parse(localStorage.getItem(POS_KEY)) || {}; } catch (e) { return {}; } };
    const writePos = (o) => { try { localStorage.setItem(POS_KEY, JSON.stringify(o)); } catch (e) {} };
    let el = null;
    function mediaEl() {
      if (el) return el;
      el = new Audio(); el.preload = 'auto';
      const c = ensure();
      if (c && c.createMediaElementSource) { try { c.createMediaElementSource(el).connect(musicBus); } catch (e) {} }
      el.addEventListener('ended', () => music.next(true));
      el.addEventListener('playing', () => { music._errs = 0; });
      el.addEventListener('error', () => {
        if (!music.playing || music.mode !== 'file') return;
        music._errs = (music._errs || 0) + 1;
        if (music.station && music._errs < music.station.tracks.length) music.next(true);
        else { music.stop(true); emit('music', { playing: false, error: true }); }
      });
      let last = 0;
      el.addEventListener('timeupdate', () => {
        const now = Date.now(); if (now - last < 400) return; last = now;
        emit('musictime', { time: el.currentTime, duration: el.duration || 0 });
        if (music.station) { const p = readPos(); p[music.station.id] = { i: music.idx, t: Math.floor(el.currentTime) }; writePos(p); }
      });
      return el;
    }
    function resolveKey() {
      const k = settings.get('track') || 'auto';
      if (k === 'auto') return stations.list[0] ? stations.list[0].key : 'neon';
      if (k.startsWith('st:') && stations.loaded && !stations.get(k.slice(3))) return stations.list[0] ? stations.list[0].key : 'neon';
      return k;
    }
    function mediaSession(t, st) {
      if (!('mediaSession' in navigator)) return;
      try {
        navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist || st.name, album: st.name + ' · Nova Radio', artwork: st.cover ? [{ src: st.cover }] : [] });
        navigator.mediaSession.setActionHandler('nexttrack', () => music.next());
        navigator.mediaSession.setActionHandler('previoustrack', () => music.prev());
        navigator.mediaSession.setActionHandler('play', () => settings.set('music', true));
        navigator.mediaSession.setActionHandler('pause', () => settings.set('music', false));
      } catch (e) {}
    }

    const music = {
      playing: false, timer: null, step: 0, next_: 0, track: null, mode: 'gen', station: null, idx: 0, _loaded: null,
      tracks: TRACKS, stations,
      /* What the UI should show, playing or not */
      now() {
        const k = resolveKey();
        if (k.startsWith('st:')) {
          const st = stations.get(k.slice(3));
          if (st) {
            const i = this.station === st ? this.idx : ((readPos()[st.id] || {}).i || 0) % st.tracks.length, t = st.tracks[i];
            return { kind: 'file', key: k, station: st, name: t.title, sub: (t.artist ? t.artist + ' · ' : '') + st.name, vibe: st.vibe || st.name, track: t, index: i, count: st.tracks.length, cover: st.cover, hue: st.hue };
          }
        }
        const tr = TRACKS[k] || TRACKS.neon;
        return { kind: 'gen', key: k, name: tr.name, sub: tr.vibe + ' · ' + tr.bpm + ' BPM', vibe: tr.vibe, bpm: tr.bpm };
      },
      start() {
        const c = ensure(); if (!c || c.state !== 'running' || this.playing) return;
        if (!stations.loaded) { stations.load().then(() => { if (settings.get('music') && !this.held && !EMBED) this.start(); }); return; }
        const k = resolveKey();
        if (k.startsWith('st:')) return this._startFile(stations.get(k.slice(3)));
        this.mode = 'gen';
        this.track = TRACKS[k] || TRACKS.neon;
        if (this.track.init && !this.track.mel) this.track.init();
        this.playing = true; this.step = 0; this.next_ = c.currentTime + 0.12;
        this._fade(settings.get('musicVol') * 0.6, 1.5);
        this.timer = setInterval(() => this._tick(), 25);
        emit('music', { playing: true, track: this.track.name });
      },
      _fade(to, secs) {
        const c = ctx; musicBus.gain.cancelScheduledValues(c.currentTime);
        musicBus.gain.setValueAtTime(musicBus.gain.value, c.currentTime);
        musicBus.gain.linearRampToValueAtTime(to, c.currentTime + secs);
      },
      _startFile(st) {
        const e = mediaEl();
        this.mode = 'file'; this.playing = true;
        if (this.station !== st || !this._loaded) {
          this.station = st;
          const saved = readPos()[st.id];
          if (saved && saved.i < st.tracks.length) this._load(saved.i, saved.t);
          else this._load(settings.get('shuffle') ? Math.floor(Math.random() * st.tracks.length) : 0);
        }
        this._fade(settings.get('musicVol') * 0.6, 0.35);
        const p = e.play(); if (p && p.catch) p.catch(() => {});
        emit('music', { playing: true, track: st.name });
      },
      _load(i, at) {
        const st = this.station, e = mediaEl();
        this.idx = ((i % st.tracks.length) + st.tracks.length) % st.tracks.length;
        const t = st.tracks[this.idx];
        this._loaded = t.src; e.src = t.src;
        if (at) { const seek = () => { try { e.currentTime = at; } catch (x) {} e.removeEventListener('loadedmetadata', seek); }; e.addEventListener('loadedmetadata', seek); }
        mediaSession(t, st);
        const p = readPos(); p[st.id] = { i: this.idx, t: at || 0 }; writePos(p);
      },
      _pick(dir) {
        const n = this.station.tracks.length; if (n < 2) return this.idx;
        if (settings.get('shuffle')) { let j; do { j = Math.floor(Math.random() * n); } while (j === this.idx); return j; }
        return this.idx + dir;
      },
      /* Skip forward. Generated tracks: go to the next station/track in the list. */
      next(auto) {
        if (this.mode === 'file' && this.station && resolveKey() === this.station.key) {
          this._load(this._pick(1));
          if (this.playing) { const p = mediaEl().play(); if (p && p.catch) p.catch(() => {}); }
          emit('music', { playing: this.playing, track: this.station.name }); return;
        }
        if (auto) return;
        const keys = stations.list.map((x) => x.key).concat(Object.keys(TRACKS)), k = resolveKey();
        settings.set('track', keys[(keys.indexOf(k) + 1) % keys.length]);
      },
      prev() {
        if (this.mode === 'file' && this.station && resolveKey() === this.station.key) {
          if (el && el.currentTime > 3) { el.currentTime = 0; return; }
          this._load(settings.get('shuffle') ? this._pick(-1) : this.idx - 1);
          if (this.playing) { const p = mediaEl().play(); if (p && p.catch) p.catch(() => {}); }
          emit('music', { playing: this.playing, track: this.station.name });
        }
      },
      /* Play song i of a station (station key like 'st:hip-hop') */
      playAt(key, i) {
        const st = stations.get(key.slice(3)); if (!st) return;
        if (settings.get('track') !== key || this.mode !== 'file') { this.stop(true); this._s = true; settings.set('track', key); this._s = false; }
        this.station = st; this.mode = 'file'; this._load(i); this.held = false;
        if (!settings.get('music')) settings.set('music', true);
        if (!this.playing) this.start();
        else { const p = mediaEl().play(); if (p && p.catch) p.catch(() => {}); emit('music', { playing: true, track: st.name }); }
      },
      seek(frac) { if (el && el.duration && this.mode === 'file') el.currentTime = Math.max(0, Math.min(0.999, frac)) * el.duration; },
      position() { return el && this.mode === 'file' ? { time: el.currentTime || 0, duration: el.duration || 0 } : null; },
      _tick() {
        const tr = this.track, sd = 60 / tr.bpm / 4;
        while (this.next_ < ctx.currentTime + 0.12) {
          const swing = tr.swing && this.step % 2 ? tr.swing * sd : 0;
          try { tr.step(this.step % tr.len, this.next_ + swing, sd); } catch (e) {}
          this.next_ += sd; this.step++;
        }
      },
      stop(fast) {
        if (!this.playing) return;
        this.playing = false; clearInterval(this.timer);
        if (ctx) { musicBus.gain.cancelScheduledValues(ctx.currentTime); musicBus.gain.setTargetAtTime(0, ctx.currentTime, fast ? 0.02 : 0.25); }
        if (el) setTimeout(() => { if (!music.playing || music.mode !== 'file') el.pause(); }, fast ? 60 : 700);
        emit('music', { playing: false });
      },
      switchTo() { if (this._s) return; if (this.playing) { this.stop(true); setTimeout(() => this.start(), 120); } else emit('music', { playing: false }); },
      duck(on) { if (ctx && this.playing) musicBus.gain.setTargetAtTime(on ? settings.get('musicVol') * 0.2 : settings.get('musicVol') * 0.6, ctx.currentTime, 0.2); }
    };
    if (!EMBED) stations.load();

    /* Browsers block audio until a user gesture — unlock on first interaction */
    function unlock() {
      const c = ensure(); if (!c) return;
      const go = () => { if (!EMBED && !music.held && settings.get('music') && !document.documentElement.hasAttribute('data-no-music')) music.start(); };
      if (c.state === 'suspended') c.resume().then(go); else go();
    }
    ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, function once() {
      unlock(); ['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.removeEventListener(e, once, true));
    }, true));
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) { if (!(music.playing && music.mode === 'file')) ctx.suspend(); } else ctx.resume();
    });

    function spectrum(arr) { if (!analyser) return null; analyser.getByteFrequencyData(arr); return arr; }
    return { sfx, tone, noise, music, applyVolumes, ensure, mtof, spectrum, unlock };
  })();

  /* ------------------------------------------------------------------------
     BACKGROUNDS — procedural, resolution-independent, animated.
     Each preset: { name, pro, scale, trail, setup(ctx,w,h,S), draw(ctx,w,h,t,dt,S) }
     ------------------------------------------------------------------------ */
  const pointer = { x: 0.5, y: 0.5, active: false };
  window.addEventListener('pointermove', (e) => { pointer.x = e.clientX / innerWidth; pointer.y = e.clientY / innerHeight; pointer.active = true; }, { passive: true });

  const rand = (r) => r();
  const PRESETS = {
    void: {
      name: 'Void', scale: 0.55,
      setup(c, w, h, S) {
        const r = seededRand(77);
        S.rings = Array.from({ length: 7 }, (_, i) => ({ r: 0.16 + i * 0.075 + rand(r) * 0.03, sp: (rand(r) - 0.5) * 0.18, ph: rand(r) * 6, lobes: 3 + Math.floor(rand(r) * 5), amp: 0.02 + rand(r) * 0.05, w: 0.6 + rand(r) * 1.6 }));
        S.dust = Array.from({ length: 160 }, () => [rand(r) * w, rand(r) * h, rand(r) * 6, rand(r) * 0.6 + 0.2]);
      },
      draw(c, w, h, t, dt, S) {
        c.globalCompositeOperation = 'source-over';
        c.fillStyle = '#050507'; c.fillRect(0, 0, w, h);
        const cx = w * (0.5 + (pointer.x - 0.5) * 0.04), cy = h * (0.55 + (pointer.y - 0.5) * 0.04), R = Math.min(w, h);
        const glow = c.createRadialGradient(cx, cy, 0, cx, cy, R * 0.8);
        glow.addColorStop(0, 'rgba(60,60,80,.35)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = glow; c.fillRect(0, 0, w, h);
        c.globalCompositeOperation = 'lighter';
        const ring = (ox, oy, col, alpha) => {
          S.rings.forEach((g, i) => {
            c.beginPath();
            for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.05) {
              const rr = R * (g.r + g.amp * Math.sin(a * g.lobes + t * (0.3 + i * 0.05) + g.ph) + 0.012 * Math.sin(a * 23 + t * 2));
              const ang = a + t * g.sp;
              const x = cx + ox + Math.cos(ang) * rr * 1.25, y = cy + oy + Math.sin(ang) * rr * 0.9;
              a === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
            }
            c.strokeStyle = 'rgba(' + col + ',' + alpha * (0.35 + 0.25 * Math.sin(t * 0.7 + i)) + ')';
            c.lineWidth = g.w; c.stroke();
          });
        };
        const d = Math.max(1.5, R * 0.004);
        ring(-d, 0, '255,60,90', 0.5); ring(d, 0, '60,200,255', 0.5); ring(0, 0, '235,235,245', 0.9);
        c.globalCompositeOperation = 'source-over';
        S.dust.forEach((p) => { p[1] -= p[3] * dt * 8; if (p[1] < 0) p[1] = h; c.fillStyle = 'rgba(255,255,255,' + (0.15 + 0.35 * Math.abs(Math.sin(t + p[2]))) + ')'; c.fillRect(p[0], p[1], 1.2, 1.2); });
        const v = c.createRadialGradient(w / 2, h / 2, R * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
        v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.75)');
        c.fillStyle = v; c.fillRect(0, 0, w, h);
      }
    },
    glitch: {
      name: 'Glitch', scale: 0.5,
      setup(c, w, h, S) { const r = seededRand(9); S.bars = Array.from({ length: 26 }, () => ({ y: rand(r) * h, hh: 2 + rand(r) * h * 0.05, sp: 0.2 + rand(r), ph: rand(r) * 6, col: ['255,60,90', '60,200,255', '240,240,250'][Math.floor(rand(r) * 3)] })); },
      draw(c, w, h, t, dt, S) {
        const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#07070b'); g.addColorStop(1, '#100818'); c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.globalCompositeOperation = 'lighter';
        S.bars.forEach((b) => { const on = Math.sin(t * b.sp * 3 + b.ph) > 0.6; if (!on) return; const off = Math.sin(t * 13 + b.ph) * w * 0.04;
          c.fillStyle = 'rgba(' + b.col + ',' + (0.06 + 0.1 * Math.abs(Math.sin(t * 7 + b.ph))) + ')'; c.fillRect(off, (b.y + t * 20 * b.sp) % h, w, b.hh); });
        c.globalCompositeOperation = 'source-over';
        for (let y = 0; y < h; y += 3) { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, y, w, 1); }
        const v = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.7)'); c.fillStyle = v; c.fillRect(0, 0, w, h);
      }
    },
    nebula: {
      name: 'Nebula', scale: 0.5, trail: true,
      setup(c, w, h, S) { const r = seededRand(31); S.p = Array.from({ length: 900 }, () => ({ a: rand(r) * 6.283, d: Math.pow(rand(r), 0.6), s: rand(r) * 1.4 + 0.3, hue: 200 + rand(r) * 120, arm: Math.floor(rand(r) * 3) })); },
      draw(c, w, h, t, dt, S) {
        c.fillStyle = 'rgba(4,4,10,0.35)'; c.fillRect(0, 0, w, h);
        const cx = w / 2 + (pointer.x - 0.5) * w * 0.05, cy = h / 2 + (pointer.y - 0.5) * h * 0.05, R = Math.max(w, h) * 0.55;
        c.globalCompositeOperation = 'lighter';
        S.p.forEach((p) => { const ang = p.a + p.d * 4 + p.arm * 2.094 + t * (0.05 + (1 - p.d) * 0.12); const rr = p.d * R;
          const x = cx + Math.cos(ang) * rr, y = cy + Math.sin(ang) * rr * 0.62;
          c.fillStyle = 'hsla(' + p.hue + ',90%,' + (55 + (1 - p.d) * 30) + '%,' + (0.25 + (1 - p.d) * 0.5) + ')'; c.fillRect(x, y, p.s, p.s); });
        const core = c.createRadialGradient(cx, cy, 0, cx, cy, R * 0.25); core.addColorStop(0, 'rgba(255,220,255,.25)'); core.addColorStop(1, 'rgba(255,220,255,0)'); c.fillStyle = core; c.fillRect(0, 0, w, h);
        c.globalCompositeOperation = 'source-over';
      }
    },
    aurora: {
      name: 'Aurora', scale: 0.3,
      draw(c, w, h, t) {
        c.globalCompositeOperation = 'source-over';
        c.fillStyle = '#07071a'; c.fillRect(0, 0, w, h);
        c.globalCompositeOperation = 'lighter';
        const cols = ['124,58,237', '244,63,94', '6,182,212', '67,56,202', '16,185,129'];
        const R = Math.max(w, h);
        for (let i = 0; i < 5; i++) {
          const x = w * (0.5 + 0.42 * Math.sin(t * (0.05 + i * 0.013) + i * 1.7));
          const y = h * (0.45 + 0.38 * Math.cos(t * (0.04 + i * 0.011) + i * 2.3));
          const r = R * (0.38 + 0.08 * Math.sin(t * 0.1 + i));
          const g = c.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, 'rgba(' + cols[i] + ',0.42)'); g.addColorStop(1, 'rgba(' + cols[i] + ',0)');
          c.fillStyle = g; c.fillRect(0, 0, w, h);
        }
        c.globalCompositeOperation = 'source-over';
      }
    },
    synthwave: {
      name: 'Synthwave', scale: 1,
      setup(c, w, h, S) {
        const r = seededRand(11);
        S.stars = Array.from({ length: 140 }, () => ({ x: rand(r) * w, y: rand(r) * h * 0.6, s: rand(r) * 1.4 + 0.3, p: rand(r) * 6 }));
        const mk = (n, amp, base) => { const pts = []; for (let i = 0; i <= n; i++) pts.push(base - Math.abs(Math.sin(i * 1.3 + rand(r) * 2)) * amp * (0.4 + rand(r) * 0.6)); return pts; };
        S.m1 = mk(14, h * 0.16, 0); S.m2 = mk(22, h * 0.09, 0);
      },
      draw(c, w, h, t, dt, S) {
        const hz = h * 0.62, u = Math.min(w, h) / 800;
        const sky = c.createLinearGradient(0, 0, 0, hz);
        sky.addColorStop(0, '#07021a'); sky.addColorStop(0.55, '#2b0b4f'); sky.addColorStop(1, '#7a1a63');
        c.fillStyle = sky; c.fillRect(0, 0, w, hz);
        S.stars.forEach((s) => { c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.8 + s.p)); c.fillStyle = '#fff'; c.fillRect(s.x, s.y, s.s * u * 1.5, s.s * u * 1.5); });
        c.globalAlpha = 1;
        // sun
        const sr = Math.min(w, h) * 0.24, sx = w / 2, sy = hz - sr * 0.28;
        c.save();
        c.shadowColor = 'rgba(255,60,150,.8)'; c.shadowBlur = 60 * u;
        const sg = c.createLinearGradient(0, sy - sr, 0, sy + sr);
        sg.addColorStop(0, '#ffe36e'); sg.addColorStop(0.5, '#ff8a3d'); sg.addColorStop(1, '#ff2a9d');
        c.beginPath();
        c.rect(0, 0, w, sy);
        const off = (t * 12 * u) % (sr * 0.18);
        for (let k = 0; k < 9; k++) {
          const y0 = sy + k * sr * 0.12 + off, gap = (k + 1) * sr * 0.012;
          c.rect(0, y0, w, sr * 0.12 - gap);
        }
        c.clip();
        c.fillStyle = sg; c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.fill();
        c.restore();
        // mountains
        const drawM = (pts, col, edge, yb) => {
          c.beginPath(); c.moveTo(0, hz);
          pts.forEach((p, i) => c.lineTo((i / (pts.length - 1)) * w, hz + p * yb));
          c.lineTo(w, hz); c.closePath(); c.fillStyle = col; c.fill();
          c.strokeStyle = edge; c.lineWidth = 1.5 * u; c.stroke();
        };
        drawM(S.m1, '#1b0938', 'rgba(255,42,157,.45)', 1);
        drawM(S.m2, '#120626', 'rgba(130,80,255,.5)', 1);
        // ground
        const gg = c.createLinearGradient(0, hz, 0, h);
        gg.addColorStop(0, '#16052e'); gg.addColorStop(1, '#05010f');
        c.fillStyle = gg; c.fillRect(0, hz, w, h - hz);
        c.lineCap = 'round';
        const phase = (t * 0.35) % 1, N = 16;
        for (let i = 0; i < N; i++) {
          const p = (i + phase) / N, y = hz + (h - hz) * Math.pow(p, 2.3);
          c.strokeStyle = 'rgba(255,42,157,' + (0.15 + p * 0.75) + ')'; c.lineWidth = (0.6 + p * 2.2) * u;
          c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke();
        }
        for (let i = -22; i <= 22; i++) {
          c.strokeStyle = 'rgba(255,42,157,0.55)'; c.lineWidth = 1.2 * u;
          c.beginPath(); c.moveTo(w / 2 + i * w * 0.006, hz); c.lineTo(w / 2 + i * w * 0.11, h); c.stroke();
        }
        const hg = c.createLinearGradient(0, hz - 30 * u, 0, hz + 40 * u);
        hg.addColorStop(0, 'rgba(255,42,157,0)'); hg.addColorStop(0.45, 'rgba(255,90,180,.45)'); hg.addColorStop(1, 'rgba(255,42,157,0)');
        c.fillStyle = hg; c.fillRect(0, hz - 30 * u, w, 70 * u);
      }
    },
    starfield: {
      name: 'Warp Speed', scale: 1,
      setup(c, w, h, S) {
        const r = seededRand(3);
        S.stars = Array.from({ length: 520 }, () => ({ x: rand(r) * 2 - 1, y: rand(r) * 2 - 1, z: rand(r), hue: [210, 260, 190, 320][Math.floor(rand(r) * 4)] }));
        const o = document.createElement('canvas'); o.width = w; o.height = h; const oc = o.getContext('2d');
        oc.fillStyle = '#02020a'; oc.fillRect(0, 0, w, h);
        [['80,40,200', 0.3, 0.35], ['200,40,120', 0.75, 0.65], ['20,120,200', 0.55, 0.2]].forEach(([col, x, y]) => {
          const g = oc.createRadialGradient(w * x, h * y, 0, w * x, h * y, Math.max(w, h) * 0.5);
          g.addColorStop(0, 'rgba(' + col + ',.22)'); g.addColorStop(1, 'rgba(' + col + ',0)'); oc.fillStyle = g; oc.fillRect(0, 0, w, h);
        });
        S.base = o;
      },
      draw(c, w, h, t, dt, S) {
        c.drawImage(S.base, 0, 0);
        const cx = w / 2 + (pointer.x - 0.5) * w * 0.08, cy = h / 2 + (pointer.y - 0.5) * h * 0.08, f = Math.max(w, h) * 0.5;
        const sp = 0.12 * Math.min(dt, 0.05) * 4;
        S.stars.forEach((s) => {
          const pz = s.z; s.z -= sp;
          if (s.z <= 0.02) { s.z = 1; s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; return; }
          const x = cx + (s.x / s.z) * f, y = cy + (s.y / s.z) * f, px = cx + (s.x / pz) * f, py = cy + (s.y / pz) * f;
          if (x < 0 || x > w || y < 0 || y > h) { s.z = 1; return; }
          const a = Math.min(1, (1 - s.z) * 1.4);
          c.strokeStyle = 'hsla(' + s.hue + ',90%,85%,' + a + ')'; c.lineWidth = (1 - s.z) * 2.6 + 0.3;
          c.beginPath(); c.moveTo(px, py); c.lineTo(x, y); c.stroke();
        });
      }
    },
    constellation: {
      name: 'Constellation', scale: 1,
      setup(c, w, h, S) {
        const r = seededRand(21);
        const o = document.createElement('canvas'); o.width = w; o.height = h; const oc = o.getContext('2d');
        oc.fillStyle = '#060614'; oc.fillRect(0, 0, w, h);
        for (let i = 0; i < 26; i++) {
          const x = rand(r) * w, y = rand(r) * h, rr = Math.max(w, h) * (0.08 + rand(r) * 0.25);
          const col = ['139,92,246', '236,72,153', '34,211,238', '99,102,241'][i % 4];
          const g = oc.createRadialGradient(x, y, 0, x, y, rr);
          g.addColorStop(0, 'rgba(' + col + ',' + (0.05 + rand(r) * 0.1) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
          oc.fillStyle = g; oc.fillRect(0, 0, w, h);
        }
        for (let i = 0; i < 400; i++) { oc.fillStyle = 'rgba(255,255,255,' + rand(r) * 0.5 + ')'; oc.fillRect(rand(r) * w, rand(r) * h, 1, 1); }
        S.base = o;
        const n = Math.round(Math.min(110, (w * h) / 14000));
        S.p = Array.from({ length: n }, () => ({ x: rand(r) * w, y: rand(r) * h, vx: (rand(r) - 0.5) * 14, vy: (rand(r) - 0.5) * 14, r: rand(r) * 1.6 + 0.6, ph: rand(r) * 6 }));
        S.link = Math.min(w, h) * 0.17;
      },
      draw(c, w, h, t, dt, S) {
        c.drawImage(S.base, 0, 0);
        const mx = pointer.x * w, my = pointer.y * h, L = S.link;
        S.p.forEach((p) => {
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.x < 0) p.x += w; if (p.x > w) p.x -= w; if (p.y < 0) p.y += h; if (p.y > h) p.y -= h;
        });
        c.lineWidth = 1;
        for (let i = 0; i < S.p.length; i++) {
          const a = S.p[i];
          for (let j = i + 1; j < S.p.length; j++) {
            const b = S.p[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
            if (d < L * L) { c.strokeStyle = 'rgba(167,139,250,' + (1 - Math.sqrt(d) / L) * 0.35 + ')'; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
          }
          if (pointer.active) {
            const dx = a.x - mx, dy = a.y - my, d = Math.sqrt(dx * dx + dy * dy);
            if (d < L * 1.4) { c.strokeStyle = 'rgba(244,114,182,' + (1 - d / (L * 1.4)) * 0.6 + ')'; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(mx, my); c.stroke(); }
          }
          c.fillStyle = 'rgba(255,255,255,' + (0.55 + 0.45 * Math.sin(t * 2 + a.ph)) + ')';
          c.beginPath(); c.arc(a.x, a.y, a.r, 0, Math.PI * 2); c.fill();
        }
      }
    },
    tide: {
      name: 'Midnight Tide', scale: 0.75,
      setup(c, w, h, S) { const r = seededRand(5); S.stars = Array.from({ length: 120 }, () => [rand(r) * w, rand(r) * h * 0.5, rand(r) * 6]); },
      draw(c, w, h, t, dt, S) {
        const g = c.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#020617'); g.addColorStop(0.5, '#0c1a3a'); g.addColorStop(1, '#063047');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        S.stars.forEach(([x, y, p]) => { c.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.5 * Math.abs(Math.sin(t + p))) + ')'; c.fillRect(x, y, 1.4, 1.4); });
        const mx = w * 0.72, my = h * 0.24, mr = Math.min(w, h) * 0.07;
        const mg = c.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 5);
        mg.addColorStop(0, 'rgba(186,230,253,.35)'); mg.addColorStop(1, 'rgba(186,230,253,0)');
        c.fillStyle = mg; c.fillRect(0, 0, w, h);
        c.fillStyle = '#e0f2fe'; c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.fill();
        const layers = [['#0e7490', 0.55, 0.5], ['#0b5c78', 0.62, 0.7], ['#083d5c', 0.7, 0.9], ['#06283f', 0.8, 1.1], ['#041a2c', 0.9, 1.3]];
        layers.forEach(([col, base, sp], i) => {
          c.beginPath(); c.moveTo(0, h);
          for (let x = 0; x <= w; x += 8) {
            const y = h * base + Math.sin(x * 0.006 + t * sp + i) * h * 0.02 + Math.sin(x * 0.013 - t * sp * 0.7 + i * 2) * h * 0.012;
            c.lineTo(x, y);
          }
          c.lineTo(w, h); c.closePath(); c.globalAlpha = 0.92; c.fillStyle = col; c.fill(); c.globalAlpha = 1;
        });
        for (let i = 0; i < 40; i++) {
          const x = mx + Math.sin(i * 12.9 + t * 0.6) * mr * 1.6, y = h * 0.58 + i * h * 0.009;
          c.fillStyle = 'rgba(224,242,254,' + (0.35 * Math.abs(Math.sin(t * 2 + i))) + ')';
          c.fillRect(x, y, mr * (0.6 + Math.sin(i + t) * 0.4), 1.5);
        }
      }
    },
    rain: {
      name: 'Code Rain', scale: 1, trail: true,
      setup(c, w, h, S) {
        S.fs = Math.max(12, Math.round(Math.min(w, h) / 48));
        S.cols = Array.from({ length: Math.ceil(w / S.fs) }, () => Math.random() * -h / S.fs);
        S.chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF<>/{}*+'.split('');
        c.fillStyle = '#04030c'; c.fillRect(0, 0, w, h); S.acc = 0;
      },
      draw(c, w, h, t, dt, S) {
        S.acc += dt; if (S.acc < 1 / 24) return; S.acc = 0;
        c.fillStyle = 'rgba(4,3,12,0.14)'; c.fillRect(0, 0, w, h);
        c.font = '600 ' + S.fs + 'px "Chakra Petch", monospace';
        S.cols.forEach((y, i) => {
          const ch = S.chars[(Math.random() * S.chars.length) | 0], x = i * S.fs;
          c.fillStyle = i % 7 === 0 ? 'rgba(244,114,182,.85)' : 'rgba(167,139,250,.75)';
          c.fillText(ch, x, y * S.fs);
          c.fillStyle = '#f5f3ff'; c.fillText(S.chars[(Math.random() * S.chars.length) | 0], x, (y + 1) * S.fs);
          S.cols[i] = y * S.fs > h && Math.random() > 0.975 ? 0 : y + 1;
        });
      }
    },
    midnight: {
      name: 'Midnight (static)', scale: 0.5, still: true,
      draw(c, w, h) {
        const g = c.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#0b0b1d'); g.addColorStop(0.5, '#151235'); g.addColorStop(1, '#1a0c26');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        const rg = c.createRadialGradient(w * 0.8, 0, 0, w * 0.8, 0, Math.max(w, h) * 0.7);
        rg.addColorStop(0, 'rgba(139,92,246,.25)'); rg.addColorStop(1, 'rgba(139,92,246,0)');
        c.fillStyle = rg; c.fillRect(0, 0, w, h);
      }
    },
    plasma: {
      name: 'Plasma Flux', scale: 0.12,
      draw(c, w, h, t) {
        const img = c.createImageData(w, h), d = img.data;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const v = Math.sin(x * 0.09 + t) + Math.sin(y * 0.07 - t * 0.8) + Math.sin((x + y) * 0.05 + t * 0.6) + Math.sin(Math.sqrt(x * x + y * y) * 0.08 - t);
          const k = (y * w + x) * 4;
          d[k] = 120 + 110 * Math.sin(v * 1.2); d[k + 1] = 30 + 40 * Math.sin(v * 1.2 + 2); d[k + 2] = 150 + 100 * Math.sin(v * 1.2 + 4); d[k + 3] = 255;
        }
        c.putImageData(img, 0, 0);
      }
    },
    prism: {
      name: 'Prism Bloom', scale: 0.6,
      draw(c, w, h, t) {
        c.fillStyle = '#05050f'; c.fillRect(0, 0, w, h);
        c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 9; i++) {
          const a = t * 0.15 + (i * Math.PI * 2) / 9, R = Math.max(w, h) * 0.7;
          c.fillStyle = 'hsla(' + (i * 40 + t * 20) + ',90%,55%,0.10)';
          c.beginPath(); c.moveTo(w / 2, h / 2);
          c.lineTo(w / 2 + Math.cos(a) * R, h / 2 + Math.sin(a) * R);
          c.lineTo(w / 2 + Math.cos(a + 0.5) * R, h / 2 + Math.sin(a + 0.5) * R); c.fill();
        }
        c.globalCompositeOperation = 'source-over';
      }
    }
  };
  function seededRand(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  function mountBg(canvas, id, opts) {
    opts = opts || {};
    const def = PRESETS[id] || PRESETS.aurora;
    const c = canvas.getContext('2d');
    const S = {};
    let w = 0, h = 0, raf = 0, last = 0, t = opts.t0 || 4 + Math.random() * 20, alive = true;
    const still = opts.static || def.still;
    function resize() {
      const cw = opts.width || window.innerWidth, ch = opts.height || window.innerHeight;
      const dpr = opts.width ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      const sc = def.scale || 1;
      canvas.width = Math.max(8, Math.round(cw * dpr * sc)); canvas.height = Math.max(8, Math.round(ch * dpr * sc));
      w = canvas.width; h = canvas.height;
      for (const k in S) delete S[k];
      if (def.setup) def.setup(c, w, h, S);
      if (still) renderStill();
    }
    function renderStill() {
      const n = def.trail ? 80 : 1;
      for (let i = 0; i < n; i++) { if (def.trail) S.acc = 1; def.draw(c, w, h, t + i / 30, 1 / 30, S); }
    }
    function loop(now) {
      if (!alive) return;
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60; last = now;
      if (!document.hidden) { t += dt; def.draw(c, w, h, t, dt, S); }
      raf = requestAnimationFrame(loop);
    }
    resize();
    if (!still) raf = requestAnimationFrame(loop);
    const onResize = () => { clearTimeout(S._rt); S._rt = setTimeout(resize, 120); };
    if (!opts.width) window.addEventListener('resize', onResize);
    return { destroy() { alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); } };
  }

  const bg = {
    presets: PRESETS,
    mount: mountBg,
    _page: null, _paused: false,
    /* stop animating while something covers the wallpaper (saves CPU on Chromebooks) */
    pause() { if (this._paused) return; this._paused = true; if (this._page) { this._page.destroy(); this._page = null; } },
    resume() { if (!this._paused) return; this._paused = false; this.applyPage(); },
    applyPage() {
      if (EMBED) { document.documentElement.style.background = '#08080f'; return; }
      if (this._paused) return;
      let canvas = document.getElementById('bg-canvas');
      let img = document.querySelector('.bg-image');
      if (!canvas) {
        canvas = document.createElement('canvas'); canvas.id = 'bg-canvas'; canvas.setAttribute('aria-hidden', 'true');
        document.body.prepend(canvas);
        const v = document.createElement('div'); v.className = 'bg-vignette'; document.body.prepend(v);
      }
      if (!img) { img = document.createElement('div'); img.className = 'bg-image'; document.body.prepend(img); }
      if (this._page) { this._page.destroy(); this._page = null; }
      let id = settings.get('bg');
      if (!PRESETS[id] && id !== 'custom') id = 'void';
      if (id === 'custom') {
        const data = store.get('customBg', null);
        if (data) { canvas.style.display = 'none'; img.style.display = 'block'; img.style.backgroundImage = 'url(' + data + ')'; return; }
        id = 'aurora';
      }
      img.style.display = 'none'; canvas.style.display = 'block';
      this._page = mountBg(canvas, id, { static: settings.reducedMotion() });
    }
  };

  /* ------------------------------------------------------------------------
     UI — toasts, modals and shared panels
     ------------------------------------------------------------------------ */
  function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  function toast(msg, iconName, opts) {
    opts = opts || {};
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) { wrap = el('<div class="toast-wrap" role="status" aria-live="polite"></div>'); document.body.appendChild(wrap); }
    try { const h = store.get('notifs', []); h.unshift({ msg: String(msg), icon: iconName || 'info', at: Date.now(), ach: !!opts.achievement, big: !!opts.big }); store.set('notifs', h.slice(0, 40)); store.set('notifsUnread', (store.get('notifsUnread', 0) || 0) + 1); emit('notif'); } catch (e) {}
    const t = el('<div class="toast' + (opts.big ? ' toast-big' : '') + (opts.achievement ? ' toast-ach' : '') + '">' + icon(iconName || 'info') + '<span>' + esc(msg) + '</span></div>');
    wrap.appendChild(t);
    while (wrap.children.length > 4) wrap.firstElementChild.remove();
    setTimeout(() => { t.classList.add('is-leaving'); setTimeout(() => t.remove(), 260); }, opts.big ? 4200 : 2800);
  }

  function modal(inner, opts) {
    opts = opts || {};
    const prevFocus = document.activeElement;
    const back = el('<div class="modal-backdrop"><div class="modal ' + (opts.wide ? 'modal-wide' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(opts.label || 'Dialog') + '">' +
      '<button class="icon-btn modal-close" aria-label="Close">' + icon('x') + '</button></div></div>');
    const box = back.querySelector('.modal');
    if (typeof inner === 'string') box.insertAdjacentHTML('beforeend', inner); else box.appendChild(inner);
    document.body.appendChild(back);
    requestAnimationFrame(() => back.classList.add('is-open'));
    audio.sfx('whoosh'); audio.music.duck(false);
    const focusables = () => box.querySelectorAll('button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"]), a[href]');
    setTimeout(() => { const f = box.querySelector('[autofocus]') || focusables()[1] || focusables()[0]; f && f.focus(); }, 50);
    function close() {
      back.classList.remove('is-open'); document.removeEventListener('keydown', key, true);
      setTimeout(() => { back.remove(); opts.onClose && opts.onClose(); prevFocus && prevFocus.focus && prevFocus.focus(); }, 220);
    }
    function key(e) {
      if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); }
      if (e.key === 'Tab') {
        const f = Array.from(focusables()); if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    }
    document.addEventListener('keydown', key, true);
    back.addEventListener('pointerdown', (e) => { if (e.target === back) close(); });
    box.querySelector('.modal-close').addEventListener('click', close);
    return { el: box, close };
  }

  /* ---- Auth modal ---- */
  function openAuth(mode) {
    mode = mode || 'login';
    const isCloud = auth.mode === 'cloud';
    const lockIco = icon('lock').replace('<svg', '<svg style="display:inline;width:13px;height:13px;vertical-align:-2px"');
    const m = modal(
      '<h2 id="auth-title">Welcome, player</h2><p class="modal-sub">' + (isCloud ? 'Your scores, settings and saves follow you to every device.' : 'Save high scores, stats and settings to your profile.') + '</p>' +
      '<div class="tabs" role="tablist"><button class="tab" role="tab" data-mode="login">Log in</button><button class="tab" role="tab" data-mode="signup">Create account</button></div>' +
      '<form novalidate class="auth-form" style="display:grid;gap:14px">' +
      '<div class="field au-uname"><label for="au-user">Username</label><input class="input" id="au-user" autocomplete="username" maxlength="18" spellcheck="false"><div class="field-hint au-uhint">Shown on leaderboards. Letters, numbers, underscores.</div><div class="field-error" id="au-user-err"></div></div>' +
      (isCloud ? '<div class="field au-email"><label for="au-email">Email</label><input class="input" id="au-email" type="email" autocomplete="email" spellcheck="false"><div class="field-error" id="au-email-err"></div></div>' : '') +
      '<div class="field"><div style="display:flex;justify-content:space-between;align-items:baseline"><label for="au-pass">Password</label>' + (isCloud ? '<a href="#" class="au-forgot" style="font-size:13px">Forgot password?</a>' : '') + '</div><input class="input" id="au-pass" type="password" autocomplete="current-password"><div class="field-error" id="au-pass-err"></div></div>' +
      '<div class="field au-confirm" hidden><label for="au-pass2">Confirm password</label><input class="input" id="au-pass2" type="password" autocomplete="new-password"><div class="field-error" id="au-pass2-err"></div></div>' +
      '<div class="field-error au-form-err" role="alert"></div>' +
      '<button class="btn btn-primary btn-lg btn-block au-submit" type="submit">Log in</button>' +
      '<button class="btn btn-ghost btn-block au-guest" type="button">Keep playing as guest</button>' +
      '<p class="field-hint" style="text-align:center">' + lockIco + (isCloud ? ' Secured cloud account. We never see your password.' : ' Accounts are stored on this device. Passwords are hashed.') + '</p>' +
      '</form>', { label: 'Log in or create account' });
    const box = m.el, form = box.querySelector('form');
    const q = (sel) => box.querySelector(sel);
    const setMode = (md) => {
      mode = md;
      box.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.mode === md)));
      q('.au-confirm').hidden = md !== 'signup';
      if (isCloud) q('.au-uname').hidden = md !== 'signup';
      q('.au-uhint').hidden = md !== 'signup';
      q('.au-submit').textContent = md === 'signup' ? 'Create free account' : 'Log in';
      q('#au-pass').autocomplete = md === 'signup' ? 'new-password' : 'current-password';
      q('#auth-title').textContent = md === 'signup' ? 'Join the arcade' : 'Welcome back';
      if (q('.au-forgot')) q('.au-forgot').hidden = md === 'signup';
      box.querySelectorAll('.field-error').forEach((e) => (e.textContent = ''));
      setTimeout(() => { const f = isCloud && md === 'login' ? q('#au-email') : q('#au-user'); f && f.focus(); }, 30);
    };
    box.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => { audio.sfx('click'); setMode(t.dataset.mode); }));
    setMode(mode);
    const setErr = (id, msg) => { const i = q('#' + id), e = q('#' + id + '-err'); if (!i) return; e.textContent = msg; i.setAttribute('aria-invalid', msg ? 'true' : 'false'); };
    q('#au-user').addEventListener('blur', async (e) => {
      const v = e.target.value.trim(); if (mode !== 'signup' || !v) return;
      const err = auth.validateUsername(v); setErr('au-user', err);
      if (!err && !(await auth.usernameAvailable(v))) setErr('au-user', 'That username is taken.');
    });
    if (q('.au-forgot')) q('.au-forgot').addEventListener('click', async (e) => {
      e.preventDefault();
      const email = q('#au-email').value.trim(), ee = auth.validateEmail(email);
      if (ee) { setErr('au-email', 'Enter your email above, then tap “Forgot password?”'); return; }
      try { await auth.resetPassword(email); toast('Check your email for a reset link.', 'bell'); m.close(); }
      catch (err) { q('.au-form-err').textContent = err.message; }
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = q('#au-user').value.trim(), p = q('#au-pass').value, p2 = q('#au-pass2').value, em = isCloud ? q('#au-email').value.trim() : '';
      const signup = mode === 'signup';
      const ue = signup ? auth.validateUsername(u) : (!isCloud && !u ? 'Enter your username.' : '');
      const ee = isCloud ? auth.validateEmail(em) : '';
      const pe = signup ? auth.validatePassword(p) : (p ? '' : 'Enter your password.');
      const ce = signup && p !== p2 ? 'Passwords don’t match.' : '';
      setErr('au-user', ue); if (isCloud) setErr('au-email', ee); setErr('au-pass', pe); if (signup) setErr('au-pass2', ce);
      q('.au-form-err').textContent = '';
      if (ue || ee || pe || ce) { audio.sfx('error'); return; }
      const btn = q('.au-submit'); btn.disabled = true; btn.textContent = 'One sec…';
      try {
        if (signup) {
          const res = await auth.signUp(u, p, em);
          if (res.needsConfirm) {
            audio.sfx('coin'); m.close();
            modal('<h2>Check your email</h2><p class="modal-sub">We sent a confirmation link to <b>' + esc(em) + '</b>. Click it and you’ll be signed in as <b>' + esc(u) + '</b>.</p><p class="field-hint">No email after a minute? Check spam, or try logging in — your account may already be active.</p>', { label: 'Confirm your email' });
            return;
          }
          audio.sfx('levelup'); m.close(); toast('Account created — welcome, ' + res.user.username + '!', 'star');
        } else {
          const user = await auth.logIn(isCloud ? em : u, p);
          audio.sfx('levelup'); m.close(); toast('Welcome back, ' + user.username + '!' + (auth.isOwner() ? ' Owner mode on.' : ''), 'star');
        }
      } catch (err) {
        audio.sfx('error'); q('.au-form-err').textContent = err.message;
        btn.disabled = false; btn.textContent = signup ? 'Create free account' : 'Log in';
      }
    });
    q('.au-guest').addEventListener('click', () => { audio.sfx('click'); m.close(); });
  }

  /* After clicking a password-reset email link */
  function openResetPassword() {
    const m = modal('<h2>Choose a new password</h2><p class="modal-sub">You’re almost back in.</p><form novalidate style="display:grid;gap:14px"><div class="field"><label for="rp-1">New password</label><input class="input" id="rp-1" type="password" autocomplete="new-password" autofocus></div><div class="field-error rp-err" role="alert"></div><button class="btn btn-primary btn-lg btn-block" type="submit">Save password</button></form>', { label: 'Reset password' });
    m.el.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault(); const v = m.el.querySelector('#rp-1').value, err = auth.validatePassword(v);
      if (err) { m.el.querySelector('.rp-err').textContent = err; return; }
      try { await auth.updatePassword(v); m.close(); toast('Password updated.', 'check'); } catch (x) { m.el.querySelector('.rp-err').textContent = x.message; }
    });
  }

  /* ---- Upgrade modal ---- */
  function openUpgrade() { toast('Everything on Nova is free now!', 'star'); }

  /* ---- Profile modal ---- */
  function fmtTime(sec) { sec = Math.round(sec); if (sec < 60) return sec + 's'; const m = Math.floor(sec / 60); return m < 60 ? m + 'm' : Math.floor(m / 60) + 'h ' + (m % 60) + 'm'; }
  function openProfile() {
    const u = auth.current();
    if (!u) return openAuth('login');
    const sum = scores.summary();
    const rows = games.filter((g) => g.status === 'live').map((g) => {
      const r = sum.games[g.id] || { best: 0, plays: 0 };
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-radius:12px;background:rgba(0,0,0,.25)"><span style="font-weight:600">' + esc(g.title) + '</span><span style="color:var(--fg-dim);font-size:14px">Best <b style="color:var(--fg)">' + r.best.toLocaleString() + '</b> · ' + r.plays + ' plays</span></div>';
    }).join('');
    modal(
      '<div style="display:flex;align-items:center;gap:16px;margin-bottom:22px">' +
      '<div class="avatar" style="width:64px;height:64px;font-size:26px;border-radius:18px;background:linear-gradient(135deg,hsl(' + u.hue + ',80%,60%),hsl(' + (u.hue + 60) + ',80%,55%))">' + esc(u.username[0].toUpperCase()) + '</div>' +
      '<div><h2 style="margin:0">' + esc(u.username) + '</h2><div style="display:flex;gap:8px;margin-top:6px;align-items:center;flex-wrap:wrap">' + (auth.isOwner() ? '<span class="badge badge-pro">' + icon('crown') + 'Owner</span>' : '') + '<span class="badge">' + icon(u.cloud ? 'cloud' : 'phone') + (u.cloud ? 'Synced' : 'This device') + '</span><span class="field-hint">Joined ' + new Date(u.created).toLocaleDateString() + '</span></div></div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px">' +
      '<div class="glass" style="padding:16px"><div class="field-hint">Games played</div><div style="font-family:var(--font-display);font-size:28px">' + sum.plays + '</div></div>' +
      '<div class="glass" style="padding:16px"><div class="field-hint">Time played</div><div style="font-family:var(--font-display);font-size:28px">' + fmtTime(sum.time) + '</div></div></div>' +
      '<h3 style="font-family:var(--font-ui);font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--fg-faint);margin-bottom:10px">Personal bests</h3>' +
      '<div style="display:grid;gap:8px">' + (rows || '<p class="field-hint">No games yet.</p>') + '</div>' +
      '',
      { label: 'Your profile' });
  }

  /* ---- Settings modal ---- */
  const ACCENTS = [['violet', '#8b5cf6'], ['cyan', '#06b6d4'], ['lime', '#84cc16'], ['sunset', '#f97316'], ['rose', '#f43f5e']];
  function openSettings(target) {
    const s = settings.all();
    const curKey = audio.music.now().key;
    const trackOpts = (audio.music.stations.list.length ? '<optgroup label="Stations">' + audio.music.stations.list.map((st) => '<option value="' + st.key + '"' + (curKey === st.key ? ' selected' : '') + '>' + esc(st.name) + ' — ' + st.tracks.length + ' song' + (st.tracks.length === 1 ? '' : 's') + '</option>').join('') + '</optgroup>' : '') +
      '<optgroup label="Generated live">' + Object.entries(audio.music.tracks).map(([k, v]) => '<option value="' + k + '"' + (curKey === k ? ' selected' : '') + '>' + v.name + ' — ' + v.vibe + '</option>').join('') + '</optgroup>';
    const sw = (id, on, label, desc) => '<div class="setting-row"><div><div class="label" id="lbl-' + id + '">' + label + '</div>' + (desc ? '<div class="desc">' + desc + '</div>' : '') + '</div><label class="switch"><input type="checkbox" data-set="' + id + '" aria-labelledby="lbl-' + id + '"' + (on ? ' checked' : '') + '><span></span></label></div>';
    const html = (
      (target ? '' : '<h2>Settings</h2><p class="modal-sub">Make the arcade yours. Changes save automatically.</p>') +
      '<section class="settings-group"><h3>Background</h3><div class="bg-grid"></div>' +
      '<label class="btn btn-sm" style="margin-top:12px;cursor:pointer">' + icon('upload') + 'Use my own image<input type="file" accept="image/*" class="sr-only bg-upload"></label></section>' +
      '<section class="settings-group"><h3>Audio</h3>' +
      sw('music', s.music, 'Music', 'Your stations, or tracks generated live') +
      '<div class="setting-row"><label class="label" for="set-track">Track</label><select class="select" id="set-track" style="max-width:240px;min-height:42px">' + trackOpts + '</select></div>' +
      '<div class="setting-row"><label class="label" for="set-mv">Music volume</label><input class="range" type="range" id="set-mv" min="0" max="1" step="0.05" value="' + s.musicVol + '"></div>' +
      sw('sfx', s.sfx, 'Sound effects') +
      '<div class="setting-row"><label class="label" for="set-sv">Effects volume</label><input class="range" type="range" id="set-sv" min="0" max="1" step="0.05" value="' + s.sfxVol + '"></div></section>' +
      '<section class="settings-group"><h3>Look &amp; feel</h3>' +
      '<div class="setting-row"><div class="label">Accent color</div><div class="swatches">' + ACCENTS.map(([k, c]) => '<button class="swatch" style="background:' + c + '" data-accent="' + k + '" aria-label="' + k + ' accent" aria-pressed="' + (s.accent === k) + '"></button>').join('') + '</div></div>' +
      sw('crt', s.crt, 'CRT scanlines', 'Retro monitor overlay') +
      sw('shake', s.shake, 'Screen shake', 'Impact feedback in games') +
      sw('reducedMotion', s.reducedMotion, 'Reduce motion', 'Freeze backgrounds and calm animations') + '</section>' +
      '<section class="settings-group"><h3>System</h3>' +
      sw('pauseMusicInGames', s.pauseMusicInGames, 'Pause music in games', 'Games play their own sound') +
      sw('showFps', s.showFps, 'FPS counter', 'Show frame rate in the dock') +
      sw('gamesMaximized', s.gamesMaximized, 'Open games full size', 'Otherwise games open in a window') +
      sw('lockScreen', s.lockScreen, 'Lock screen on start', 'Show the big clock before the desktop') +
      sw('clock24', s.clock24, '24-hour clock') + '</section>' +
      '<section class="settings-group"><h3>Data</h3><div class="setting-row"><div><div class="label">Reset this device</div><div class="desc">Clears scores, settings and local accounts</div></div><button class="btn btn-sm st-reset">' + icon('trash') + 'Reset</button></div></section>');
    const thumbs = [];
    let m;
    if (target) { target.innerHTML = html; m = { el: target, close() {} }; target._destroy = () => thumbs.forEach((t) => t.destroy()); }
    else m = modal(html, { wide: true, label: 'Settings', onClose: () => thumbs.forEach((t) => t.destroy()) });
    const box = m.el;
    // background tiles with live thumbnails
    const grid = box.querySelector('.bg-grid');
    const ids = Object.keys(PRESETS).concat(store.get('customBg', null) ? ['custom'] : []);
    ids.forEach((id) => {
      const def = PRESETS[id]; const locked = def && def.pro && !auth.isPro();
      const tile = el('<button class="bg-tile' + (locked ? ' is-locked' : '') + '" aria-pressed="' + (s.bg === id) + '" aria-label="' + (def ? def.name : 'My image') + (locked ? ' (Pro)' : '') + '"><span class="bg-tile-name">' + (def ? def.name : 'My image') + '</span>' + (locked ? '<span class="badge badge-pro lock">' + icon('lock') + 'Pro</span>' : '') + '</button>');
      if (def) {
        const cv = document.createElement('canvas'); tile.prepend(cv);
        thumbs.push(mountBg(cv, id, { width: 236, height: 148, static: true }));
      } else {
        tile.prepend(el('<div class="bg-tile-img" style="background-image:url(' + store.get('customBg', '') + ')"></div>'));
      }
      tile.addEventListener('click', () => {
        if (locked) { audio.sfx('error'); toast('Premium backgrounds come with Pro.', 'crown'); return; }
        audio.sfx('toggle'); grid.querySelectorAll('.bg-tile').forEach((x) => x.setAttribute('aria-pressed', 'false'));
        tile.setAttribute('aria-pressed', 'true'); settings.set('bg', id); meta.flag('customized');
      });
      grid.appendChild(tile);
    });
    box.querySelector('.bg-upload').addEventListener('change', (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const im = new Image();
        im.onload = () => {
          const max = 1920, k = Math.min(1, max / Math.max(im.width, im.height));
          const cv = document.createElement('canvas'); cv.width = im.width * k; cv.height = im.height * k;
          cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
          let data = cv.toDataURL('image/jpeg', 0.85);
          if (!store.set('customBg', data)) { data = cv.toDataURL('image/jpeg', 0.6); if (!store.set('customBg', data)) { toast('That image is too large to save.', 'info'); return; } }
          settings.set('bg', 'custom'); meta.flag('customized'); audio.sfx('coin'); toast('Background updated.', 'image');
          if (target) openSettings(target); else { m.close(); setTimeout(openSettings, 260); }
        };
        im.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
    box.querySelectorAll('input[data-set]').forEach((i) => i.addEventListener('change', () => { audio.sfx('toggle'); settings.set(i.dataset.set, i.checked); }));
    box.querySelector('#set-track').addEventListener('change', (e) => settings.set('track', e.target.value));
    box.querySelector('#set-mv').addEventListener('input', (e) => settings.set('musicVol', +e.target.value));
    box.querySelector('#set-sv').addEventListener('input', (e) => settings.set('sfxVol', +e.target.value));
    box.querySelector('#set-sv').addEventListener('change', () => audio.sfx('coin'));
    box.querySelectorAll('.swatch').forEach((b) => b.addEventListener('click', () => {
      audio.sfx('toggle'); box.querySelectorAll('.swatch').forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true'); settings.set('accent', b.dataset.accent);
    }));
    box.querySelector('.st-reset').addEventListener('click', (e) => {
      const b = e.currentTarget;
      if (!b.dataset.confirm) { b.dataset.confirm = '1'; b.innerHTML = icon('trash') + 'Tap again to confirm'; audio.sfx('error'); return; }
      Object.keys(localStorage).filter((k) => k.startsWith('nova.')).forEach((k) => localStorage.removeItem(k));
      location.reload();
    });
  }

  /* ---- Music / mute quick toggle helpers ---- */
  function bindMusicButton(btn) {
    const paint = () => { const on = settings.get('music'); btn.classList.toggle('is-off', !on); btn.setAttribute('aria-pressed', String(on)); btn.setAttribute('aria-label', on ? 'Turn music off' : 'Turn music on'); btn.innerHTML = icon(on ? 'music' : 'volumeX'); };
    btn.addEventListener('click', () => { settings.set('music', !settings.get('music')); audio.sfx('toggle'); paint(); toast(settings.get('music') ? 'Now playing: ' + audio.music.now().name : 'Music off', 'music'); });
    on('settings', (d) => d.key === 'music' && paint());
    paint();
  }

  /* subtle hover/click sounds on any .btn / .icon-btn / .chip */
  document.addEventListener('pointerenter', (e) => {
    const t = e.target; if (t && t.matches && t.matches('.btn:not([disabled]), .game-card, .chip') && e.pointerType === 'mouse') audio.sfx('hover');
  }, true);
  document.addEventListener('click', (e) => { const t = e.target.closest && e.target.closest('.btn, .icon-btn, .chip'); if (t && !t.dataset.nosfx) audio.sfx('click'); }, true);

  /* ------------------------------------------------------------------------
     BOOT
     ------------------------------------------------------------------------ */
  applySettings();
  const ready = cloud.init();
  const boot = () => bg.applyPage();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  on('auth', () => { scores._likes = null; bg.applyPage(); meta.edit(() => {}); });
  setTimeout(() => meta.visit(), 600);

  window.Arcade = {
    config, games, store, auth, scores, settings, audio, bg, icon, esc, on, emit, cloud, ready, meta, notify, embed: EMBED, today,
    ui: { toast, modal, openAuth, openResetPassword, openUpgrade, openProfile, openSettings, bindMusicButton, el, fmtTime },
    url: (p) => ROOT + p
  };
})();
