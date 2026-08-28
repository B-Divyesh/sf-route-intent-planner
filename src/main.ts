import './styles.css';
import { addPoint, analyze, emptyDraft, parseGpx, sampleDraft, toGpx } from './route';
import { deleteRoute, importBackup, listRoutes, saveRoute } from './storage';
import { cachedUnlock, captureLicense, checkoutUrl, storeLicense, verifyLicense } from './license';
import type { RouteDraft, SegmentMode } from './types';

const CURRENT_KEY = 'route-intent-planner:current';
const app = document.querySelector<HTMLDivElement>('#app')!;
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!);
const clone = (draft: RouteDraft) => structuredClone(draft);

function restoredDraft(): RouteDraft {
  try {
    const value = JSON.parse(localStorage.getItem(CURRENT_KEY) || 'null') as RouteDraft | null;
    return value?.points && value?.segments ? value : emptyDraft();
  } catch { return emptyDraft(); }
}

let draft = restoredDraft();
let undoStack: RouteDraft[] = [];
let redoStack: RouteDraft[] = [];
let savedRoutes: RouteDraft[] = [];
let token = captureLicense();
let unlocked = cachedUnlock(token);
let status = draft.points.length ? 'Draft restored from this device.' : 'Start by tapping the drafting sheet, importing GPX, or loading the sample.';
let error = '';
let analysisVisible = false;

function commit(next: RouteDraft, message: string): void {
  undoStack.push(clone(draft));
  if (undoStack.length > 40) undoStack.shift();
  redoStack = [];
  draft = next;
  localStorage.setItem(CURRENT_KEY, JSON.stringify(draft));
  status = message;
  error = '';
  render();
}

function pointBounds() {
  if (!draft.points.length) return { minLat: 51.48, maxLat: 51.58, minLon: -0.18, maxLon: -0.02 };
  const lats = draft.points.map((point) => point.lat);
  const lons = draft.points.map((point) => point.lon);
  const minLat = Math.min(...lats); const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons); const maxLon = Math.max(...lons);
  const latPad = Math.max((maxLat - minLat) * .12, .003);
  const lonPad = Math.max((maxLon - minLon) * .12, .003);
  return { minLat: minLat - latPad, maxLat: maxLat + latPad, minLon: minLon - lonPad, maxLon: maxLon + lonPad };
}

function xy(lat: number, lon: number): [number, number] {
  const bounds = pointBounds();
  return [40 + ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 640, 440 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 400];
}

function mapMarkup(): string {
  const points = new Map(draft.points.map((point) => [point.id, point]));
  const lines = draft.segments.map((segment, index) => {
    const from = points.get(segment.fromId)!; const to = points.get(segment.toId)!;
    const [x1, y1] = xy(from.lat, from.lon); const [x2, y2] = xy(to.lat, to.lon);
    return `<g class="route-line route-line--${segment.mode}">
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" vector-effect="non-scaling-stroke" />
      <text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 9}" aria-hidden="true">${index + 1}</text>
    </g>`;
  }).join('');
  const marks = draft.points.map((point, index) => {
    const [x, y] = xy(point.lat, point.lon);
    return `<g class="route-point"><circle cx="${x}" cy="${y}" r="9" vector-effect="non-scaling-stroke"/><text x="${x}" y="${y + 4}" text-anchor="middle">${index + 1}</text></g>`;
  }).join('');
  const empty = draft.points.length ? '' : `<g class="empty-map" aria-hidden="true"><path d="M175 310 C240 180 335 360 430 220 S570 250 610 150"/><circle cx="175" cy="310" r="10"/><circle cx="610" cy="150" r="10"/><text x="360" y="390" text-anchor="middle">TAP TO PIN YOUR FIRST POINT</text></g>`;
  return `${empty}${lines}${marks}`;
}

