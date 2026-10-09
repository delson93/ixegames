# Architecture

## Stack and request flow

A lightweight Node HTTP server generates complete HTML for each page. CSS, SVG illustrations and native JavaScript modules are served from an explicit static allowlist. Browsers run Canvas 2D simulations locally; game scores are never posted to the server.

`request -> server.js route -> src/views.js HTML -> public/app.js / public/games.js`

## File map

| File | Responsibility |
| --- | --- |
| server.js | HTTP routes, admin sessions, origin/CSRF validation, security headers, static allowlist, SEO endpoints |
| src/settings.js | Defaults, type/URL/publisher validation, atomic JSON writes |
| src/content.js | Game catalogue, original instructions, informational and policy copy |
| src/views.js | Escaped HTML templates, public layout, admin form, advertising slots |
| public/engine.js | Pure Snake and Tank simulation functions; accepts injectable randomness |
| public/racing.js | Ten-stage car/bike racing simulation, progression and road/car rendering |
| public/prism.js | Falling-block puzzle simulation, bag randomization, rotation, row clearing and renderer |
| public/fighter.js | Eight-mission fighter simulation, combat, runway/carrier landings and side-view renderer |
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
| /games/tank, /games/snake, /games/racing, /games/bike, /games/aviation, /games/fighter, /games/prism | Canvas game plus server-rendered instructions; 404 when disabled |
| /about, /contact | Operator information and contact guidance |
| /privacy, /terms, /cookies, /accessibility | Policy and accessibility pages |
| /admin | Sign-in or protected dashboard; no-store and noindex |
| POST /admin/login | Rate-limited authentication |
| POST /admin/settings | Authenticated and CSRF-protected persistent settings |
| POST /admin/account | PostgreSQL-backed administrator credential rotation |
| POST /admin/logout | Revoke session and clear cookie |
| /api/ad-config | Public publisher/CMP configuration, no credentials |
| /sitemap.xml, /robots.txt, /ads.txt | Dynamic crawler and publisher endpoints |
| /healthz | Simple process health response |

## State

When DATABASE_URL or PGDATABASE is configured, settings and the admin username/password hash live in PostgreSQL. On first database initialization, the server imports DATA_DIR/settings.json and seeds the admin hash from ADMIN_PASSWORD_HASH only if the account is absent. Subsequent restarts never overwrite database values. Without PostgreSQL, settings remain in DATA_DIR/settings.json with atomic writes and the admin hash stays in the environment. A successful admin save replaces the in-process snapshot. Back up the database and private environment separately.

Session IDs are 256-bit random values stored in memory, with independent 256-bit CSRF tokens and an eight-hour expiry. Cookies are HTTP-only, SameSite=Strict and limited to /admin. Secure cookies are mandatory in production mode. Login attempts are limited by socket peer IP, not untrusted forwarded headers. Behind a single proxy the default limit is shared by requests through that proxy; add trusted edge limiting if more administrators are needed.

Snake state stores a direction, one buffered turn, body cells, food and score. It rejects reversal, permits moving into a vacated tail cell, and detects full-board wins. Tank state stores moving actors, bullets, obstacles, armor and wave. Bullets use small bounded frame steps and collision tests; brick absorbs one shell while steel persists.

Browser best scores use `ixe-best-<game>-<difficulty>` keys. Storage failures degrade gracefully. Tab hiding and window blur pause gameplay and clear held input.

## Advertising

Top/bottom custom sponsor banners take priority over the corresponding Google slot. Templates render slots only on the homepage and game pages. `public/app.js` subscribes to TCF events and permits ad requests only after a supported consent state. Google mode loads the AdSense tag with requests paused to bootstrap its published message. External mode loads the configured CMP first and inserts Google's tag after consent. Missing, failed, pending or denied consent leaves Google slots unfilled. Consent withdrawal after ad loading reloads the page to remove loaded ad resources. Policy pages disclose optional advertising and image-host requests.

A provider-specific consent UI adapter may be needed; see ADSENSE.md. The generic integration does not make UPgames a CMP.

