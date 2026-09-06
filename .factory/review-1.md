# Route planning with locked roads — review 1

**Verdict: FAIL**

- Review date: 2026-09-06 UTC
- Live URL: `https://route-intent-planner.sociobot.in`
- Implementation candidate reviewed: `5e1765d8d0cf1e6601a7b8424de905d27256763d`
- Documentation baseline reviewed: `7e8877f5c42a314b44f38e92ab3bd843b57d3937`
- Findings: **10** (4 P1, 6 P2)
- Untested public claims: **14**

The product does not pass. Its core route planner works, but the required sample sandbox, first-screen explanation, claim registry, 404 route, and several required public-site paths are missing or wrong. One README privacy claim is false.

## Job, audience, and first action before scrolling

The job is to plan a cycling route while keeping chosen roads and paths fixed and routing only gaps. The audience is cyclists and ride leaders who already know the route they want. The required first action is `Try it with sample data`.

Neither fresh first screen states all three. The headline is `Keep the line you chose`, the audience is not named, and there is no action in the first viewport. `Load sample` starts around 1,212 CSS px on a 1440×900 desktop and 1,557 CSS px on a 390×844 phone.

## Findings

### F1 — P1 — The sample is not an isolated demo and replaces real draft data

`/demo` serves the ordinary home app. There is no `?demo=1` behavior and no `.factory/demo.md`. The first sample action is labelled `Load sample`, not `Try it with sample data`, and it is below the first screen.

In a fresh desktop context, I put `REAL-DRAFT-SENTINEL` in the real `route-intent-planner:current` key, then selected `Load sample`. The same key was replaced with `Canal loop — sample`. Reload kept the sample and removed the in-memory undo path. The page had zero matches for the persistent `Demo — sample data, nothing is saved` label, `Reset demo`, and `Start for real`.

The sample content itself is useful: it loads nine points, eight segments, `Canal towpath`, and `Check river crossing`. The failure is isolation and entry, not sample realism.

### F2 — P1 — The first screen does not name the job, audience, or action in plain words

The headline does not say route planning or cycling. The lede explains mechanics but does not name cyclists or ride leaders. No primary action is visible before scrolling on desktop or phone.

Copy also breaks the no-metaphor rule. Examples include `A route tape, not a reroute machine`, `Your line is the master tape`, `Take the whole box with you`, `Keep an unlimited shelf`, `Privacy stays on your side`, and `Plan deliberately. Ride responsibly.` The required `.factory/copy-audit.md` is absent.

### F3 — P1 — Fourteen public claims have no required claim entries or claim tests

`.factory/claims.json` does not exist and the repository contains no `@claim:` test tags. Therefore there are no declared claim commands to run. Existing general tests cover some outcomes, but they do not provide the required one-entry/one-tag traceability.

The 14 untested claim groups are:

1. locked coordinates and corridors remain unchanged;
2. only explicitly opened gaps are optimized;
3. only gap endpoints are sent to the bicycle router;
4. GPX import works in the browser;
5. standard GPX export remains free;
6. checks, warnings, undo, and redo work;
7. the current draft survives refresh;
8. the free archive stores three routes in IndexedDB;
9. drafting, import, editing, saving, and export work offline after installation;
10. cached optimized gaps remain exportable offline;
11. there are no automatic analytics, advertising, map, tile, or other off-origin requests;
12. the US$9 one-time license enables unlimited saves and JSON backup/restore;
13. browser data remains local and can be deleted as described; and
14. no account, runtime font, or map tile is required.

### F4 — P1 — The README makes a false route-coordinate privacy claim

README line 19 says there are no `route-coordinate uploads`. README lines 14 and 39, the privacy page, and observed live behavior show that selecting `Optimize gaps` sends both endpoint coordinates to `routing.openstreetmap.de`. The request URL visibly contained `-0.072,51.548;-0.104,51.554`.

The UI disclosure that only open-gap endpoints are sent is accurate. The categorical README statement is not.

### F5 — P2 — Unknown routes return the planner with HTTP 200 instead of a designed 404

`/this-route-does-not-exist` returned HTTP 200 and byte-identical home HTML, with the home title and heading. There is no designed 404 page, way back, or `responseOverrides` 404 rule. This is an unexpected successful home response, not the acceptable deliberate 404. By contrast, the retired `/manifest.webmanifest` deliberately returns HTTP 404 and is correct.

### F6 — P2 — Required site structure and metadata are incomplete

The home header has no navigation. There is no `How it works` three-step section. The footer omits `Built by Param Factory` and a build/version id. The pages have no Open Graph metadata, Twitter card metadata, Apple touch icon link, or product social image. The sitemap cannot list the required demo route because that route is not implemented.

`/demo` also keeps the home title instead of `Demo — Route Intent Planner`. Privacy and Terms have route-specific titles, but their headings use mood copy rather than headings that name the page's task.

### F7 — P2 — The installed-app `New route tape` shortcut does not create a new route

The manifest advertises `New route tape` at `/?new=1`, but the app never reads that parameter. After loading the nine-point sample, opening `/?new=1` still showed `Canal loop — sample` with nine points.

### F8 — P2 — A network failure during gap routing produces an unactionable error

When the router request was aborted after the browser was online, the draft correctly stayed at nine points, but the user message was only `Failed to fetch`. It does not say what failed or what to do. HTTP error responses use a better message; the transport-error recovery path does not.