function segmentMarkup(): string {
  if (!draft.segments.length) return `<li class="empty-ledger"><span class="stamp">NO TAPE YET</span><p>Add at least two points. Each connection becomes an independently locked or open segment.</p></li>`;
  const results = new Map(analyze(draft).map((item) => [item.segmentId, item]));
  return draft.segments.map((segment, index) => {
    const result = results.get(segment.id)!;
    return `<li class="segment-row segment-row--${segment.mode}" data-segment="${segment.id}">
      <div class="segment-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</div>
      <div class="segment-main">
        <label for="segment-name-${segment.id}">Segment ${index + 1} name</label>
        <input id="segment-name-${segment.id}" class="segment-name" value="${escapeHtml(segment.name)}" placeholder="e.g. Old Mill Lane" />
        <div class="mode-switch" role="group" aria-label="Segment ${index + 1} intent">
          ${(['locked', 'gap', 'flagged'] as SegmentMode[]).map((mode) => `<button class="mode-button" data-mode="${mode}" aria-pressed="${segment.mode === mode}">${mode === 'locked' ? 'Lock' : mode === 'gap' ? 'Open gap' : 'Flag'}</button>`).join('')}
        </div>
        ${analysisVisible ? `<p class="segment-result ${result.severity === 'review' ? 'segment-result--review' : ''}"><strong>${result.distanceKm.toFixed(2)} km.</strong> ${result.reason}</p>` : ''}
      </div>
    </li>`;
  }).join('');
}

function summaryMarkup(): string {
  const results = analyze(draft);
  const distance = results.reduce((sum, item) => sum + item.distanceKm, 0);
  const reviews = results.filter((item) => item.severity === 'review').length;
  return `<div class="route-stats" aria-label="Route summary">
    <div><strong>${draft.points.length}</strong><span>points</span></div>
    <div><strong>${distance.toFixed(1)}</strong><span>km traced</span></div>
    <div><strong>${draft.segments.filter((segment) => segment.mode === 'locked').length}</strong><span>locked</span></div>
    <div class="${reviews ? 'stat-review' : ''}"><strong>${reviews}</strong><span>to review</span></div>
  </div>`;
}

function savedMarkup(): string {
  if (!savedRoutes.length) return '<p class="muted">No saved route tapes yet. Your current draft still survives refreshes.</p>';
  return `<ul class="saved-list">${savedRoutes.map((route) => `<li><button class="saved-open" data-open="${route.id}"><strong>${escapeHtml(route.name)}</strong><span>${route.points.length} points · ${new Date(route.updatedAt).toLocaleDateString()}</span></button><button class="icon-button saved-delete" data-delete="${route.id}" aria-label="Delete ${escapeHtml(route.name)}">×</button></li>`).join('')}</ul>`;
}