## Design and accessibility

System fonts avoid font-network requests. SVG assets are local; PNG is supplied for social crawlers. Semantic navigation, skip link, high-visibility focus states, descriptive controls and text game status supplement canvas. Real-time canvas gameplay is not fully screen-reader accessible; this limitation is disclosed on the Accessibility page.

## Extension ideas

Potential future admin options include scheduling banner dates, managing multiple administrators with roles, managing game metadata through a database, first-party aggregate analytics with proper privacy handling, and draft/publish workflows. These are future features, not implemented controls.

## Racing and audio additions

Neon Rush uses a bounded 40ms simulation step, continuous lateral steering, acceleration/braking, three condition points, safe-overtake scoring and ten fixed stage configurations. Completing a stage freezes simulation until the player selects Next stage. Stage transitions preserve score and repair one condition point. Completing stage ten wins; Restart always begins a fresh run. Racing visibility defaults to enabled when loading older settings files.

Audio is synthesized locally with the Web Audio API. Construction never creates an AudioContext; explicit Play, Resume or Sound actions unlock it. No recording assets or external requests are needed. `ixe-audio-muted` persists the shared sound preference independently of high scores. Pause, blur, tab hiding and page exit stop active voices and the engine. The engine uses one oscillator, updated each frame rather than recreated. Unsupported audio or blocked storage leaves the games playable. Do not make gameplay instructions depend on sound.

Controls and best-score keys remain backward compatible for Tank Arena and Neon Snake. Touch racing supports holding a steering direction and acceleration/brake together.

## Expanded arcade and responsive rendering

Velocity Rider reuses the racing engine with `mode: bike`, a narrow motorcycle, and persistent throttle. Up/W increases throttle at 40 percentage points per second; Down/S reduces it at 60 per second. Releasing both holds speed. At zero speed the world and spawn countdown stop. Stage transitions reset bike throttle to zero. Car cruising speeds now range from 320 to 700 logical pixels/second and acceleration multiplies them by 1.35.

`public/aviation.js` contains the pure flight state, six mission configurations, collision rules and jet renderer. Sky Blitz scrolls at 340 to 565 logical pixels/second, with a 1.45 boost multiplier. Players collect mission-specific ring targets while avoiding storm cells. Missing a ring does not fail the mission. Damage grants brief invulnerability; completing a mission repairs one hull point on continuation.

The canvas retains a 720×540 simulation coordinate system but ResizeObserver resizes its drawing buffer to match the actual displayed size, with devicePixelRatio capped at two. A transform maps logical coordinates to the display buffer. CSS removes the old 720/820px display limits. Native full screen uses the available viewport with controls visible; unsupported requests fall back to a fixed full-viewport theater panel. Escape or the exit button closes the fallback. Aspect ratio is preserved to avoid distorting physics or sprites. Versioned stylesheet and game-module URLs prevent mixing old cached clients with this release.

## Fighter Command

See [FIGHTER.md](FIGHTER.md) for state transitions, units, landing limits, controls, scoring and extension points. Fighter visibility defaults to enabled for older saved settings; administrators can disable it independently. The existing catalogue, SEO, sitemap, advertising and local-score pathways also serve this game.

## Prism Stack

See [PRISM.md](PRISM.md) for the puzzle engine and input rules. `prismEnabled` defaults to true for older settings and controls catalogue visibility, routes and sitemap. Shared audio, pause, resizing and local best score behavior remain in the game controller.

## Isolated game loading

The shared controller dynamically imports only the selected game engine. Missing modules show a deployment/reload message. JavaScript assets are served with `text/javascript` and `no-cache`; unknown JS paths return a plain-text 404. Restart the Node process after pulling assets or routes, and update PM2 environment overrides when changing SITE_URL.

Google Privacy & messaging is an explicit `googleCmp` boolean option (default false). Its paused AdSense bootstrap replaces the separate loader only when selected. The TCF listener gates slot requests; see ADSENSE.md.
