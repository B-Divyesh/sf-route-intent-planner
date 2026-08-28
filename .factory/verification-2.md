# Route Intent Planner — independent verification 2

**Result: FAIL**

- Candidate: `07de54732863831a53b1729fd26b44bbf1c33c17`
- URL: `https://route-intent-planner.sociobot.in/`
- Verified: 2026-08-28 UTC
- Work order: `route-intent-planner-verify-2`
- Scope: clean install, all repository gates, exact production build, independent functional and boundary QA, desktop and 390 px mobile, keyboard and axe, privacy/network review, PWA offline/update checks, response policy and cache checks, Lighthouse, and candidate/live byte comparison.

The deployed header/cache repair is real and the live artifact byte-matches this candidate. The release nevertheless fails the acceptance contract because the product does not optimize open gaps, malformed GPX points with absent coordinates become exportable `(0,0)` points, the advertised purchase path is dead, and file inputs have no visible keyboard focus.

## Blocking defects

### P1 — The brief's gap optimization capability is not implemented

The smallest useful product in the researched brief must lock declared corridors and **optimize only gaps**. This build never routes or optimizes a gap. Selecting `Open gap` changes the segment mode and warning style, but leaves the same straight line between user-entered coordinates. The interface explicitly says `Open gaps are straight advisory connectors`, and `analyze()` only returns `Open gap — straight advisory connector only.` No road graph, routing request, or gap route result exists.

This is honest copy, but it does not complete the contracted job. A ride leader still has to find a route for every gap in another tool and then add enough trace points manually—the workaround the product was intended to remove. A named mandatory segment is also only free-text GPX metadata; it does not resolve or constrain a road/path. Implement an OSM-compatible gap router that changes only open sections and proves locked coordinates remain unchanged, or revise the product acceptance scope through the factory rather than claiming the researched brief is complete.

### P1 — GPX points with missing coordinate attributes silently become `(0,0)`

This valid XML was accepted locally and on the live deployment:

```xml
<gpx version="1.1"><trk><name>Broken coordinates</name><trkseg>
  <trkpt/><trkpt/>
</trkseg></trk></gpx>
```

The app reported the file imported, showed two points, enabled export, and produced two `<trkpt lat="0.000000" lon="0.000000">` entries. `parseGpx()` calls `Number(node.getAttribute(...))`; `getAttribute()` returns `null` for an absent attribute and `Number(null)` is `0`, which passes the WGS84 range check.

This is a high-impact route-integrity failure in the primary import/export path. Require both attributes to exist and contain non-empty finite numeric values before conversion. Add unit and browser coverage for absent, blank, and non-numeric latitude/longitude independently. Existing out-of-range validation does pass.

### P1 — The advertised US$9 purchase cannot be completed

The live `Buy Route Tape — $9` link targets:

```text
https://pilot-api.sociobot.in/api/v1/products/route-intent-planner/checkout
```

Fresh direct requests returned HTTP 404 with:

```json
{"error":"enabled factory product","status":404}
```

The production API checkout URL returned the same 404, so the product is not registered/enabled on either billing environment. The public production-domain build also uses the pilot API rather than the required production API. Users cannot buy the paid feature advertised in the UI and terms. Register the product, build the release with `VITE_BILLING_API=https://api.sociobot.in`, and verify the live link reaches hosted checkout before release. Invalid-license verification itself returned a well-formed no-store response with correct CORS.

### P2 — File upload controls have no visible keyboard focus

Keyboard traversal focuses `#gpx-input`, but the focused element has `opacity: 0`; its measured box was 24×44 px and its 3 px outline is invisible with the element. The visible `Import GPX` label has no `:focus-within` style. The unlocked archive import uses the same pattern. This violates the explicit visible-focus and keyboard acceptance requirement even though Enter can operate the native input.

Apply the designed focus treatment to the visible label with `:focus-within` (and preserve a usable input hit area), then verify both import controls by keyboard. The initial asynchronous render also replaced the focused skip link once during traversal, briefly returning focus to `<body>`.