function render(): void {
  app.innerHTML = `
    <header class="site-header">
      <a class="wordmark" href="/" aria-label="Route Intent Planner home"><span>RIP</span><span>Route intent planner</span></a>
      <div class="network-badge" aria-live="polite"><span class="network-dot"></span>${navigator.onLine ? 'Online' : 'Offline — local tools ready'}</div>
    </header>
    <main id="main">
      <section class="hero" aria-labelledby="page-title">
        <div class="hero-copy">
          <p class="eyebrow">A route tape, not a reroute machine</p>
          <h1 id="page-title">Keep the line<br><em>you</em> chose.</h1>
          <p class="lede">Pin a rough ride, lock the roads and paths that matter, and leave only the gaps open. Every deviation stays visible before GPX export.</p>
          <div class="hero-notes"><span>Works offline</span><span>No map account</span><span>GPX stays yours</span></div>
        </div>
        <figure class="hero-art">
          <img src="/art/route-tape-hero.webp" width="720" height="720" alt="Risograph collage of a cassette whose magnetic tape forms a deliberate route with waypoint markers" fetchpriority="high" />
          <figcaption>Your line is the master tape.</figcaption>
        </figure>
      </section>

      <section class="planner" aria-labelledby="planner-title">
        <div class="section-kicker"><span>01</span><h2 id="planner-title">Draft the route tape</h2><p>Local draft</p></div>
        <div class="project-strip">
          <label for="route-name">Route name</label>
          <input id="route-name" value="${escapeHtml(draft.name)}" maxlength="80" />
          <button id="new-route" class="text-button">New route</button>
        </div>
        <div class="tool-strip" aria-label="Route tools">
          <label class="button button--dark file-button" for="gpx-input">Import GPX<input id="gpx-input" type="file" accept=".gpx,application/gpx+xml,application/xml,text/xml" /></label>
          <button id="sample" class="button">Load sample</button>
          <button id="undo" class="button button--quiet" ${undoStack.length ? '' : 'disabled'}>Undo</button>
          <button id="redo" class="button button--quiet" ${redoStack.length ? '' : 'disabled'}>Redo</button>
          <button id="remove-last" class="button button--quiet" ${draft.points.length ? '' : 'disabled'}>Remove last</button>
        </div>
        <div class="workspace">
          <div class="drafting-panel">
            <div class="map-heading"><p><strong>Drafting sheet</strong><span>Tap anywhere to add a point</span></p><span class="map-scale">SCHEMATIC / WGS84</span></div>
            <svg id="route-map" class="route-map" viewBox="0 0 720 480" role="img" aria-label="Schematic route drafting sheet. Use the coordinate form below for a keyboard-accessible way to add points.">
              <defs><pattern id="minor-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" /></pattern><pattern id="major-grid" width="120" height="120" patternUnits="userSpaceOnUse"><rect width="120" height="120" fill="url(#minor-grid)"/><path d="M 120 0 L 0 0 0 120" /></pattern></defs>
              <rect width="720" height="480" class="map-paper"/><rect width="720" height="480" fill="url(#major-grid)" class="map-grid"/>${mapMarkup()}
            </svg>
            <form id="coordinate-form" class="coordinate-form">
              <div><label for="lat">Latitude</label><input id="lat" name="lat" inputmode="decimal" type="number" min="-90" max="90" step="any" required /></div>
              <div><label for="lon">Longitude</label><input id="lon" name="lon" inputmode="decimal" type="number" min="-180" max="180" step="any" required /></div>
              <button class="button" type="submit">Add coordinate</button>
            </form>
            <p class="map-disclaimer">No basemap or hidden road optimizer: this offline sheet preserves your coordinates exactly. Open gaps are straight advisory connectors; verify them against current road access before riding.</p>
          </div>
          <aside class="ledger" aria-labelledby="ledger-title">
            <div class="ledger-heading"><div><span>INSPECTION LEDGER</span><h3 id="ledger-title">What must stay?</h3></div><button id="analyze" class="button button--signal">${analysisVisible ? 'Refresh check' : 'Check route'}</button></div>
            ${summaryMarkup()}
            <ul class="segment-list">${segmentMarkup()}</ul>
          </aside>
        </div>
        <div class="action-deck">
          <div><p class="action-label">MASTER OUTPUT</p><h3>Preserve, then export.</h3><p>Locked sections and their labels are written into the GPX metadata. Review warnings stay free.</p></div>
          <div class="action-buttons"><button id="save" class="button">Save on device</button><button id="export-gpx" class="button button--dark" ${draft.points.length >= 2 ? '' : 'disabled'}>Export GPX</button></div>
        </div>
        <div id="message" class="message ${error ? 'message--error' : ''}" role="status" aria-live="polite">${escapeHtml(error || status)}</div>
      </section>

      <section class="library" aria-labelledby="library-title">
        <div class="section-kicker"><span>02</span><h2 id="library-title">Route tape archive</h2><p>This device only</p></div>
        <div class="library-grid"><div><h3>Saved locally</h3><div id="saved-routes">${savedMarkup()}</div></div><div class="ownership"><p class="stamp">YOUR DATA / YOUR DEVICE</p><h3>Take the whole box with you.</h3><p>Free GPX export always works. Route Tape owners can move the complete local archive between browsers as JSON.</p><div class="ownership-actions"><button id="backup" class="button" ${unlocked ? '' : 'disabled'}>Export archive</button><label class="button button--quiet file-button ${unlocked ? '' : 'is-disabled'}" for="backup-input">Import archive<input id="backup-input" type="file" accept="application/json" ${unlocked ? '' : 'disabled'} /></label></div></div></div>
      </section>

      <section class="unlock" aria-labelledby="unlock-title">
        <div class="unlock-label">ONE-TIME ROUTE TAPE</div>
        <div><h2 id="unlock-title">Keep an unlimited shelf.</h2><p>US$9 once. Save more than three route tapes and back up or restore the complete archive. GPX import/export, safety warnings, and offline drafting stay free.</p><p class="merchant">Sociobot/Dodo is the merchant of record. Refunds are handled there and revoke the license.</p></div>
        <div class="license-box">
          ${unlocked ? '<p class="unlocked-mark">✓ Route Tape unlocked on this device</p>' : `<a class="button button--signal buy-link" href="${checkoutUrl()}">Buy Route Tape — $9</a><label for="license-token">Have a license? Paste it</label><div><input id="license-token" autocomplete="off" spellcheck="false" /><button id="restore-license" class="button">Verify</button></div>`}
          <p><a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></p>
        </div>
      </section>
    </main>
    <footer><p><strong>Route Intent Planner</strong> is an advisory planning sheet, not turn-by-turn navigation. Check closures, surfaces, and access locally.</p><p>Original generated cassette artwork; provenance in the project design notes. No tracking or third-party tiles.</p><nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="https://www.openstreetmap.org/copyright" rel="external">OpenStreetMap licensing</a></nav></footer>
    <div id="update-toast" class="update-toast" hidden><span>An offline update is ready.</span><button id="apply-update">Apply update</button></div>`;
  bindEvents();
}

