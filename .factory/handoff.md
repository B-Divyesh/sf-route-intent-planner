# Route Intent Planner — repair 3 handoff

## Release identity

- Result: repaired, deployed, and cold-checked on 6 September 2026 UTC.
- Live URL: `https://route-intent-planner.sociobot.in/`
- Review baseline: `8a801a4563bb8b14ec0b9ccaf51a5b01f6832c66`
- Deployed implementation SHA: `5cfeb84dbf3ebeaf16ead4a62bd79abcf9146cbb`
- Deployment: existing `sf-route-intent-planner` Static Web App, production deployment `23603186-15da-4ef1-a55f-9133fca6b1aa`.
- The later commit containing this handoff is documentation only. The deployed product remains the implementation SHA above.

## What changed

- Added a one-click `/demo/` route with the required nine-point London canal sample, persistent demo label, reset action, and real-use exit.
- Isolated sample state under `demo:` localStorage keys and a separate `demo:route-intent-planner` IndexedDB database. Leaving the demo clears only demo data.
- Replaced the first-screen copy with the route-planning job, cyclist and ride-leader audience, sample action, action result, and three plain facts. All appear before scrolling at 1440×900 and 390×844.
- Removed metaphor headings and added the required product, three-step explanation, limits/privacy, paid offer, and consistent footer sections.
- Added `.factory/claims.json` with one tagged outcome test for each of the 14 reviewed claim groups plus demo isolation.
- Corrected the README privacy wording: only selected open-gap endpoints leave the browser after `Optimize gaps`.
- Added a real demo document, route title, navigation, Open Graph/Twitter metadata, 180px Apple icon, sitemap entry, and original 1200×630 social art.
- Added a designed 404 page and changed static hosting from an all-path home rewrite to a real HTTP 404 response override.
- Made the installed-app `/?new=1` shortcut create a blank route and remove the consumed parameter.
- Replaced raw transport errors with a connection and retry message while leaving route data unchanged.
- Replaced the nested complementary landmark with a labelled section. All-severity axe scans now pass.
- Added a usable external repository link for privacy requests.
- Added a CSP-safe offline page, kept the versioned service worker, and advanced the shell cache to `route-intent-shell-v6`.
- Added a production-like local static server so browser tests observe real 404 behavior rather than Vite SPA fallback behavior.

## Review 1 finding disposition

| Finding | Disposition | Outcome evidence |
|---|---|---|
| F1 sample overwrote real draft | Resolved | `@claim:demo-isolation` changes and resets the sample, then restores an unchanged real-data sentinel. |
| F2 job, audience, action, and plain words | Resolved | Fresh desktop and phone measurements show the headline, audience, action, action result, and all three facts before scrolling. `.factory/copy-audit.md` has no sentence over 22 words or banned term. |
| F3 14 untested claims | Resolved | `.factory/claims.json` lists 15 claims; every exact command passed independently. Each ID appears on exactly one outcome test. |
| F4 false no-coordinate-upload README statement | Resolved | README and Privacy now say the opt-in router receives the selected gap’s two endpoints. |
| F5 unknown routes returned home with 200 | Resolved | Live `/this-route-does-not-exist` returns HTTP 404 with the designed `Page not found` page and route-planner link. |
| F6 incomplete site structure and metadata | Resolved | Header navigation, How it works, limits, footer/build id, demo title, route metadata, social image, Apple icon, and sitemap are present. |
| F7 PWA new-route shortcut did nothing | Resolved | Browser regression opens `/?new=1`, gets a blank route, and confirms the parameter is consumed. |
| F8 raw router transport error | Resolved | Aborted-request regression shows the connection, unchanged-draft, and retry guidance. |
| F9 nested complementary landmark | Resolved | The review panel is a labelled section; axe reports zero violations on home, demo, 404, Privacy, and Terms. |
| F10 no privacy request path | Resolved | Privacy links the live public product repository, which returned HTTP 200. |

## Earlier verification finding disposition

