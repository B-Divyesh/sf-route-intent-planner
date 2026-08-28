# Route Intent Planner

Route Intent Planner is a local-first drafting sheet for cyclists and ride leaders who already know the roads or paths they want. Draw or import a rough GPX, label and lock mandatory corridors, leave only intentional gaps open, inspect off-intent warnings, and export standard GPX without a routing engine silently replacing the route.

Live target: <https://route-intent-planner.sociobot.in>.

## Who it is for

Ride leaders preparing club routes, cyclists recreating a known course, and anyone who values declared route intent over opaque profile optimization. It is advisory planning—not turn-by-turn navigation—and deliberately does not claim to know current closures, legal access, or surface conditions.

## What v1 includes

- Click/tap drafting sheet, exact coordinate entry, and GPX import.
- Per-segment `locked`, `open gap`, and `flagged` intent with optional road/path names.
- Distance and long-jump checks, explicit warnings, undo/redo, and free GPX export.
- Current-draft recovery and a three-route free archive in IndexedDB.
- Installable PWA shell with offline drafting, import, editing, saving, and export.
- Optional US$9 one-time Route Tape license for unlimited saved routes and JSON archive backup/restore. Checkout and license verification use Sociobot; there is no embedded payment provider.
- No analytics, accounts, runtime fonts, map tiles, or route-coordinate uploads.

## Run and verify

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
npm test
npm run build
npm run test:e2e
```

The exact production build command is `npm run build`. Static output is written to `dist/`, with `dist/index.html` at its root plus `/privacy/` and `/terms/` pages.

`npm test` runs deterministic model/export checks. `npm run test:e2e` builds and serves the production output, then checks the full planning/export path, serious/critical axe findings, the 390px layout, and an offline reload in Chromium.

## Data and billing configuration

Routes remain in browser storage until the user exports or deletes them. The app defaults to the Sociobot pilot billing API during factory staging. Release automation can switch it without source edits:

```sh
VITE_BILLING_API=https://api.sociobot.in npm run build
```

The billing URL uses the product slug, never a provider product ID. See [`privacy/index.html`](privacy/index.html), [`terms/index.html`](terms/index.html), and [`.factory/design.md`](.factory/design.md).

## Deploy

Serve `dist/` as a static site with clean directory-index routes and HTTPS. `dist/staticwebapp.config.json` is the factory Azure Static Web Apps policy; it gives content-hashed `/assets/*` a one-year immutable cache, keeps `sw.js` and the manifest revalidating, serves the manifest as `application/manifest+json`, and adds CSP plus a locked-down Permissions-Policy. `dist/_headers` carries the equivalent policy for portable static hosts.

## License

MIT. Generated product artwork provenance is recorded in `.factory/design.md` and `assets/src/route-tape-hero.json`.
