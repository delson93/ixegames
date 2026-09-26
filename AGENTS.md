# Instructions for AI assistants

Read README.md, ARCHITECTURE.md, ADSENSE.md, and QA.md before making changes.

## Product rules

- Brand: ixegames. Intended future domain: ixegames.com. SITE_URL controls the actual deployment origin.
- Free public games; never add player login requirements without an explicit request.
- Only publish games that are actually playable. Tank Arena, Neon Snake, Neon Rush, Velocity Rider, and Sky Blitz are the current collection.
- Retain the modern dark/lavender design and responsive keyboard/touch controls.
- Preserve original code and artwork. Do not import copyrighted franchise graphics, sounds, levels, or branding.
- Never promise AdSense approval or guaranteed search rankings.

## Implementation rules

- Node.js 22+, ESM, no runtime dependencies. Prefer small focused modules and server-rendered content.
- Keep pure simulation logic in public/engine.js, public/racing.js and public/aviation.js; shared browser orchestration lives in public/games.js, and synthesized audio lives in public/audio.js.
- Escape all administrator-controlled content with esc() before HTML output.
- Never expose ADMIN_PASSWORD_HASH, cookies, CSRF tokens, or .env in client configuration or commits.
- All admin writes require authentication, same-origin validation, and CSRF validation.
- Keep Google ads fail-closed on missing or denied consent. Do not treat a custom cookie banner as a certified CMP.
- Do not place ads in game overlays, scorebars, touch controls, policy pages, admin pages, or error pages.
- Retain at least 150 CSS pixels between gameplay content and advertisements.
- Custom advertising accepts HTTPS image/link/alt fields, not arbitrary executable snippets.
- Do not silently change operational policy claims. Ask the operator for business facts when required.
- Settings data is private deployment state, never seed it with invented contact details or credentials.

## Verification

Run `npm run check` and `npm test`. Add meaningful regression tests when changing collisions, game state transitions, authentication, input validation, ad gating, or persistence. Perform browser checks from QA.md for layout/control changes. Report tests not run honestly.

## Adding a game

1. Add original metadata and helpful guides in src/content.js.
2. Add a boolean visibility setting to src/settings.js and adminPage in src/views.js.
3. Add its engine, input handling, rendering and accessible state updates.
4. Add a custom SVG preview and explicitly allowlist new assets in server.js.
5. Add keyboard/touch controls, pause on blur, restart, local best namespace and tests.
6. Verify the game is linked, indexed and included in the sitemap only while enabled.

## Operational constraints

The current storage layer assumes one Node.js process and one persistent data directory. Server restart invalidates admin sessions. Multi-instance deployments require shared state and locks. Do not weaken these boundaries to make a deployment appear successful.

- Audio must remain optional, start only after a user gesture, respect the persisted mute preference and stop on pause or page exit. Never add unlicensed recordings.

- Preserve user-controlled bike throttle: Up accelerates, Down brakes, releasing both holds speed. Keep simulation coordinates independent from responsive canvas resolution.
