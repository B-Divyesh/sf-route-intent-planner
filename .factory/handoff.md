# Route Intent Planner — build handoff

## Independent verification — 2026-08-28

**FAIL for candidate `2bc759652ddad4b14aacba53d10c46502c50bbec` at `https://route-intent-planner.sociobot.in/`.** The live HTML and tested static asset hashes exactly match this candidate; this is not a stale/deployment-mismatch result.

Release blockers found independently:

- P1: GPX coordinates outside WGS84 bounds (for example 91, 181) are accepted and exportable rather than rejected.
- P1: a structurally malformed but syntactically valid paid JSON archive can be persisted and then causes an unrecoverable app render failure after reload (`e.replace is not a function`).
- P2: fresh local mobile Lighthouse is Performance 86 / TBT 510 ms, below the required >=90 / <200 ms gate.
- P2: live content-hashed `/assets/*` resources are served with `max-age=30`, not immutable caching.
- P3: live responses lack CSP and Permissions-Policy; the manifest has an octet-stream MIME type.

All clean install/unit/build/e2e, valid core route flows, desktop/390px layout, independent axe scans, keyboard focus/reduced motion, offline reload, service-worker update toast, privacy/no-outbound-request checks, and candidate/live hash comparisons are recorded in [`.factory/verification.md`](verification.md). Do not release until the P1/P2 findings are resolved and independently reverified.

Work order: `route-intent-planner-build-1`
Completed: 2026-08-28

## What shipped

- A production Vite + vanilla TypeScript PWA with a product-specific cassette-era route-zine interface.
- A schematic, tile-free route drafting sheet supporting tap/click placement, exact keyboard coordinate entry, and GPX track/route import. Imports preserve every point exactly up to the clearly reported 2,000-point v1 limit; oversized files fail with an actionable message rather than being silently simplified.
- A segment intent ledger with per-section names and explicit `locked`, `open gap`, and `flagged` states. Locked points are never altered. Open gaps use clearly labelled straight advisory connectors; automated review also flags long locked jumps.
- Immediate distance/review summaries, route checking, undo/redo, remove-last, sample route, current-draft recovery, and standard GPX 1.1 export with the intent ledger embedded in metadata.
- IndexedDB route storage (three saved tapes on the free tier), delete confirmation, and paid JSON archive export/import.
- One-time US$9 Route Tape unlock through the Sociobot billing contract: pilot checkout/verify base by default, query-token capture, safe URL cleanup, local token/verdict caching, once-daily background verification, optimistic cached unlock, and paste-to-restore. Build with `VITE_BILLING_API=https://api.sociobot.in` for production. No product-provider ID is hardcoded.
- Installable PWA manifest with 192/512/maskable icons, versioned app-shell cache, generated-build asset discovery, navigation fallback, cache-first same-origin assets, network-first navigation, and an in-app update prompt. Drafting, import/export, archives, and analysis work offline after one connected visit.
- Privacy and terms pages, advisory-routing language, no analytics, no external fonts/scripts/tiles, robots/sitemap/canonical metadata, MIT license, and full run/deploy documentation.
- Original generated cassette-route hero at `public/art/route-tape-hero.webp` (140 KB). Source PNG and exact factory prompt are under `assets/src/`; provenance, visual tokens, review criteria, and motion policy are recorded in `.factory/design.md`.

## Verification

- `npm test`: 4/4 model and GPX export tests passed.
- `npm run build`: passed; reproducible output at `dist/index.html` with privacy and terms subpages.
- `npm run test:e2e`: 8/8 passed with Playwright 1.58.2 across desktop Chromium and a 390×844 mobile Chromium viewport.
  - Exact coordinate entry, namespaced GPX import, intent check, and GPX download passed.
  - Home, privacy, and terms have no serious or critical axe violations; contrast checks were enabled.
  - Installed app shell reloaded with the browser explicitly offline on both viewports.
- Console/page-error smoke test: zero errors at 1440×1000 and 390×844; no horizontal overflow; exactly one visible `h1`.
- Lighthouse mobile (local production preview, Lighthouse latest, headless Chrome 145): Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 2.0 s, CLS 0, total blocking time 0 ms, transferred size 174 KiB.
- Production bundles: initial app JS 22.4 KB, CSS 15.3 KB, hero WebP 139.3 KB. These are below the 200 KB / 50 KB / 300 KB budgets; there is no font payload.
- Reduced-motion behavior is implemented; all controls meet the 44 px target baseline and have a 3 px designed focus ring.

## Known gaps and honest boundaries

- This offline v1 intentionally does not bundle a road graph or fetch proprietary/public map tiles. “Open gap” optimization is a straight geodesic advisory connector between user-authored endpoints, not road snapping. The interface states this beside the map and in the terms. A future opt-in, cached OpenStreetMap-compatible graph could route only those gaps without changing locked coordinates.
- The schematic canvas does not show road names or current closures. Segment names are user-authored; riders must verify access, conditions, and surfaces independently.
- GPX files above 2,000 points are rejected with a clear simplification instruction to protect browser responsiveness and avoid silent data loss.
- The pilot Sociobot endpoint remains the build default as required for staging. Release automation must set `VITE_BILLING_API=https://api.sociobot.in` after the factory registers the live product.

## Suggested next steps

1. Register the live one-time product and switch the billing base during release.
2. Validate hosted cache headers (`/assets/*` immutable; `sw.js` short-lived) after deployment.
3. If field evidence demands road-aware gaps, add an opt-in offline graph pack with OpenStreetMap attribution and strict locked-coordinate invariants.
