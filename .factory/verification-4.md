# Plan cycling routes while keeping chosen roads fixed — verification 4

**Verdict: PASS**

- Findings: **0**
- Untested public claims: **0**
- Implementation candidate: `5cfeb84dbf3ebeaf16ead4a62bd79abcf9146cbb`
- Documentation commit: `cfae119c46a346e323a646552190b9cc13cbabe6`
- Live URL: <https://route-intent-planner.sociobot.in/>
- Verified: 2026-09-06 UTC

## Job, audience, and first action

- Job: plan a cycling route while keeping chosen roads and paths fixed and routing only selected gaps.
- Audience: cyclists and ride leaders who know the roads they intend to use.
- First action before scrolling: **Try it with sample data**. It loads a nine-point London canal loop in separate demo storage.

Fresh desktop (1440 × 900) and phone (390 × 844) browser contexts showed the job headline, audience sentence, action, action result, and all three facts before scrolling. Neither viewport overflowed or logged a console or page error.

## Quality gates

```text
npm ci             PASS — 61 packages installed; 0 vulnerabilities
npm test           PASS — 14/14 Vitest tests
npm run build      PASS — dist/ produced
npm run test:e2e   PASS — 58/58 Playwright checks
```

The product has no separate lint command. Type checking is part of `npm run build` and passed.

## Public claims

All commands in `.factory/claims.json` ran exactly as declared from the documented clean setup. Each passed one tagged browser test, and each claim ID appears exactly once in the test source.

| Claim ID | Result | Evidence |
| --- | --- | --- |
| `demo-isolation` | PASS | `/work/.evidence/verification-4-claims/demo-isolation.log` |
| `locked-intent` | PASS | `/work/.evidence/verification-4-claims/locked-intent.log` |
| `gaps-only` | PASS | `/work/.evidence/verification-4-claims/gaps-only.log` |
| `gap-endpoints-only` | PASS | `/work/.evidence/verification-4-claims/gap-endpoints-only.log` |
| `gpx-import` | PASS | `/work/.evidence/verification-4-claims/gpx-import.log` |
| `gpx-export-free` | PASS | `/work/.evidence/verification-4-claims/gpx-export-free.log` |
| `edit-check-history` | PASS | `/work/.evidence/verification-4-claims/edit-check-history.log` |
| `draft-refresh` | PASS | `/work/.evidence/verification-4-claims/draft-refresh.log` |
| `free-three-routes` | PASS | `/work/.evidence/verification-4-claims/free-three-routes.log` |
| `offline-workflow` | PASS | `/work/.evidence/verification-4-claims/offline-workflow.log` |
| `offline-cached-export` | PASS | `/work/.evidence/verification-4-claims/offline-cached-export.log` |
| `automatic-request-privacy` | PASS | `/work/.evidence/verification-4-claims/automatic-request-privacy.log` |
| `paid-archive` | PASS | `/work/.evidence/verification-4-claims/paid-archive.log` |
| `local-delete` | PASS | `/work/.evidence/verification-4-claims/local-delete.log` |
| `no-account-font-tiles` | PASS | `/work/.evidence/verification-4-claims/no-account-font-tiles.log` |

No unlisted public claim was found on the first screen, planner, legal pages, or README. The unmeasured 85% field-success target remains a researched outcome measure, not a public deterministic claim.

## Live product checks

