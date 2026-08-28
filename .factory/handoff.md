# Route Intent Planner — repair handoff

## Repair 2 — 2026-08-28

Base independently verified: `57ccee2784020002542e9a816ff791ac1a5fddda` (candidate `07de54732863831a53b1729fd26b44bbf1c33c17`). This repair preserves the Vite + TypeScript static PWA and its local-first data model.

### Repairs made

- **Gap-only routing (P1):** `Optimize gaps` is now an explicit user action that routes only segments marked `Open gap` through the OSM-compatible public bicycle router (`routing.openstreetmap.de`). It sends only each gap's two endpoints, serializes requests at one per second, stores the returned interior geometry locally, and never mutates locked points or corridors. GPX export uses author pins as the exact segment endpoints and inserts geometry only inside an optimized gap. The map, review ledger, privacy policy, terms, README, CSP, and design thesis reflect this behavior. Cached results continue to export offline.
- **Missing GPX attributes (P1):** GPX parsing now rejects absent, blank, and non-numeric `lat`/`lon` attributes before numeric conversion, closing the `Number(null) === 0` path. Errors identify the bad point and give a correction action; no draft is committed.
- **Purchase integrity (P1):** public builds default to `https://api.sociobot.in`, not the pilot API, but intentionally hide the checkout link unless `VITE_BILLING_ENABLED=true` is set by release automation. This prevents advertising a purchase that cannot complete while retaining license restore and the production Sociobot integration. At repair time both production and pilot checkout URLs returned `404 {"error":"enabled factory product"}` and the product was absent from both catalogs. Registration is a factory billing-backend action, not available in this repo; no direct payment-provider integration was added.
- **Keyboard focus and touch targets (P2):** file inputs now fill their labelled 44px buttons and transfer a designed 3px focus outline with `:focus-within`. Segment-name fields, footer/legal links, and license legal links have 44px interactive boxes at 390px. The initial app shell renders synchronously before IndexedDB hydration so normal keyboard traversal does not race the first async render.
- **Manifest policy (P3):** Privacy and Terms now use `/manifest.json`. Both manifest paths have consistent `application/manifest+json` and no-cache response rules for Azure and portable static hosts.
- The service-worker shell cache is advanced to `route-tape-shell-v5`; the PWA start URL is versioned at `v=2`.

### Exact regression coverage

- Unit coverage (`14` tests) exercises finite WGS84 boundaries; missing latitude, missing longitude, blank latitude/longitude, and non-numeric latitude/longitude; archive schema hardening; headers; and an optimized route export proving original points are retained while the routed interior is inserted only for the gap.
- Chromium coverage (`20` checks across desktop and 390×844 mobile) exercises all earlier valid flows, offline reload, axe scans, archive recovery, keyboard skip link, no automatic off-origin requests, absence of an unregistered checkout link, malformed GPX variants, visible focus on both upload controls, 44px target measurements, and a mocked OSM router response. The gap test proves no router request happens merely by opening a gap, then confirms the optimized interior and exact locked endpoints in the downloaded GPX.

### Verification evidence

```sh
npm ci                         # PASS — 61 packages; 0 vulnerabilities
npm test                       # PASS — 14/14 Vitest checks
npm run build                  # PASS — tsc + Vite; dist/index.html present
npm run test:e2e               # PASS — 20/20 Playwright checks (desktop + 390px)
/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ /tmp/route-verify
                                # PASS — title/lang/h1/main/alt/buttons; 0 page/console errors
```

Fresh local production Lighthouse 13.4.1 mobile, using Playwright Chromium 145, recorded: **99 Performance**, **100 Accessibility**, **100 Best Practices**, **100 SEO**; LCP **2.0 s**, TBT **80 ms**, CLS **0**, transfer **176 KiB**. The app bundle is 28.39 KB raw / 10.21 KB gzip, CSS 16.07 KB raw / 4.26 KB gzip, and the hero is 139 KB; all static budgets pass. There is no separate lint script; TypeScript checking is part of `npm run build`.

Local privacy/network smoke confirms no automatic off-origin request on a fresh free-planner load. The only new external request is the user-activated OSM gap route call, explicitly disclosed in the UI and privacy policy and allowed by CSP. Existing offline coverage confirms the controlled PWA reload remains usable with `Offline — local tools ready`; optimized gap geometry is local draft data and therefore exports while offline.

### Release status and next action

The code, quality gates, PWA, accessibility, mobile targets, and response policy configuration are ready for static deployment. The deployed app honestly marks purchases unavailable rather than linking to a 404. When the factory enables/registers `route-intent-planner` in the Sociobot billing catalog and the production checkout reaches hosted checkout, deploy with `VITE_BILLING_ENABLED=true` and rerun a direct checkout smoke test plus live identity/header checks. No other known product-code gaps remain from verification 2.
