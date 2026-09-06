# Plan cycling routes while keeping chosen roads fixed — review 2

**Verdict: PASS**

- Findings: **0**
- Untested public claims: **0**
- Reviewed implementation candidate: `5cfeb84dbf3ebeaf16ead4a62bd79abcf9146cbb`
- Documentation baseline: `132d6896a1ddf656c6aff5325050b24d6b19a8bb`
- Live URL: <https://route-intent-planner.sociobot.in/>
- Reviewed: 2026-09-06 UTC

## Job, audience, and first action

- Job: plan cycling routes while keeping chosen roads and paths fixed, routing only selected gaps.
- Audience: cyclists and ride leaders who already know the roads or paths they intend to use.
- First action before scrolling: **Try it with sample data**. It opens a separate nine-point London canal-loop demo.

Fresh Chromium desktop (1440 × 900) and phone (390 × 844) pages both showed the job heading, audience sentence, action, action result, and three short facts without scrolling. The page had no horizontal overflow or console/page error in either fresh context.

## Clean checkout and claims

A detached clean checkout at `132d689` was installed with `npm ci`. The candidate’s production files were then compared with live files: home, demo, legal, 404, offline, manifest, worker, robots, sitemap, both artwork files, all icons, and all built JS/CSS assets had identical SHA-256 hashes.

```text
npm ci             PASS — 61 packages installed; 0 vulnerabilities
npm test           PASS — 14/14 Vitest tests
npm run build      PASS — dist/ produced
npm run test:e2e   PASS — 58/58 Playwright checks
```

Every command in `.factory/claims.json` was run independently, exactly as declared, from that clean checkout. Each command passed; its command text and output are retained under `/work/.evidence/review-2-claims/`.

| Claim | Result | Evidence |
| --- | --- | --- |
| `demo-isolation` | PASS | `review-2-claims/demo-isolation.log` |
| `locked-intent` | PASS | `review-2-claims/locked-intent.log` |
| `gaps-only` | PASS | `review-2-claims/gaps-only.log` |
| `gap-endpoints-only` | PASS | `review-2-claims/gap-endpoints-only.log` |
| `gpx-import` | PASS | `review-2-claims/gpx-import.log` |
| `gpx-export-free` | PASS | `review-2-claims/gpx-export-free.log` |
| `edit-check-history` | PASS | `review-2-claims/edit-check-history.log` |
| `draft-refresh` | PASS | `review-2-claims/draft-refresh.log` |
| `free-three-routes` | PASS | `review-2-claims/free-three-routes.log` |
| `offline-workflow` | PASS | `review-2-claims/offline-workflow.log` |
| `offline-cached-export` | PASS | `review-2-claims/offline-cached-export.log` |
| `automatic-request-privacy` | PASS | `review-2-claims/automatic-request-privacy.log` |
| `paid-archive` | PASS | `review-2-claims/paid-archive.log` |
| `local-delete` | PASS | `review-2-claims/local-delete.log` |
| `no-account-font-tiles` | PASS | `review-2-claims/no-account-font-tiles.log` |

I also cross-checked public landing, planner, legal, and README copy against the registry. The 85% field-success outcome remains a research measure, not a deterministic public product promise; it needs post-release rider evidence. There are no missing, false, or untested public claims.

## Fresh live checks

