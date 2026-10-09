# Advertising and AdSense readiness

The code supports Google AdSense integration, but approval is not guaranteed. Google decides whether a live site and publisher account meet its requirements. A small game catalogue may need more useful original content and real use before approval. Do not fabricate traffic, reviews, game counts or endorsements.

## Implemented support

- Useful, crawlable homepage and separate game pages with original instructions and strategy tips.
- About, Contact, Privacy, Terms, Cookies and Accessibility pages linked in the footer.
- Responsive top/bottom ad placements labeled Advertisement.
- Empty Google placements collapse when consent or ad fill is unavailable; filled ads retain the game spacing.
- At least 150 CSS pixels of separation around advertising on game pages.
- No ads over the canvas or controls, on pause/game-over overlays, or on admin, policy and error pages.
- No automatic ad refresh, click incentives, or rewarded-ad claims.
- Validated publisher IDs, slot IDs and a dynamic `/ads.txt` response.
- Google ads disabled by default; ad requests remain paused on missing or denied consent. With Google Privacy & messaging selected, its AdSense tag loads to bootstrap the message while requests are paused.
- Custom HTTPS image/link banners with sponsored link attributes and accessible text.

## Required operator actions

For a quick live check, request `/api/ad-config`. `enabled:false` means the site's own AdSense switch is off, so no Google ad requests will be made. The response also reports whether each manual slot is configured and whether CMP readiness was confirmed. Set the publisher, top and bottom display slot IDs, a published Google Privacy & messaging message (or a supported external CMP), confirm the CMP, then enable ads in `/admin` and save. The AdSense Sites and Policy center still determine whether Google will serve ads; an approved parent domain does not make an empty slot fill on demand. The browser console's blocked `data:` fonts from extensions are unrelated to AdSense requests.

1. Deploy the site on your own working HTTPS domain and verify it in AdSense.
2. Publish a real operator identity and monitored contact email in Admin. Review every policy page against actual operations. The initial text is an implementation starting point, not a jurisdiction-specific legal opinion.
3. Create your AdSense account, obtain the `ca-pub-...` publisher ID and responsive display slot IDs.
4. Choose a Google-certified consent management platform, configure the live domain, disclosures, vendors, purposes, regions and revocation UI with that provider.
5. For Google Privacy & messaging, publish the message and select Google mode in Admin; no separate CMP_SCRIPT_URL is needed. For an external CMP, set CMP_SCRIPT_URL to its supported HTTPS loader. If the provider requires a multi-part snippet, implement that provider's documented bootstrap in public/app.js and amend the script CSP allowlist in server.js. A script URL alone is not sufficient for every provider.
6. Verify the provider exposes `window.__tcfapi`, TCF v2 events and a working preference UI. Do not check the admin CMP confirmation until this works.
7. Add the publisher and slot IDs in Admin, confirm the CMP, then enable Google advertising. Custom banners take priority for their matching slots.
8. Confirm `/ads.txt` contains the exact authorized seller record and is publicly crawlable.
9. Test advertising consent, denial, withdrawal and mobile placement using your provider's test tools. Never click your own live ads.
10. Submit the live site for Google's review and address any feedback.

## Consent adapter details

The generic loader waits up to 15 seconds for a TCF API, then subscribes to `tcloaded` and `useractioncomplete`. It permits ad requests when the CMP reports `gdprApplies=false`, or when GDPR applies and purpose 1 plus Google vendor 755 consent are granted. The official Google tag still consumes the full TC string and makes its own eligibility decisions; these checks are a conservative request gate, not a replacement for Google's consent handling.

Denied, unknown, missing or failed consent keeps Google advertising off and games playable. Other regional requirements, including applicable US state opt-outs, need configuration and verification in your CMP. Do not infer worldwide legal compliance from a TCF response.

The footer supports Google's `googlefc.showRevocationMessage()` when available, then attempts a provider-specific TCF `displayConsentUi` extension. That extension is not part of the standard TCF API. If your CMP has a different API, replace the documented adapter in public/app.js with its supported method and test it. The UI displays a fallback message if the provider cannot open preferences.

## Custom banners

Enter an HTTPS image URL, destination and meaningful alt text. Use assets you own or are authorized to display, preferably hosted on your own controlled HTTPS asset host. External image requests disclose connection information to that host. This system deliberately does not accept arbitrary executable ad HTML. Clear the image URL to remove a banner.

## Official references reviewed

- [AdSense program policies](https://support.google.com/adsense/answer/48182?hl=en)
- [AdSense content ads on game pages](https://support.google.com/adsense/answer/2768340?hl=en)
- [Google consent management requirements](https://support.google.com/adsense/answer/13554116?hl=en)
- [Publisher integration with IAB Europe TCF](https://support.google.com/adsense/answer/9804260?hl=en)

These requirements can change. Recheck official guidance before launch and when changing providers or advertising formats.

## Google Privacy & messaging integration

Select **Use Google Privacy & messaging (no separate CMP URL)** in Admin when using a published Google message. Confirm that the message covers the deployed site, retain the publisher and slot IDs, check the published-message confirmation, enable ads, and save. No CMP_SCRIPT_URL is required for this mode. Existing configurations retain external-CMP mode until explicitly changed.

The AdSense tag is loaded on advertising pages with `adsbygoogle.pauseAdRequests=1` set first. This breaks the former dependency cycle where the consent message required the very tag blocked pending consent. A TCF listener unpauses and initializes each manual slot once only after GDPR is reported not applicable, or purpose 1 and Google vendor 755 consent are present in a completed event. Unknown/error/denied states remain paused. Consent withdrawal pauses requests and reloads after initialization. Google still evaluates the full consent string and ad eligibility. Do not enable Auto ads for these game pages, since automatic placements could interfere with gameplay spacing.

Other CMPs still require their supported HTTPS loader via CMP_SCRIPT_URL and remain responsible for provider-specific initialization. Google mode does not load an AdSense tag on policy/admin/error pages. The footer revocation control works where the provider API is available; otherwise open an advertising page to manage preferences.

Sources: https://developers.google.com/funding-choices/fc-api-docs and https://support.google.com/adsense/answer/7670312?hl=en . Test the actual published message on games.upilinks.in, including denial, withdrawal and relevant regional settings. Account/site approval and ad fill are separate from this integration.