### F9 — P2 — The planner has a moderate landmark violation

Fresh axe-core 4.10.2 scans on desktop and phone reported `landmark-complementary-is-top-level` for `<aside class="ledger">`. The complementary landmark is inside `<main>`. Legal pages had no axe violations, and the planner had no serious or critical violations.

### F10 — P2 — The privacy page offers no usable privacy-request path

The page says questions can be raised through the product repository, but it provides no repository link, email address, or request form. Its only links are the planner and Terms. A person cannot use the page to make the stated request.

## Core behavior and quality evidence

- `npm ci`: passed; 61 packages installed, 0 vulnerabilities.
- `npm test`: passed, 14/14.
- `npm run build`: passed and produced `dist/index.html`; JS is 28.39 KB raw/10.21 KB gzip and CSS is 16.07 KB raw/4.26 KB gzip.
- `npm run test:e2e`: passed, 20/20 across desktop and 390×844 projects.
- `/opt/fleet/lib/verify-url.sh`: passed the live home route with no load or console errors.
- Playwright axe integration: Privacy and Terms passed; the planner reported the one moderate finding above. The standalone axe CLI could not start because this worker has no `chromedriver`; the repository's documented and installed Playwright axe integration was run instead.
- Fresh live Lighthouse: Performance 97, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.8 s, TBT 190 ms, CLS 0.
- Fresh live desktop and phone valid flows had no console or page errors, no horizontal overflow, a visible keyboard skip link, and no interactive target smaller than 44×44 CSS px in the populated phone flow.
- Reduced-motion media matched; button transitions became 0.00001 s and smooth scrolling was disabled.
- Fresh sample/check use made no off-origin request. The real live `Optimize gaps` action made the disclosed router request, succeeded, kept nine authored points, and exported `canal-loop-sample.gpx` with 200 track points and `5:gap:Check river crossing` metadata.
- Invalid, absent, blank, non-numeric, and WGS84-boundary GPX cases passed the unit/browser suite. Malformed archive recovery passed. A live router transport failure kept the draft intact, although its message caused F8.
- Offline reload displayed the full planner and `Offline — local tools ready`. Registering a cache-busted worker produced the visible `An offline update is ready` toast.
- Home, Privacy, Terms, robots, sitemap, manifest, service worker, offline page, and the OpenStreetMap licensing link returned HTTP 200. Privacy and Terms had one `h1`, one `main`, `lang=en`, and distinct titles.
- Live CSP, Permissions-Policy, HSTS, referrer policy, frame denial, and MIME-sniffing protection are present. Hashed assets are immutable; the worker is no-store and the manifest is no-cache.
- This is a static PWA with browser-local state. Backend tenant isolation, server restart persistence, product health, and product 429/`Retry-After` checks do not apply. The external public bicycle router is not this product's backend.

## Earlier finding disposition

| Earlier finding | Current disposition | Evidence |
| --- | --- | --- |
| Out-of-range GPX accepted | Resolved | WGS84 unit/browser coverage passes. |
| Malformed archive could poison reload | Resolved | Full-schema rejection and bad-record cleanup tests pass. |
| Lighthouse below gate | Resolved | Fresh live run is 97 Performance, LCP 1.8 s, TBT 190 ms, CLS 0. |
| Hashed assets not immutable | Resolved | Live app asset is `max-age=31536000, immutable`. |
| CSP, Permissions-Policy, and manifest MIME absent | Resolved | Headers are live; linked manifest returns JSON with no-cache. |
| Open gaps were not routed | Resolved | Live router success plus mocked exact-endpoint export coverage pass. |
| Missing GPX attributes became `(0,0)` | Resolved | Missing, blank, and non-numeric coordinate tests pass. |
| Dead pilot checkout was advertised | Resolved for current release | No buy link is shown; the page and Terms plainly say purchases are not open. |
| File upload focus was invisible | Resolved | Both file controls receive the designed 3 px `:focus-within` outline. |
| Mobile targets were below 44 px | Resolved | Existing exact regression tests and fresh populated-phone measurement pass. |
| Legal pages linked the retired manifest | Resolved | Both link `/manifest.json`; the retired path deliberately returns 404. |
| 85% post-export correction target lacked field evidence | Still unmeasured, not a public deterministic claim | No field study exists. The route-integrity invariant passes, but the brief's outcome measure still needs real users. |
| Prior axe report checked only serious/critical issues | Incomplete | Fresh all-severity scan found F9. |

## Candidate and live identity

The latest implementation commit is `5e1765d8d0cf1e6601a7b8424de905d27256763d`. Commits through the reviewed checkout `7e8877f5c42a314b44f38e92ab3bd843b57d3937` only add reports after that implementation.

Fresh local production output matched the live site byte for byte for home, Privacy, Terms, all three referenced JS/CSS assets, service worker, manifest, offline page, hero artwork, and all three icons. Later report-only commits do not require a new product image.

## Evidence files

- `/work/.evidence/live-desktop-first-screen.png`
- `/work/.evidence/live-phone-first-screen.png`
- `/work/.evidence/live-desktop-sample.png`
- `/work/.evidence/lighthouse-live.json`
- `/work/.evidence/verify-url/`

**Final verdict: FAIL — 10 findings and 14 untested public claims.**