- The demo displayed **Demo — sample data, nothing is saved**, nine points, the canal-loop sample, and the route-review warning. After renaming sample data, real `LIVE-REAL-SENTINEL` data stayed unchanged. **Reset demo** restored `Canal loop — sample` and nine points; **Start for real** restored the unchanged real sentinel.
- A real user-triggered **Optimize gaps** call sent exactly `-0.072,51.548;-0.104,51.554` to the disclosed bicycle router. GPX export retained both authored anchors. No automatic off-origin request occurred in the normal demo flow.
- The local browser suite covered normal, invalid, WGS84-boundary, malformed, and recovery paths: bad GPX and archive data are rejected with recovery guidance; undo/redo, save limits, router transport recovery, keyboard/focus, touch targets, reduced motion, and mobile layout all passed.
- A fresh controlled live offline reload of `/demo/` retained the title, nine points, and **Offline — local tools ready**. A controlled replacement worker against the unchanged production build reached `waiting` and displayed **An offline update is ready** with **Apply update**.
- Fresh live axe scans reported zero violations on home, demo, Privacy, Terms, and the designed 404. `verify-url.sh` passed home: HTTPS 200, title, `lang=en`, one `h1`, one `main`, image alt text, button names, and no console/page error. The browser’s ordinary console message for the deliberately requested HTTP 404 was classified as expected, not a defect.
- Home, demo, Privacy, Terms, offline page, manifest, robots, sitemap, worker, artwork, and icons returned 200. The retired `/manifest.webmanifest` deliberately returned 404. An unknown page returned the intended designed HTTP 404, its own title, and a route-planner link.
- Live headers include CSP, Permissions-Policy, HSTS, frame denial, MIME-sniff protection, and strict-origin referrer policy. The static PWA has browser-local storage only; backend tenant isolation, restart persistence, health, SQLite, and 429/Retry-After checks do not apply.

## Earlier findings and minor issues

| Earlier item | Current disposition |
| --- | --- |
| Review F1: sample altered real data | Resolved; fresh live sentinel/demo/reset/exit check passed. |
| Review F2: unclear first screen and non-plain copy | Resolved; both fresh viewports passed the stated first-screen test; copy audit remains within limits. |
| Review F3: missing claim registry/tests | Resolved; all 15 declared commands passed independently. |
| Review F4: false coordinate-privacy wording | Resolved; copy accurately states that an explicit gap action sends only its endpoints. |
| Review F5: unknown path served home | Resolved; live unknown path is a designed HTTP 404. |
| Review F6: incomplete structure and metadata | Resolved; navigation, three-step explanation, footer/build label, route titles, social metadata, icons, and sitemap are present. |
| Review F7: `?new=1` did not create a route | Resolved by the passing installed-app shortcut coverage. |
| Review F8: raw router transport error | Resolved by the passing recovery-message coverage. |
| Review F9: nested complementary landmark | Resolved; fresh all-severity axe scans are clear. |
| Review F10: no usable privacy-request path | Resolved; Privacy links the public repository and the link returns 200. |
| Out-of-range/missing/blank/non-numeric GPX and malformed archive recovery | Resolved; unit and browser recovery coverage passed. |
| Performance, immutable asset caching, headers, and manifest defects | Resolved; current build is 11.26 KB gzip JS and 4.77 KB gzip CSS; live cache and policy checks passed. |
| Open gaps were straight connectors | Resolved; real live selected-gap routing and locked-anchor export check passed. |
| Advertised dead checkout | Resolved for this release; sales are plainly closed and checkout is hidden. |
| File-control focus and small mobile targets | Resolved by passing focus and 44 px target coverage. |
| Legal pages used retired manifest | Resolved; legal pages use `/manifest.json`; the old route is deliberately 404. |
| 85% post-export-correction outcome | Still unmeasured in the field; not advertised as a deterministic product claim. |

## Evidence

- `/work/.evidence/review-2-live-desktop-first.png`
- `/work/.evidence/review-2-live-phone-first.png`
- `/work/.evidence/review-2-live-desktop-demo.png`
- `/work/.evidence/review-2-live-browser.json`
- `/work/.evidence/review-2-demo-isolation.json`
- `/work/.evidence/review-2-update-local.json`
- `/work/.evidence/review-2-verify-url/verify.json`
- `/work/.evidence/review-2-live-file-hashes.txt`
- `/work/.evidence/review-2-claims/`

**Final verdict: PASS — zero findings and zero untested public claims.**
