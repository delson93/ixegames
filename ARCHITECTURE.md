# Architecture

## Stack and request flow

A dependency-free Node HTTP server generates complete HTML for each page. CSS, SVG illustrations and native JavaScript modules are served from an explicit static allowlist. Browsers run Canvas 2D simulations locally; game scores are never posted to the server.

`request -> server.js route -> src/views.js HTML -> public/app.js / public/games.js`

## File map

| File | Responsibility |
| --- | --- |
| server.js | HTTP routes, admin sessions, origin/CSRF validation, security headers, static allowlist, SEO endpoints |
| src/settings.js | Defaults, type/URL/publisher validation, atomic JSON writes |
| src/content.js | Game catalogue, original instructions, informational and policy copy |
| src/views.js | Escaped HTML templates, public layout, admin form, advertising slots |
| public/engine.js | Pure Snake and Tank simulation functions; accepts injectable randomness |
| public/racing.js | Five-stage racing simulation, progression and road/car rendering |
| public/audio.js | Gesture-unlocked Web Audio effects, engine tone, mute persistence and cleanup |
| public/games.js | Animation loop, canvas rendering, keyboard/touch controls, pause state and local bests |
| public/app.js | Catalogue filters, saved-score clearing, consent-provider loading and ad gating |
| public/style.css | Responsive design, focus styles, reduced-motion handling and ad spacing |
| public/*.svg | Original vector assets, editable without a build tool |
| public/social.png | Social sharing image generated from social.svg; regenerate when changing the source |
| scripts/password.mjs | Generates a random-salt scrypt password hash locally |
| test/*.test.js | Node test-runner checks for simulations, settings, server and security |

## Routes

| Route | Purpose |
| --- | --- |
| / | Searchable/filterable game collection and FAQ |
| /games/tank, /games/snake, /games/racing | Canvas game plus server-rendered instructions; 404 when disabled |
| /about, /contact | Operator information and contact guidance |
| /privacy, /terms, /cookies, /accessibility | Policy and accessibility pages |
| /admin | Sign-in or protected dashboard; no-store and noindex |
| POST /admin/login | Rate-limited authentication |
| POST /admin/settings | Authenticated and CSRF-protected persistent settings |
| POST /admin/logout | Revoke session and clear cookie |
| /api/ad-config | Public publisher/CMP configuration, no credentials |
| /sitemap.xml, /robots.txt, /ads.txt | Dynamic crawler and publisher endpoints |
| /healthz | Simple process health response |

## State

Settings live in DATA_DIR/settings.json. Writes use a temporary file and rename so readers do not observe partial JSON. A successful admin save replaces the in-process snapshot; restart after editing JSON manually. Back up DATA_DIR separately from the repository.

Session IDs are 256-bit random values stored in memory, with independent 256-bit CSRF tokens and an eight-hour expiry. Cookies are HTTP-only, SameSite=Strict and limited to /admin. Secure cookies are mandatory in production mode. Login attempts are limited by socket peer IP, not untrusted forwarded headers. Behind a single proxy the default limit is shared by requests through that proxy; add trusted edge limiting if more administrators are needed.

Snake state stores a direction, one buffered turn, body cells, food and score. It rejects reversal, permits moving into a vacated tail cell, and detects full-board wins. Tank state stores moving actors, bullets, obstacles, armor and wave. Bullets use small bounded frame steps and collision tests; brick absorbs one shell while steel persists.

Browser best scores use `ixe-best-<game>-<difficulty>` keys. Storage failures degrade gracefully. Tab hiding and window blur pause gameplay and clear held input.

## Advertising

Top/bottom custom sponsor banners take priority over the corresponding Google slot. Templates render slots only on the homepage and game pages. `public/app.js` loads a configured certified CMP first, subscribes to TCF events, and inserts Google's script only after a supported consent state. Missing, failed, pending or denied consent leaves Google slots unfilled. Consent withdrawal after ad loading reloads the page to remove loaded ad resources. Policy pages disclose optional advertising and image-host requests.

A provider-specific consent UI adapter may be needed; see ADSENSE.md. The generic integration does not make ixegames a CMP.

## Design and accessibility

System fonts avoid font-network requests. SVG assets are local; PNG is supplied for social crawlers. Semantic navigation, skip link, high-visibility focus states, descriptive controls and text game status supplement canvas. Real-time canvas gameplay is not fully screen-reader accessible; this limitation is disclosed on the Accessibility page.

## Extension ideas

Potential future admin options include scheduling banner dates, managing multiple administrators with roles, managing game metadata through a database, first-party aggregate analytics with proper privacy handling, and draft/publish workflows. These are future features, not implemented controls.

## Racing and audio additions

Neon Rush uses a bounded 40ms simulation step, continuous lateral steering, acceleration/braking, three condition points, safe-overtake scoring and five fixed stage configurations. Completing a stage freezes simulation until the player selects Next stage. Stage transitions preserve score and repair one condition point. Completing stage five wins; Restart always begins a fresh run. Racing visibility defaults to enabled when loading older settings files.

Audio is synthesized locally with the Web Audio API. Construction never creates an AudioContext; explicit Play, Resume or Sound actions unlock it. No recording assets or external requests are needed. `ixe-audio-muted` persists the shared sound preference independently of high scores. Pause, blur, tab hiding and page exit stop active voices and the engine. The engine uses one oscillator, updated each frame rather than recreated. Unsupported audio or blocked storage leaves the games playable. Do not make gameplay instructions depend on sound.

Controls and best-score keys remain backward compatible for Tank Arena and Neon Snake. Touch racing supports holding a steering direction and acceleration/brake together.
