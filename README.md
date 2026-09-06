# Route Intent Planner

Plan cycling routes while keeping chosen roads and paths fixed. Route only the gaps you mark, then export standard GPX.

It is for cyclists and ride leaders who already know the route they want. It is not turn-by-turn navigation.

Live product: <https://route-intent-planner.sociobot.in>

One-click sample: <https://route-intent-planner.sociobot.in/demo/>

## What it does

- Draw a route, enter exact coordinates, or import GPX in the browser.
- Mark each segment as locked, open, or flagged.
- Send only selected gap endpoints to the public OpenStreetMap bicycle router.
- Keep authored points and locked segments unchanged during gap routing.
- Check warnings, undo changes, redo changes, and export GPX for free.
- Restore the current draft after refresh and store three free routes in IndexedDB.
- Draft, import, edit, save, and export offline after one connected visit.
- Export cached routed gaps while offline.

The core planner needs no account, runtime font, or map tile. It makes no automatic analytics, advertising, or off-origin request.

Routes stay in browser storage. Selecting **Optimize gaps** sends that open gap’s two endpoints to `routing.openstreetmap.de`.

## Try the separate demo

Open `/demo/` or select **Try it with sample data** on the first screen. The demo loads a nine-point London canal loop.

Demo data uses `demo:` storage keys and a separate demo IndexedDB database. It never reads or changes real route data.

Use **Reset demo** to restore the sample. Use **Start for real** to clear demo data and return to the real planner.

## Optional Route Archive license

The planned offer is US$9 once. A valid license enables more than three saved routes plus JSON archive backup and restore.

Sales are not open because the Sociobot billing product still needs registration. The product does not show a broken checkout link.

GPX import, GPX export, route warnings, and offline drafting remain free.

## Run and verify

Node.js 20 or newer is required.

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

`npm test` runs route model, validation, and production-policy checks. `npm run test:e2e` builds and serves `dist/` before browser checks.

Every public product claim has one tagged browser test in [`.factory/claims.json`](.factory/claims.json). Run any listed command exactly as written.

For a local production preview:

```sh
npm run build
npm run preview
```

The preview is available at `http://127.0.0.1:4173`.

## Data, privacy, and billing

Current drafts use localStorage. Saved routes use IndexedDB. Imports and exports run in the browser.

Gap routing happens only after **Optimize gaps**. The request contains the selected gap’s endpoints.

License verification uses the Sociobot billing API. Public builds default to `https://api.sociobot.in`.

Factory staging can use the pilot API without source changes:

```sh
VITE_BILLING_API=https://pilot-api.sociobot.in VITE_BILLING_ENABLED=true npm run build
```

See [Privacy](privacy/index.html), [Terms](terms/index.html), [demo notes](.factory/demo.md), and [design notes](.factory/design.md).

## Deploy

Run `npm run build` and deploy `dist/` as the static site root. Do not deploy source files.

`staticwebapp.config.json` defines response headers, cache rules, and the 404 rewrite. `_headers` contains the portable header policy.

## License

The code is MIT licensed. Generated artwork provenance is recorded in [`.factory/design.md`](.factory/design.md).