- Out-of-range, missing, blank, and non-numeric GPX coordinates remain rejected with recovery guidance.
- Invalid archive data remains schema-validated before writes; malformed legacy records are removed without blocking the app.
- Gap routing remains explicit and gap-only. Export keeps authored endpoints exact and inserts router geometry only inside the selected gap.
- File inputs retain visible keyboard focus. Checked interactive targets remain at least 44×44 CSS px on the populated 390px layout.
- Hashed assets remain immutable. The service worker remains no-store. CSP, Permissions-Policy, HSTS, frame denial, referrer policy, and MIME-sniff protection are live.
- The retired `/manifest.webmanifest` remains a deliberate HTTP 404. The linked `/manifest.json` returns JSON with `no-cache`.
- The unregistered checkout remains hidden. Paid deliverables, exact US$9 one-time terms, license restore, and validation code remain intact.
- The researched 85% post-export-correction goal is still an unmeasured field outcome. Deterministic tests prove route integrity, not user adoption or field success.

## Verification

Clean documented setup and gates:

```text
npm ci             PASS — 61 packages installed; 0 vulnerabilities
npm test           PASS — 14/14 Vitest checks
npm run build      PASS — dist/index.html and all public routes produced
npm run test:e2e   PASS — 58/58 Chromium checks across desktop and 390×844
```

All 15 exact commands from `.factory/claims.json` passed in isolated desktop claim runs. Offline claims use their own browser contexts.

The Playwright axe integration reported zero violations at every severity on home, demo, 404, Privacy, and Terms. Keyboard skip-link, upload focus, touch targets, reduced motion, route errors, GPX boundaries, archive recovery, privacy requests, demo isolation, and mobile overflow checks passed.

`/opt/fleet/lib/verify-url.sh` passed locally and live. The final live result had one title, one `h1`, one `main`, `lang=en`, no missing alt text, no unnamed button, and no console or page error.

Fresh live mobile Lighthouse:

| Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS | Transfer |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 100 | 100 | 100 | 100 | 0.9 s | 1.7 s | 50 ms | 0 | 178 KiB |

Production bundle sizes: app JavaScript 31.91 KB raw / 11.26 KB gzip; CSS 18.72 KB raw / 4.77 KB gzip; hero WebP 139 KB; no font payload. The social image is 154 KB and is metadata-only, not an initial render request.

Fresh live desktop and phone browser checks found:

- the job, audience, sample action, action result, and three facts before scrolling;
- no horizontal overflow, console error, page error, or automatic off-origin request;
- a persistent demo banner, nine points, eight segments, `Canal towpath`, and `Check river crossing`;
- one route-review warning and a nine-point GPX download;
- reset restored the sample, while `LIVE-REAL-SENTINEL` remained unchanged during and after demo mode;
- offline reload at `/demo/` restored the title, nine points, and `Offline — local tools ready`;
- a controlled service-worker replacement reached `registration.waiting` and displayed `An offline update is ready`.

Live byte comparisons matched local `dist/` for home, Demo, Privacy, Terms, 404, offline page, service worker, manifest, app JS, CSS, both artwork files, and all four icons.

## Evidence

- `/work/.evidence/live-repair3-desktop-first.png`
- `/work/.evidence/live-repair3-phone-first.png`
- `/work/.evidence/live-repair3-desktop-demo.png`
- `/work/.evidence/live-repair3-phone-demo.png`
- `/work/.evidence/lighthouse-live-repair3-final.json`
- `/work/.evidence/verify-url-live-repair3-final/`
- `/work/.evidence/catalog-description.txt`
- `/work/.evidence/billing-offer.json`

## Remaining dependencies and gaps

- The factory billing operator must register `route-intent-planner` before sales can open. Until then checkout is deliberately hidden; the free planner is complete.
- Gap optimization depends on the public `routing.openstreetmap.de` bicycle endpoint after explicit user action. Offline editing and cached exports do not depend on it.
- Route output is advisory. The product cannot verify current access, closures, surfaces, traffic, weather, or rider fitness.
- The 85% field success measure requires observation from real ride leaders after release.

This is a static PWA with browser-local state. Backend tenant isolation, server restart persistence, health, SQLite, and product-owned 429 checks do not apply.
