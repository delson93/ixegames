# Quality assurance

## Completed automated checks

`npm run check` validates JavaScript syntax. `npm test` runs 25 tests covering:

- Snake reversal and turn buffering, growth, food placement, wall/body collision, vacated tail movement and full-board win.
- Tank movement barriers, firing cooldowns, enemy score, wave progression, brick/steel collision, armor damage and invulnerability.
- Racing stage progression, win/restart, movement bounds, speed changes, collisions, invulnerability, safe overtakes and older-settings compatibility.
- Audio gesture gating, mute persistence, engine/voice cleanup, and graceful fallback with mocked Web Audio and storage APIs.
- Invalid banner URLs and publisher settings.
- Public server-rendered pages, canonical/description tags and default absence of Google scripts.
- Real 404 responses and disabled-game sitemap removal.
- Password authentication, origin validation, CSRF, secure session attributes, logout and rate limits.
- Escaping admin content and writing settings to disk.

## Browser verification still required

This execution environment had no installed browser. The Playwright Chromium download returned an invalid archive, so no screenshot, real keyboard/touch browser test, Lighthouse result or live consent-provider verification is claimed.

Before public launch, run these checks in current Chrome, Firefox and Safari, plus Android Chrome and iOS Safari:

1. Inspect homepage at 390px, 768px and 1440px widths. Verify no horizontal overflow, cropped text or overlapping controls.
2. Search games and switch categories; verify the empty-state message.
3. Start all three games; use WASD/arrows, touchscreen controls and Snake swipes.
4. Confirm game input does not scroll the page while playing and ordinary page controls still work.
5. Pause/resume, switch tabs, return, restart, change Snake pace and use full screen.
6. Play to a game over; verify score, best-score storage, difficulty separation and behavior with blocked local storage.
7. Sign in, save settings, restart the server, verify persistence and sign out. Try a forged CSRF token and a disabled game URL.
8. Add custom top/bottom banners and check mobile spacing from game controls.
9. Test a real certified CMP with unknown, accepted, denied and withdrawn consent. Verify no Google ad request before a permitted state and a working footer preference UI.
10. Audit keyboard tab order, focus visibility, reduced motion, readable contrast and game status text. Canvas gameplay has documented nonvisual accessibility limits.
11. Run Lighthouse against production HTTPS. Record actual metrics rather than assuming perfect performance/SEO scores.
12. Confirm the contact mailbox works and policy descriptions accurately match deployed services.

## Known boundaries

- Games are single-player and scores are local to each browser.
- Touch/full-screen behavior varies by device and needs real-device testing.
- No online multiplayer, global leaderboard or admin multi-user roles in this release.
- Audio behavior is covered by mocked API tests; audible quality, mobile autoplay behavior and real-device playback remain unverified.
- Single-process local settings and memory-backed sessions; scale only after replacing these components.
- No live AdSense account or CMP was supplied, so live advertising and consent integration are not verified.

## Racing and sound browser checks

- Finish all five Neon Rush stages; verify stage names, higher traffic/speed, completion bonuses, one-point condition repair and final championship state.
- Verify Next stage retains score while Restart clears the run. Pause/resume must not restart a stage or duplicate the engine sound.
- On touch screens, hold acceleration/brake and left/right together. Confirm canceled pointers release their inputs.
- Verify no sound before Play; test tank firing, explosions and damage; snake eating; racing engine, passing and collisions; start, game-over and victory cues.
- Mute, navigate to another game and verify the setting persists. Pause, hide the tab or leave the page and verify silence. Test audio-disabled browsers and blocked storage.
- Deploy the updated JavaScript and SVG assets together. Asset caching is one hour; purge the deployment cache or hard-refresh when verifying an upgrade.
