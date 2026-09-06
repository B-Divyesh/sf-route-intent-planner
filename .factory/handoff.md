# Route Intent Planner — verification 4 handoff

## Result

**PASS** on 6 September 2026 UTC: zero findings and zero untested public claims.

- Live URL: <https://route-intent-planner.sociobot.in/>
- Reviewed implementation: `5cfeb84dbf3ebeaf16ead4a62bd79abcf9146cbb`
- Verification documentation: `cfae119c46a346e323a646552190b9cc13cbabe6`
- This verification report: `.factory/verification-4.md`

## What was verified

- Fresh desktop and phone live browsers showed the route-planning job, cyclist/ride-leader audience, and **Try it with sample data** before scrolling.
- The isolated demo loaded the nine-point London loop with a persistent sample label. Reset restored the sample, and leaving the demo kept a real-data sentinel unchanged.
- A live explicit Optimize gaps request routed only the selected endpoints and preserved authored anchors in the exported GPX. Invalid GPX rejected cleanly and a valid boundary import recovered immediately.
- Every one of the 15 claim commands in `.factory/claims.json` passed independently from a clean installation.
- `npm test` passed 14/14, `npm run build` produced `dist/`, and `npm run test:e2e` passed 58/58.
- Live offline reload, update notification, keyboard/focus, reduced motion, mobile layout, axe scans, privacy/network behavior, links, legal pages, titles, PWA assets, headers, and designed HTTP 404 all passed.
- Local production files byte-match the live deployment. No product code was changed during verification.

## Run and verify

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Run every exact command in `.factory/claims.json` for claim-level evidence. The evidence logs are in `/work/.evidence/verification-4-claims/` for this worker.

## Remaining work

- Sociobot billing registration is still required before sales open. Checkout stays intentionally hidden; the free planner and standard GPX export are complete.
- The 85% no-post-export-correction result needs evidence from real ride leaders after release. It is not a public deterministic claim.

The product remains a static, local-first PWA. Backend tenant isolation, restart persistence, health endpoint, SQLite, and 429/Retry-After checks do not apply.