### P2 — Several mobile targets are below the required 44×44 CSS px baseline

At 390×844, segment-name inputs measured about 276×41.8 px. Privacy/Terms/OpenStreetMap footer links measured only 14–18.6 px high, with some only 36–51 px wide. This contradicts the supplied touch-target rule and the handoff claim that all controls meet the 44 px baseline. Increase the interactive boxes without requiring visibly oversized text.

### P3 — Legal pages still use the old manifest response path

The home page links `/manifest.json`, served as `application/json` with `Cache-Control: no-cache`. Privacy and Terms instead link `/manifest.webmanifest`, which is served live as `application/octet-stream` with `max-age=30`. Chromium's `Page.getAppManifest` parsed all three without errors, so installability from the home page is not blocked, but response policy is inconsistent and retains the MIME problem the repair intended to remove.

## Clean repository gates

The checkout was clean at the candidate before installation. No product source was changed.

```text
npm ci             PASS — 61 packages installed; 62 audited; 0 vulnerabilities
npm test           PASS — 7/7 Vitest tests
npm run build      PASS — tsc -b and Vite 6.4.3; dist/ produced
npm run test:e2e   PASS — 12/12 Playwright 1.58.2 tests
```

There is no lint script. Type checking is part of the exact production build.

## Independent functional evidence

Passing behaviors:

- Added exact coordinates, named a segment `Old Mill & Lane`, marked it as an open gap, ran review, and exported GPX. The export preserved both coordinates, escaped `&` as `&amp;`, and included `1:gap:Old Mill &amp; Lane` in intent metadata.
- Current-draft localStorage recovery and IndexedDB save/reload passed. Delete cancellation preserved the saved route; confirmation removed it without changing the draft.
- Undo, redo, and remove-last passed.
- WGS84 boundary pairs `(-90,-180)` and `(90,180)` were accepted. Native number constraints rejected direct `91,181` entry without adding a point.
- A 2,000-point GPX imported as 2,000 points/1,999 segments in about 1.6 s with no console/page error. A 2,001-point file was rejected with the documented simplification instruction.
- Malformed XML, a one-point GPX, out-of-range GPX coordinates, and non-numeric elevation were rejected. A valid route imported immediately after these errors, proving recovery.
- The free archive accepted three distinct routes and rejected a fourth with an actionable message.
- A malformed JSON archive and a syntactically valid invalid-schema archive produced errors and wrote no route. License query capture removed the token while retaining another query parameter. A fresh cached valid verdict unlocked immediately; a simulated 503 kept the free planner usable with a recovery message.
- Sample review showed one open-gap warning. Live GPX download under the deployed CSP produced 9 points and preserved `5:gap:Check river crossing` with no console/page error.

The 85% no-post-export-correction success measure has no field/user evidence in the repository and cannot be substantiated by deterministic QA. The missing gap optimizer makes that outcome especially unproven.

## Accessibility, responsive behavior, and visual review

- Independent axe scans found **0 serious/critical violations** on the populated planner, Privacy, and Terms pages locally; the live populated planner also had 0 on desktop and 390 px mobile.
- Desktop and mobile each had one `<h1>`, one `<main>`, `lang="en"`, a descriptive title, image alt text, and no horizontal overflow. Mobile measured `scrollWidth === clientWidth === 390`.
- No console or page errors occurred in normal, invalid-input recovery, live desktop, or live mobile flows.
- Skip link focus is visibly styled with a 3 px outline and activates correctly. Normal buttons and text fields also show the designed outline. The hidden file-input exception is recorded above.
- `prefers-reduced-motion: reduce` matched; computed button transition duration was `0.00001s`, HTML scrolling was `auto`, and there were no running animations.
- Zoom is not disabled. The 390 px layout retains drafting, import, route review, save, export, licensing, and legal controls.
- Fresh desktop/mobile screenshots were visually reviewed. The product-specific cassette/route-sheet hierarchy is intact, legible, and free of overlap or clipping. The generated hero has explicit dimensions and meaningful alt text.

## Privacy and outbound requests

