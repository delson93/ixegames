# Prism Stack: maintainer and AI guide

An original falling-block puzzle at `/games/prism`, implemented without runtime dependencies. The 12 × 18 board, crystal palette and eight-shape bag include seven four-cell shapes plus a three-cell corner. Code, artwork and synthesized sounds are local to ixegames.

## Files and integration

`public/prism.js` exports the pure engine and canvas renderer. `public/games.js` handles input, optional audio, pause, responsive rendering, fullscreen, restart and local best scores (`ixe-best-prism-arcade`). Metadata and guides live in `src/content.js`. The `prismEnabled` setting and admin checkbox govern catalogue, route and sitemap visibility. `server.js` explicitly serves `prism.js` and `prism.svg`. Puzzle is a homepage filter.

## Rules

Each shuffled bag contains each of eight shapes once. Fisher-Yates accepts injected randomness. Three upcoming pieces are visible. Pieces spawn centered at row zero; an obstructed spawn ends the run. All board rows and shape matrices are independently allocated.

Left/right moves one column immediately, then repeats after 180ms at 70ms intervals. Up rotates clockwise once per press, trying horizontal offsets 0, -1, +1, -2, +2. Obstructed rotations leave the piece unchanged. Down soft-drops; Space or DROP hard-drops to the ghost position and locks immediately. Rotate and hard-drop require release before repeating, including across a piece spawn. Pause/blur clears held inputs.

Gravity begins at 850ms per row and multiplies by 0.84 each level, capped at a 90ms minimum. Soft drop targets 35ms. Simulation dt is capped at 40ms. Grounded pieces get a 380ms settling delay; lateral moves/rotations can reset it at most 12 times per piece. Descending resets the ground timer. Locked rows clear simultaneously and surviving rows retain their order. There is no campaign win; play continues until the stack blocks a spawn.

One through four cleared rows score 120, 360, 720 or 1,200 times the current level. Consecutive pieces that clear rows add `(combo - 1) * 60`; placing without clearing resets the combo. Soft and hard drops award one and two points per cell respectively. Every eight total rows increases the level. The level used for clear scoring is the one before the clear.

## Verification

Run `npm run check` and `npm test`. `test/prism.test.js` covers simulation rules and visibility; server and controller tests exercise integration. Actual browser layout, audible sound and multi-touch QA remain required as described in QA.md. Never place ads within the canvas, HUD, overlays or controls.
