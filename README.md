# ixegames

An original, responsive browser arcade built on Node.js. Three games: **Tank Arena**, **Neon Snake**, and **Neon Rush**. Players do not need accounts. The design uses dark surfaces, lavender accents, custom SVG illustrations, and accessible keyboard focus states.

## Quick start

Requires Node.js 22 or newer. There are **no third-party runtime dependencies** and no build step.

```bash
cp .env.example .env
node scripts/password.mjs
# Copy the generated ADMIN_PASSWORD_HASH line into .env.
npm start
```

Visit `http://localhost:3000`. Open `/admin` to sign in with the password you chose. No default password is shipped. Keep `.env` private.

```bash
npm run dev    # Watch server and source changes
npm run check  # JavaScript syntax checks
npm test       # Rules, routing, admin security and persistence tests
```

## Included

- Tank Arena: enemy waves, brick and steel cover, firing cooldowns, armor, and local high scores.
- Neon Snake: three difficulty settings, food, growth, wall/body collision, and separate local high scores.
- Neon Rush: five racing stages with increasing speed and traffic, acceleration/braking, condition damage, finish-line bonuses, and a championship win.
- Original synthesized sound effects in every game, a racing engine sound, and a persistent Sound on/off control. Audio starts only after user interaction and stops on pause/tab changes.
- Arrow/WASD controls, visible touch controls, swipe steering for Snake, pause, restart, full screen, and automatic pause on tab changes.
- Server-rendered game pages, original guides, About, Contact, Privacy, Terms, Cookies, Accessibility, and real 404 responses.
- Canonical URLs, meta descriptions, Open Graph/social PNG, JSON-LD, sitemap, robots.txt, favicon, and dynamic ads.txt.
- Password-protected admin: site identity, operator/contact details, announcement, game visibility, Google publisher/slot IDs, and independent top/bottom custom banners.
- Persistent settings written atomically to `data/settings.json`; data and secrets excluded from Git.
- Scrypt password verification, HTTP-only sessions, CSRF and origin checks, rate limiting, input validation, output escaping, and security headers.

## Before publishing

Set `SITE_URL=https://ixegames.com` only when that domain is connected. Until then use your actual public origin. Configure HTTPS, `COOKIE_SECURE=true`, `NODE_ENV=production`, administrator credentials, persistent writable storage, and a reverse proxy. Complete your operator name and real contact email in Admin. Review the policy text against your actual hosting, business, jurisdiction, retention, and advertising practices.

Google advertising is **off by default**. The website provides integration support but cannot guarantee AdSense approval, search rankings, or legal compliance. Google reviews the live site and publisher account. See [ADSENSE.md](ADSENSE.md) before enabling ads.

## Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md): Node.js, reverse proxy, environment and backups.
- [ARCHITECTURE.md](ARCHITECTURE.md): routes, source map, game engine and extension points.
- [AGENTS.md](AGENTS.md): instructions for AI assistants and future maintainers.
- [ADSENSE.md](ADSENSE.md): integration, consent and launch checks.
- [QA.md](QA.md): completed checks, limitations and browser test checklist.

## Important limits

This version uses a single Node process and local JSON settings. Sessions and rate-limit counters live in memory, so restarts sign administrators out. Use shared storage/session infrastructure before running multiple application instances. No analytics service, public leaderboard, player database, remote score collection, arbitrary HTML injection, or email sending is included.

The repository is implementation-ready, but domain connection, production hosting, operator/contact details, a real AdSense account, and certified consent-provider configuration remain deployment tasks. Browser visual/touch QA must be completed as described in QA.md.
