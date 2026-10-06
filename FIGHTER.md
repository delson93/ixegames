# Fighter Command: AI and maintainer guide

An original, dependency-free Canvas 2D side-view arcade flight simulator at `/games/fighter`. This is simplified entertainment flight physics, not an aviation training tool. No player account or external assets are required.

## Source map

- `public/fighter.js`: mission configurations, pure simulation functions and original canvas artwork.
- `public/games.js`: shared keyboard/pointer handling, responsive canvas, pause, audio events, stage overlays and local best scores.
- `src/content.js`: searchable catalogue entry and crawlable instructions.
- `src/settings.js` and `src/views.js`: `fighterEnabled` default, admin checkbox, public page and touch controls.
- `server.js`: static asset allowlist; existing dynamic routes and sitemap select enabled games.
- `public/fighter.svg`: original vector preview.
- `test/fighter.test.js`: regression tests. Run `npm run check` and `npm test`.

## Controls and coordinates

Right/D adds 65 speed units per second. Left/A removes 90. Speed holds on release and is clamped to zero through `380 + level * 15`. Up/W climbs at 65 altitude units per second. Down/S descends at 32 below or equal to 170 speed, and 80 at higher speeds. Below 100 airspeed, airborne aircraft lose an additional 85 altitude units per second to stall. Space or touch FIRE shoots during combat only. Touch directions support simultaneous inputs.

The simulation uses 720 × 540 logical coordinates, independent of canvas pixel density. The player stays near x=182; distance advances the scenery. Altitude is clamped from zero to 340. Screen y decreases with altitude. HUD speed and distance are arcade units; displayed metres are illustrative. The engine clamps each frame to 40ms and accepts injectable randomness for testing.

## Mission lifecycle

1. **takeoff**: start stationary on an 1,800-unit runway. Hold Right then Up at speed 130 or above. Reaching altitude 70 enters combat. Falling back onto the runway after liftoff or overrunning it at low altitude fails.
2. **combat**: enemies enter from the right at randomized heights and shoot aimed projectiles. Player cannon cooldown is 0.19 seconds. Enemies require two hits in missions 1–4 and three thereafter. Collisions cause damage but do not count as kills. Escaped enemies are replaced by future spawns.
3. **landing**: reaching the mission kill target clears enemies and projectiles. The destination begins 2,100 units ahead. Airfields are 950 units long; carrier decks are 560. Landings alternate across eight missions. Gear deploys automatically. The remaining distance appears on screen.
4. **rollout**: touching altitude zero on the landing surface is accepted only at speed 100–170, descent no faster than 45, and at least 150 units before the surface ends. Automatic braking removes 110 speed units per second. Only stopping successfully completes a mission. Missing, overrunning, stalling or touching down outside the permitted envelope fails.
5. **stageComplete / won**: simulation freezes. Next stage retains score, restores one hull point up to five, and resets to runway takeoff. The eighth landing wins. Restart begins a fresh campaign.

A safe carrier approach from maximum altitude is tested using only throttle/brake and descent inputs. When tuning speeds, distances or braking, preserve enough time and runway for a player to succeed. Do not equate reaching the kill target with mission completion.

## Scoring, damage and sound

Each cannon kill earns 200 points. A completed landing earns 1,000 plus 100 per remaining hull point. Five hull points protect the jet; damage grants 1.4 seconds of invulnerability. A stall or invalid touchdown is fatal regardless of hull. Failure reasons are shown in the restart overlay. Best scores use `ixe-best-fighter-arcade` and remain local to the browser.

Shared synthesized audio supplies engine, firing, damage, enemy destruction, phase-change and victory cues. Audio remains gesture-unlocked, optional and quiet on pause, blur or page exit. Do not add autoplay or external sound dependencies.

## Extending the game

Add mission definitions to `fighterLevels`, update the eight-mission public copy and scorebar, and add regression coverage. Tune enemy target, spawn interval, palette and carrier flag there. Keep physics and rendering separated from DOM orchestration. Never add advertisement placements inside the canvas, HUD, overlays or controls.

Actual mobile touch, audible quality and visual browser testing remain deployment QA items. Automated tests validate rules and the shared DOM lifecycle, not full real-device playability.