- Fresh free-planner sessions made **zero automatic off-origin requests** locally and live. There are no analytics, ad, tile, CDN font, or third-party script requests.
- Routes remain in localStorage/IndexedDB; import and export happen in the browser. The privacy page accurately describes route, cache, archive, and license storage.
- The only configured runtime fetch is license verification after a token exists. Checkout is a user-activated Sociobot link. The deployed CSP restricts connections to self plus the production and pilot Sociobot APIs.
- No font files ship. The external OpenStreetMap licensing URL is a user-activated footer link, not an automatic request.

## PWA, offline, and update behavior

- Manifest fields pass: name/short name, versioned `start_url`, `display: standalone`, matching paper theme/background colors, 192/512 icons, and a 512 maskable icon. Actual image dimensions match declarations.
- After service-worker control, local offline reload retained the 9-point draft, rendered the planner, and showed `Offline — local tools ready`; offline Privacy navigation also worked. Live offline reload rendered the planner and offline badge.
- A controlled replacement of the built worker (`route-tape-shell-v5` to `v6` in a temporary copy of `dist/`) reached `registration.waiting`, displayed `An offline update is ready`, and `Apply update` activated the worker, reloaded, and restored the page with one `<h1>`.
- The worker has a versioned shell cache, removes old caches, claims clients, caches built assets, uses network-first navigation, and serves cached same-origin assets offline.

## Deployment identity, headers, and caching

`/opt/fleet/lib/verify-url.sh` passed against the live URL: HTTPS 200, correct title/lang/landmarks/alt/button labels, and zero console/page errors.

Fresh SHA-256 comparisons matched byte-for-byte for:

- `index.html`
- all referenced JS/CSS assets (`app-DxK_cDaD.js`, `styles-BqgC7tgH.js`, `styles-C0XmPvtb.css`)
- `sw.js`, `manifest.json`, `offline.html`, hero artwork
- Privacy and Terms HTML

This establishes that the tested live deployment is the candidate artifact, not a stale deployment.

Live policy evidence:

- `/assets/*`: `public, max-age=31536000, immutable`
- `/sw.js`: `no-cache, no-store, must-revalidate`
- `/manifest.json`: `no-cache`, `application/json`
- HTML: 30-second revalidation
- Present: CSP, Permissions-Policy, HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and strict-origin referrer policy

The previous candidate's deployment-only cache/header failures are repaired.

## Performance and bundle budgets

Production payloads:

- Initial JS: 24,681-byte app + 711-byte style module (about 25.4 KB raw; about 9.5 KB gzip), below 200 KB.
- CSS: 15,340 bytes raw / 4,137 bytes gzip, below 50 KB.
- Hero WebP: 139,286 bytes at 720×720, below 300 KB.
- Fonts: 0 bytes.

Three fresh local Lighthouse 13.4.1 mobile runs:

| Run | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS | Transfer |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 91 | 100 | 100 | 100 | 2.1 s | 360 ms | 0 | 175 KiB |
| 2 | 96 | 100 | 100 | 100 | 2.1 s | 200 ms | 0 | 175 KiB |
| 3 | 98 | 100 | 100 | 100 | 2.1 s | 100 ms | 0 | 175 KiB |

All runs clear the supplied Lighthouse performance ≥90, accessibility ≥95, LCP <2.5 s, CLS <0.1, and transfer/bundle gates. Lab TBT was variable; the median was 200 ms. Lighthouse does not provide a real-user INP measurement for this static audit.

## Required release actions

1. Implement the contracted gap-only routing behavior while proving locked route intent remains unchanged.
2. Reject GPX points whose latitude or longitude attribute is absent, blank, or non-numeric; add regression coverage.
3. Register/enable the billing product, switch the live build to `api.sociobot.in`, and complete a checkout smoke test.
4. Add visible focus to both file upload labels and bring all interactive target boxes to at least 44×44 px.
5. Point legal pages at `/manifest.json` or give `/manifest.webmanifest` the same manifest MIME/cache policy.
6. Re-run independent verification against the repaired commit and live artifact.