- The one-click demo has a persistent **Demo — sample data, nothing is saved** label, nine points, eight segments, `Canal towpath`, and `Check river crossing`.
- It showed a route-review warning. Reset restored `Canal loop — sample`; Start for real restored an unchanged `LIVE-REAL-SENTINEL` real draft. Demo work remained in its `demo:` namespace.
- An explicit live Optimize gaps request sent only `-0.072,51.548;-0.104,51.554` to the disclosed bicycle router. It returned an optimized gap; export contained 200 points and retained both authored endpoint coordinates.
- An out-of-range GPX import was rejected with recovery guidance. A WGS84-boundary GPX imported immediately afterward as the two-point `Recovery route`.
- Keyboard, file-control focus, touch target, mobile-overflow, reduced-motion, input-boundary, malformed GPX/archive recovery, undo/redo, archive limits, and router transport recovery are covered by the passing browser suite.
- The live service worker controlled the page. A fresh offline reload of `/demo/` retained the demo title, nine points, and **Offline — local tools ready** with no errors. A controlled replacement worker reached `waiting` and displayed **An offline update is ready**.
- Live axe scans found zero violations at every severity on home, demo, Privacy, Terms, and the designed 404 page at desktop; home and demo also passed at phone size. The supplied URL verifier passed: title, `lang=en`, one `h1`, one `main`, image alt text, button names, and no console/page error.
- Home, Demo, Privacy, Terms, offline page, manifest, robots, sitemap, and all landing-page links returned 200. An unknown route returned the intended designed HTTP 404 with its own title. The retired `/manifest.webmanifest` deliberately returned HTTP 404.
- Fresh local build bytes matched live home, demo, legal, 404, offline, service worker, manifest, artwork, icons, and every built JS/CSS asset.
- Live headers include CSP, Permissions-Policy, HSTS, frame denial, MIME-sniff protection, and strict-origin referrer policy. There were no automatic off-origin requests; the only observed off-origin request was the user-triggered bicycle-router request above.

## Earlier findings

| Earlier finding | Current disposition and evidence |
| --- | --- |
| Out-of-range GPX and missing/blank/non-numeric coordinates | Resolved. Unit and browser checks reject each case; the live rejection and subsequent successful recovery import were repeated here. |
| Malformed archive could prevent reload | Resolved. Schema validation and malformed-record cleanup pass in the browser suite. |
| Lighthouse/cache/header/manifest defects | Resolved. Current live asset and policy checks pass; the repair handoff records 100/100/100/100 Lighthouse and LCP 1.7 s. |
| Open gaps were only straight connectors | Resolved. The live explicit request optimized exactly one selected gap, while the claim suite proves locked points and gaps-only behavior. |
| Purchase link was dead | Resolved for this release. Sales are clearly closed and checkout is hidden; recorded-license coverage proves the optional archive behavior. |
| File focus and small mobile targets | Resolved. Passing browser coverage checks visible `:focus-within` treatment and 44 px targets. |
| Legal manifest inconsistency | Resolved. Legal pages use `/manifest.json`; the old route is deliberately 404. |
| Review F1: demo changed real data | Resolved. Fresh live sentinel, change, reset, and exit checks kept real data unchanged. |
| Review F2: first-screen job, audience, action, and plain words | Resolved. Both fresh viewports passed the stated first-screen check; copy audit remains clean. |
| Review F3: untested public claims | Resolved. All 15 declared commands passed independently; no claim is untested. |
| Review F4: false route-coordinate privacy wording | Resolved. README and Privacy describe the explicit two-endpoint router request accurately. |
| Review F5: unknown route returned home | Resolved. Unknown live path returned a designed HTTP 404. |
| Review F6: incomplete site structure/metadata | Resolved. Header navigation, three-step explanation, footer/build ID, route titles, social metadata, Apple icon, and sitemap are live. |
| Review F7: installed-app new route did nothing | Resolved. Passing browser coverage verifies `/?new=1` creates a blank route and consumes the parameter. |
| Review F8: raw router transport error | Resolved. Passing browser coverage verifies connection and retry guidance without changing the draft. |
| Review F9: nested complementary landmark | Resolved. All-severity axe scans are clear. |
| Review F10: no privacy request path | Resolved. Privacy links the public product repository; the live link returned 200. |
| 85% field outcome has no user study | Still unmeasured, but not a public deterministic product claim. It requires post-release rider evidence. |

## Evidence

- `/work/.evidence/verification-4-live-desktop-first.png`
- `/work/.evidence/verification-4-live-phone-first.png`
- `/work/.evidence/verification-4-live-desktop-demo.png`
- `/work/.evidence/verification-4-live-browser.json`
- `/work/.evidence/verification-4-live-flows.json`
- `/work/.evidence/verification-4-live-offline.json`
- `/work/.evidence/verification-4-live-update.json`
- `/work/.evidence/verification-4-live-axe.json`
- `/work/.evidence/verification-4-verify-url/verify.json`
- `/work/.evidence/verification-4-claims/`

**Final verdict: PASS — zero findings and zero untested public claims.**
