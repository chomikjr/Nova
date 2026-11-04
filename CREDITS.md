# Third-party games

Nova OS hosts these open-source games. Each folder in `games/ports/` keeps the game's original license file; the source for every game (including GPL/MPL ones) is in this repository and upstream.

Changes made here: analytics/ads removed (Hextris, HexGL, A Dark Room, Hearts, Particle Clicker, Tower Builder, The House, Tap Tap Tap, Dead Valley, Untrusted, Cube Composer), CDN libraries bundled locally, a Content-Security-Policy added to Antimatter Dimensions to block its analytics, Delta's borrowed music removed, Untrusted's soundtrack removed for size, Astray texture paths made relative, donate/fork ribbons removed. Games imported from chomik-and-more-chomik-v2 had that site's injected `/js/main.js` and Google trackers removed, and their upstream license files restored. Candy Box 2 was compiled from its GPL source with TypeScript 1.8 (unminified). Q1K3's map/model data were packed with its own pack_map.c / pack_model.php; the unminified source build is served.

| Game | Author | License | Upstream |
|---|---|---|---|
| 2048 | Gabriele Cirulli | MIT | [github.com/gabrielecirulli/2048](https://github.com/gabrielecirulli/2048) |
| Antimatter Dimensions | IvarK & team | MIT | [github.com/IvarK/AntimatterDimensionsSourceCode](https://github.com/IvarK/AntimatterDimensionsSourceCode) |
| Pac-Man | Dale Harvey | WTFPL | [github.com/daleharvey/pacman](https://github.com/daleharvey/pacman) |
| Hextris | Hextris team | GPL-3.0 | [github.com/Hextris/hextris](https://github.com/Hextris/hextris) |
| T-Rex Runner | Chromium authors (via wayou) | BSD-3-Clause | [github.com/wayou/t-rex-runner](https://github.com/wayou/t-rex-runner) |
| Tetris Classic | Jake Gordon | MIT | [github.com/jakesgordon/javascript-tetris](https://github.com/jakesgordon/javascript-tetris) |
| Clumsy Bird | Ellison Leão | GPL-3.0 | [github.com/ellisonleao/clumsy-bird](https://github.com/ellisonleao/clumsy-bird) |
| HexGL | Thibaut Despoulain | MIT | [github.com/BKcore/HexGL](https://github.com/BKcore/HexGL) |
| Tower Builder | BMQB | MIT | [github.com/iamkun/tower_game](https://github.com/iamkun/tower_game) |
| Untrusted | Alex Nisnevich & Greg Shuflin | CC BY-NC-SA 3.0 | [github.com/AlexNisnevich/untrusted](https://github.com/AlexNisnevich/untrusted) |
| Candy Box 2 | aniwey | GPL-3.0 | [github.com/candybox2/candybox2.github.io](https://github.com/candybox2/candybox2.github.io) |
| A Dark Room | Doublespeak Games | MPL-2.0 | [github.com/doublespeakgames/adarkroom](https://github.com/doublespeakgames/adarkroom) |
| Trimps | Trimps team | GPL-2.0 | [github.com/Trimps/Trimps.github.io](https://github.com/Trimps/Trimps.github.io) |
| Pong | Jake Gordon | MIT | [github.com/jakesgordon/javascript-pong](https://github.com/jakesgordon/javascript-pong) |
| Breakout | Jake Gordon | MIT | [github.com/jakesgordon/javascript-breakout](https://github.com/jakesgordon/javascript-breakout) |
| Classic 8-Ball | Chen Shmilovich | MIT | [github.com/henshmi/Classic-Pool-Game](https://github.com/henshmi/Classic-Pool-Game) |
| Solitaire | Justin Hatzimalis | MIT | [github.com/jhatzimalis/solitaire](https://github.com/jhatzimalis/solitaire) |
| Minesweeper | Peter Dematté | MIT | [github.com/pitpik/minesweeper](https://github.com/pitpik/minesweeper) |
| Mini Sudoku | Valentyn Kolesnikov | MIT | [github.com/minisudoku/minisudoku.github.io](https://github.com/minisudoku/minisudoku.github.io) |
| Chess | Attogram Project | MIT | [github.com/attogram/chess](https://github.com/attogram/chess) |
| Asteroids | Doug McInnes | MIT | [github.com/dmcinnes/HTML5-Asteroids](https://github.com/dmcinnes/HTML5-Asteroids) |
| Particle Clicker | CERN Webfest team | MIT | [github.com/particle-clicker/particle-clicker](https://github.com/particle-clicker/particle-clicker) |
| Radius Raid | Jack Rugile | MIT | [github.com/jackrugile/radius-raid-js13k](https://github.com/jackrugile/radius-raid-js13k) |
| Wordle+ | MikhaD | GPL-3.0 | [github.com/MikhaD/wordle](https://github.com/MikhaD/wordle) |
| n-gon | landgreen | GPL-3.0 | [github.com/landgreen/n-gon](https://github.com/landgreen/n-gon) |
| Fluid Simulator | Pavel Dobryakov | MIT | [github.com/PavelDoGreat/WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) |
| Flappy 2048 | hczhcz | MIT | [github.com/hczhcz/Flappy-2048](https://github.com/hczhcz/Flappy-2048) |
| Space Company | sparticle999 | MIT | [github.com/sparticle999/SpaceCompany](https://github.com/sparticle999/SpaceCompany) |
| Q1K3 | Dominic Szablewski | MIT | [github.com/phoboslab/q1k3](https://github.com/phoboslab/q1k3) |
| Space Huggers | Frank Force | GPL-3.0 | [github.com/KilledByAPixel/SpaceHuggers](https://github.com/KilledByAPixel/SpaceHuggers) |
| Astray | Rye Terrell | Unlicense | [github.com/wwwtyro/Astray](https://github.com/wwwtyro/Astray) |
| Underrun | Dominic Szablewski | MIT | [github.com/phoboslab/underrun](https://github.com/phoboslab/underrun) |
| Hearts | Yujian Yao | BSD-2-Clause | [github.com/yyjhao/html5-hearts](https://github.com/yyjhao/html5-hearts) |
| Tiny Platformer | Jake Gordon | MIT | [github.com/jakesgordon/javascript-tiny-platformer](https://github.com/jakesgordon/javascript-tiny-platformer) |
| Delta | Jake Gordon | MIT (music removed) | [github.com/jakesgordon/javascript-delta](https://github.com/jakesgordon/javascript-delta) |
| Dead Valley | Doug McInnes | CC BY-NC 4.0 | [github.com/dmcinnes/dead-valley](https://github.com/dmcinnes/dead-valley) |
| Paint Run | Ashley Boucher | MIT | [github.com/ahl389/paint-run2](https://github.com/ahl389/paint-run2) |
| Hyperspace Garbage Collection | razh | MIT | [github.com/razh/game-off-2013](https://github.com/razh/game-off-2013) |
| The Pond | Zolmeister | GPL-3.0 | [github.com/attogram/pond-lite](https://github.com/attogram/pond-lite) |
| Tap Tap Tap | Mahdi Al-Farra | MIT | [github.com/MahdiF/taptaptap](https://github.com/MahdiF/taptaptap) |
| The House | Artur Kot | MIT | [github.com/arturkot/the-house-game](https://github.com/arturkot/the-house-game) |
| Twisty Polyhedra | Aditya Ravi Mishra | GPL-3.0 | [github.com/aditya-r-m/twisty-polyhedra](https://github.com/aditya-r-m/twisty-polyhedra) |
| Black Hole Square | Quinten Clause | MIT | [github.com/Quinten/black-hole-square](https://github.com/Quinten/black-hole-square) |
| NS-Shaft | iPel | Apache-2.0 | [github.com/iPel/NS-SHAFT](https://github.com/iPel/NS-SHAFT) |
| Dante | Salvatore Previti | MIT | [github.com/SalvatorePreviti/js13k-2022](https://github.com/SalvatorePreviti/js13k-2022) |
| xx142-b2.exe | Ben Clark & Salvatore Previti | MIT | [github.com/bencoder/js13k-2019](https://github.com/bencoder/js13k-2019) |
| Edge Not Found | Tom Hermans | MIT | [github.com/Auroriax/js13k-2020](https://github.com/Auroriax/js13k-2020) |
| Match Puzzle | Frank Force (LittleJS) | MIT | [github.com/KilledByAPixel/LittleJS](https://github.com/KilledByAPixel/LittleJS) |
| Pixel Blaster | Frank Force (LittleJS) | MIT | [github.com/KilledByAPixel/LittleJS](https://github.com/KilledByAPixel/LittleJS) |
