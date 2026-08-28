# Route Intent Planner — independent verification 3

**Result: PASS**

- Candidate and tested checkout: `3831402cd99cfa6e340f03592a36421dcacf17a1`
- Live URL: `https://route-intent-planner.sociobot.in/`
- Verified: 2026-08-28 UTC
- Work order: `route-intent-planner-verify-3`

This is a fresh verification from a clean checkout. No product code was changed.

## Quality gates

```text
npm ci             PASS — 61 packages installed; 0 vulnerabilities
npm test           PASS — 14/14 Vitest tests
npm run build      PASS — TypeScript build and Vite production build; dist/ created
npm run test:e2e   PASS — 20/20 Playwright 1.58.2 checks, desktop and 390 × 844 mobile
```

There is no repository lint script. `tsc -b` is part of the exact production build and passed.

## Independent product evidence

- Desktop and 390 px live-browser flows passed: coordinate entry, sample/rough trace, segment names, locks, explicit open gaps, review warnings, GPX download, undo/remove/undo, native WGS84 boundary validation, keyboard skip link, and no horizontal overflow.
- Invalid GPX coordinates (missing, blank, non-numeric, and out-of-WGS84) and invalid archive records are rejected with recoverable errors. A simulated unavailable bicycle router made one request, left the two-point draft unchanged, showed the actionable error, and the segment could immediately be locked again.
- Local Chromium coverage mocks a successful OpenStreetMap-compatible router response and proves only an explicitly opened gap is requested; GPX includes returned interior geometry while preserving exact authored endpoints. No router request occurs merely by opening a gap.
- Data remains local-first (current draft in localStorage; saved routes in IndexedDB); GPX and JSON import/export stay in-browser. Fresh free-planner desktop and mobile sessions made zero automatic off-origin requests. The only runtime coordinate request is the disclosed, user-triggered `Optimize gaps` request to `routing.openstreetmap.de`.
- Live browser console/page errors: 0 on planner, Privacy, and Terms. Privacy and Terms each have a title, `lang=en`, one `h1`, and one `main`.

## Accessibility and responsive checks

- Fresh axe scans found **0 serious or critical findings** on the live planner at desktop and 390 px, Privacy, and Terms.
- The live planner has one `h1`, one `main`, descriptive title, meaningful hero alt text, visible keyboard skip-link focus, and no desktop/mobile horizontal overflow.
- At 390 px the complete primary flow remains available. Checked controls met the 44 px button baseline; file controls receive the designed 3 px `:focus-within` outline when their inputs are focused.
- `prefers-reduced-motion: reduce` is implemented in the stylesheet, changing transitions/animations to near-instant and disabling smooth scrolling.

## PWA and offline evidence

- The live manifest has a versioned start URL, standalone display, matching theme/background colors, 192/512 icons, and a 512 maskable icon.
- After service-worker control, a live offline reload retained the planner, rendered its heading, and displayed `Offline — local tools ready`, with no errors.
- The live worker is versioned (`route-tape-shell-v5`), precaches the shell, claims clients, cleans old caches, and has an offline fallback. A controlled temporary replacement-worker response triggered the in-app `An offline update is ready` toast, establishing the update detection path; its Apply action uses `SKIP_WAITING`.

## Deployment identity, privacy, headers, and performance

- Fresh SHA-256 comparisons matched local candidate `dist/` and live content byte-for-byte for `index.html`, all three referenced JS/CSS assets, `sw.js`, `manifest.json`, hero artwork, all three icons, `offline.html`, Privacy, and Terms.
- Live responses have CSP, Permissions-Policy, HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and strict-origin referrer policy. CSP permits only self plus the disclosed Sociobot APIs and bicycle router for connections.
- Cache policy is correct: hashed assets are `public, max-age=31536000, immutable`; `sw.js` is `no-cache, no-store, must-revalidate`; manifest is `no-cache`; HTML is short revalidation. The retired `/manifest.webmanifest` returns 404 rather than navigation HTML.
- Production bundle audit: app JS 28,389 B raw / 10,210 B gzip plus 711 B module; CSS 16,066 B raw / 4,260 B gzip; hero WebP 139,286 B; no font payload. All supplied static budgets pass.
- Fresh live Lighthouse 13.4.1 mobile: **98 Performance, 100 Accessibility, 100 Best Practices, 100 SEO**; FCP 0.9 s, LCP 1.8 s, TBT 160 ms, CLS 0, transfer 175 KiB.

## Defects by severity

None found in the candidate acceptance scope.

The researched 85% post-export-correction success measure is a user-outcome metric and cannot be proven by pre-release deterministic QA; the route-intent invariant and the contracted gap-only routing behavior were verified instead.