function bindEvents(): void {
  document.querySelector('#route-name')?.addEventListener('change', (event) => commit({ ...draft, name: (event.target as HTMLInputElement).value.trim() || 'Untitled route', updatedAt: new Date().toISOString() }, 'Route renamed.'));
  document.querySelector('#new-route')?.addEventListener('click', () => commit(emptyDraft(), 'New blank route ready.'));
  document.querySelector('#sample')?.addEventListener('click', () => commit(sampleDraft(), 'Sample loaded. Open the inspection ledger to see one intentional gap.'));
  document.querySelector('#undo')?.addEventListener('click', () => { const previous = undoStack.pop(); if (!previous) return; redoStack.push(clone(draft)); draft = previous; localStorage.setItem(CURRENT_KEY, JSON.stringify(draft)); status = 'Last change undone.'; render(); });
  document.querySelector('#redo')?.addEventListener('click', () => { const next = redoStack.pop(); if (!next) return; undoStack.push(clone(draft)); draft = next; localStorage.setItem(CURRENT_KEY, JSON.stringify(draft)); status = 'Change restored.'; render(); });
  document.querySelector('#remove-last')?.addEventListener('click', () => {
    if (!draft.points.length) return;
    commit({ ...draft, points: draft.points.slice(0, -1), segments: draft.segments.slice(0, -1), updatedAt: new Date().toISOString() }, 'Last point removed.');
  });
  document.querySelector('#route-map')?.addEventListener('click', (event) => {
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = Math.max(0, Math.min(720, ((event as MouseEvent).clientX - rect.left) / rect.width * 720));
    const y = Math.max(0, Math.min(480, ((event as MouseEvent).clientY - rect.top) / rect.height * 480));
    const bounds = pointBounds();
    const lon = bounds.minLon + ((x - 40) / 640) * (bounds.maxLon - bounds.minLon);
    const lat = bounds.minLat + ((440 - y) / 400) * (bounds.maxLat - bounds.minLat);
    commit(addPoint(draft, { lat: Math.max(-90, Math.min(90, lat)), lon: Math.max(-180, Math.min(180, lon)) }), `Point ${draft.points.length + 1} pinned and locked.`);
  });
  document.querySelector('#coordinate-form')?.addEventListener('submit', (event) => {
    event.preventDefault(); const data = new FormData(event.currentTarget as HTMLFormElement);
    const lat = Number(data.get('lat')); const lon = Number(data.get('lon'));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    commit(addPoint(draft, { lat, lon }), `Coordinate ${draft.points.length + 1} added and locked.`);
  });
  document.querySelector('#gpx-input')?.addEventListener('change', async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return;
    try { commit(parseGpx(await file.text()), `Imported ${file.name}. Every segment starts locked.`); }
    catch (reason) { error = reason instanceof Error ? reason.message : 'The GPX could not be read.'; render(); }
  });
  document.querySelectorAll<HTMLElement>('[data-segment]').forEach((row) => {
    const segmentId = row.dataset.segment!;
    row.querySelector('.segment-name')?.addEventListener('change', (event) => {
      const segments = draft.segments.map((segment) => segment.id === segmentId ? { ...segment, name: (event.target as HTMLInputElement).value.trim() } : segment);
      commit({ ...draft, segments, updatedAt: new Date().toISOString() }, 'Segment label saved.');
    });
    row.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => button.addEventListener('click', () => {
      const mode = button.dataset.mode as SegmentMode;
      const segments = draft.segments.map((segment) => segment.id === segmentId ? { ...segment, mode } : segment);
      commit({ ...draft, segments, updatedAt: new Date().toISOString() }, mode === 'locked' ? 'Segment locked to your authored line.' : mode === 'gap' ? 'Gap opened for advisory optimization.' : 'Segment flagged for review.');
    }));
  });
  document.querySelector('#analyze')?.addEventListener('click', () => { analysisVisible = true; const count = analyze(draft).filter((item) => item.severity === 'review').length; status = count ? `${count} section${count === 1 ? ' needs' : 's need'} review before the ride.` : 'All sections are locked and within the long-jump check.'; render(); });
  document.querySelector('#export-gpx')?.addEventListener('click', () => download(`${safeName(draft.name)}.gpx`, toGpx(draft), 'application/gpx+xml'));
  document.querySelector('#save')?.addEventListener('click', async () => {
    if (!unlocked && !savedRoutes.some((route) => route.id === draft.id) && savedRoutes.length >= 3) { error = 'The free archive holds three route tapes. Export GPX, replace an old tape, or unlock the unlimited archive.'; render(); return; }
    await saveRoute(draft); savedRoutes = await listRoutes(); status = 'Route tape saved on this device.'; render();
  });
  document.querySelectorAll<HTMLElement>('[data-open]').forEach((button) => button.addEventListener('click', () => { const route = savedRoutes.find((item) => item.id === button.dataset.open); if (route) commit(clone(route), `Opened ${route.name}.`); }));
  document.querySelectorAll<HTMLElement>('[data-delete]').forEach((button) => button.addEventListener('click', async () => { const route = savedRoutes.find((item) => item.id === button.dataset.delete); if (!route || !confirm(`Delete “${route.name}” from this device?`)) return; await deleteRoute(route.id); savedRoutes = await listRoutes(); status = 'Saved route deleted. Your current draft was not changed.'; render(); }));
  document.querySelector('#backup')?.addEventListener('click', () => download('route-intent-archive.json', JSON.stringify({ version: 1, routes: savedRoutes }, null, 2), 'application/json'));
  document.querySelector('#backup-input')?.addEventListener('change', async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return;
    try { const data = JSON.parse(await file.text()) as { routes?: RouteDraft[] }; if (!Array.isArray(data.routes)) throw new Error(); await importBackup(data.routes); savedRoutes = await listRoutes(); status = `${data.routes.length} route tapes imported.`; render(); }
    catch { error = 'That archive is not a Route Intent Planner JSON backup.'; render(); }
  });
  document.querySelector('#restore-license')?.addEventListener('click', async () => {
    const value = (document.querySelector('#license-token') as HTMLInputElement).value.trim(); if (!value) { error = 'Paste your license token first.'; render(); return; }
    storeLicense(value); token = value; status = 'Checking license…'; render();
    try { unlocked = await verifyLicense(value, true); status = unlocked ? 'Route Tape unlocked.' : 'That license is not active for this product.'; if (!unlocked) error = status; render(); }
    catch { error = 'The license service could not be reached. Your free planner still works; try verification again when online.'; render(); }
  });
}

