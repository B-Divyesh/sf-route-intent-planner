# Route Intent Planner — independent verification

**Result: FAIL**

- Tested candidate: `2bc759652ddad4b14aacba53d10c46502c50bbec`
- Tested URL: `https://route-intent-planner.sociobot.in/`
- Date: 2026-08-28
- Scope: clean install/build/test, independent desktop/mobile browser QA, PWA/privacy/network/header checks, and live-to-candidate comparison.

## Blocking defects

### P1 — Out-of-range GPX coordinates are imported as a usable route

`parseGpx` only verifies that `lat` and `lon` are finite. A two-point GPX with `lat="91" lon="181"` and `lat="92" lon="182"` was accepted. The UI reported `Imported out-of-range.gpx. Every segment starts locked.` and made it exportable.

This violates the required invalid-input/recovery behavior and WGS84 assumptions. A ride leader can import and export an impossible route instead of receiving a correction path. Reject latitude outside `[-90, 90]` and longitude outside `[-180, 180]` before creating a draft, with an actionable error.

### P1 — Malformed paid archive can permanently prevent the app from rendering

With the paid archive controls enabled, importing this syntactically valid JSON succeeds far enough to persist it in IndexedDB:

```json
{"routes":[{"id":"bad","name":42}]}
```

The import causes `TypeError: e.replace is not a function`; after reload there is no `<h1>` or app UI, only the skip link, and the same page error repeats. There is no in-app recovery; clearing site data is required. Validate the full archive/route/point/segment schema before any write, use an atomic transaction, and keep invalid content out of IndexedDB.

## Release-blocking quality/deployment defects

### P2 — Mobile Lighthouse performance misses the stated gate

Fresh local production Lighthouse (v13.4.1, Playwright Chromium 145, `--headless --no-sandbox --disable-dev-shm-usage --disable-gpu`) returned: Performance **86**, Accessibility 100, Best Practices 100, SEO 100; LCP 2.1 s; CLS 0; total blocking time **510 ms**; transfer 174 KiB.

This misses the supplied PWA performance requirement of mobile Lighthouse >=90 and TBT <200 ms. Lighthouse attributes 870 ms of style/layout work and 668 ms other main-thread work; the result should be rechecked after optimisation.

### P2 — Live hashed assets are not immutably cached

The live candidate serves `/assets/app-BhKGku9A.js`, `/assets/styles-C0XmPvtb.css`, and the hero asset with `cache-control: public, must-revalidate, max-age=30`. These are content-hashed resources and the repository deployment instructions require immutable caching for `/assets/*`. This defeats the intended static/PWA cache policy. Deploy them with a long immutable lifetime while retaining short revalidation for `sw.js` and the manifest.

### P3 — Live browser hardening headers are incomplete

The live response has HSTS, `referrer-policy: strict-origin-when-cross-origin`, and `x-content-type-options: nosniff`, but no Content-Security-Policy or Permissions-Policy. The manifest is served as `application/octet-stream` rather than a manifest JSON media type. These are deployment hardening issues, not the cause of the functional failures.

## Passing evidence

- Clean `npm ci`: passed (62 packages audited; 0 vulnerabilities).
- `npm test`: passed, 4/4 Vitest tests.
- Exact production `npm run build`: passed. `dist/` contains the app, privacy, terms, manifest, service worker, offline page, icons, and artwork.
- `npm run test:e2e`: passed, 8/8 desktop and 390px Chromium tests.
- Independent desktop and 390px tests: normal coordinate entry, intent change to open gap, route check, GPX download, malformed XML recovery, one-point GPX recovery, 2,001-point GPX recovery, save cap, mobile layout, keyboard skip link/focus, and reduced motion all passed. No console or page errors occurred in valid flows.
- Accessibility: independent axe scans on local desktop/mobile and the live desktop page found 0 serious/critical violations. Live/local pages have `lang=en`, title, one `h1`, and one `main`; mobile `scrollWidth === clientWidth === 390`.
- PWA: after service-worker control, local offline reload showed the planner and `Offline — local tools ready`. A controlled replacement-worker simulation reached `registration.waiting === true` and displayed the update toast.
- Privacy/network: valid free-planner use made no off-origin requests; no analytics, tiles, CDN fonts, or automatic third-party requests were observed. Data persistence was localStorage/IndexedDB as described. Billing is only linked/called on the paid flow.
- Bundle budgets: app JS 22,500 bytes (8,400 gzip), CSS 15,340 bytes (4,120 gzip), hero WebP 139,286 bytes, and no font payload; each size budget passes.
- Live identity: live `/` byte-compares to `dist/index.html`; SHA-256 comparisons for app JS, both styles assets, `sw.js`, manifest, offline page, and hero artwork all match the candidate build exactly. Live browser smoke had no console/page errors or off-origin automatic requests at desktop or 390px.

## Reproduce

```bash
npm ci
npm test
npm run build
npm run test:e2e
CHROME_PATH=/opt/pw-browsers/chromium-1208/chrome-linux64/chrome \
  npx --yes lighthouse http://127.0.0.1:4173/ \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output-path=/tmp/route-intent-lh.json --quiet \
  --chrome-flags='--headless --no-sandbox --disable-dev-shm-usage --disable-gpu'
```

Serve `dist/` locally before the Lighthouse command (for example `npm run preview -- --port 4173`).
