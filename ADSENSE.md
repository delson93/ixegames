# Advertising and AdSense readiness

The code supports Google AdSense integration, but approval is not guaranteed. Google decides whether a live site and publisher account meet its requirements. A small game catalogue may need more useful original content and real use before approval. Do not fabricate traffic, reviews, game counts or endorsements.

## Implemented support

- Useful, crawlable homepage and separate game pages with original instructions and strategy tips.
- About, Contact, Privacy, Terms, Cookies and Accessibility pages linked in the footer.
- Responsive top/bottom ad placements labeled Advertisement.
- At least 150 CSS pixels of separation around advertising on game pages.
- No ads over the canvas or controls, on pause/game-over overlays, or on admin, policy and error pages.
- No automatic ad refresh, click incentives, or rewarded-ad claims.
- Validated publisher IDs, slot IDs and a dynamic `/ads.txt` response.
- Google ads disabled by default; script loading fails closed on missing CMP/consent state.
- Custom HTTPS image/link banners with sponsored link attributes and accessible text.

## Required operator actions

1. Deploy the site on your own working HTTPS domain and verify it in AdSense.
2. Publish a real operator identity and monitored contact email in Admin. Review every policy page against actual operations. The initial text is an implementation starting point, not a jurisdiction-specific legal opinion.
3. Create your AdSense account, obtain the `ca-pub-...` publisher ID and responsive display slot IDs.
4. Choose a Google-certified consent management platform, configure the live domain, disclosures, vendors, purposes, regions and revocation UI with that provider.
5. Set CMP_SCRIPT_URL to its supported HTTPS loader. If the provider requires a multi-part snippet, implement that provider's documented bootstrap in public/app.js and amend the script CSP allowlist in server.js. A script URL alone is not sufficient for every provider.
6. Verify the provider exposes `window.__tcfapi`, TCF v2 events and a working preference UI. Do not check the admin CMP confirmation until this works.
7. Add the publisher and slot IDs in Admin, confirm the CMP, then enable Google advertising. Custom banners take priority for their matching slots.
8. Confirm `/ads.txt` contains the exact authorized seller record and is publicly crawlable.
9. Test advertising consent, denial, withdrawal and mobile placement using your provider's test tools. Never click your own live ads.
10. Submit the live site for Google's review and address any feedback.

## Consent adapter details

The generic loader waits up to 15 seconds for a TCF API, then subscribes to `tcloaded` and `useractioncomplete`. It permits ad loading when the CMP reports `gdprApplies=false`, or when GDPR applies and purpose 1 plus Google vendor 755 consent are granted. The official Google tag still consumes the full TC string and makes its own eligibility decisions; these checks are a conservative loading gate, not a replacement for Google's consent handling.

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