function safeName(name: string): string { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'route'; }
function download(name: string, content: string, type: string): void { const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(new Blob([content], { type })); anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(anchor.href), 1000); status = `${name} exported.`; render(); }

window.addEventListener('online', render);
window.addEventListener('offline', render);

async function start(): Promise<void> {
  try { savedRoutes = await listRoutes(); } catch { error = 'Local archive is unavailable in this browser. GPX import and export still work.'; }
  render();
  if (token && navigator.onLine) {
    try { unlocked = await verifyLicense(token); render(); } catch { /* cached verdict remains; free app never blocks */ }
  }
  registerServiceWorker();
}

async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    let refreshOnControllerChange = false;
    const registration = await navigator.serviceWorker.register('/sw.js');
    const showUpdate = (worker: ServiceWorker) => {
      const toast = document.querySelector<HTMLDivElement>('#update-toast'); if (!toast) return;
      toast.hidden = false;
      toast.querySelector('button')?.addEventListener('click', () => { refreshOnControllerChange = true; worker.postMessage({ type: 'SKIP_WAITING' }); });
    };
    if (registration.waiting) showUpdate(registration.waiting);
    registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', () => { if (registration.waiting && navigator.serviceWorker.controller) showUpdate(registration.waiting); }));
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (refreshOnControllerChange) location.reload(); });
  } catch { /* app remains usable without install support */ }
}

void start();
