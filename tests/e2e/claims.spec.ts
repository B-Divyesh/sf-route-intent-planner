import { expect, test, type Browser, type Download, type Page } from '@playwright/test';

const sampleGpx = `<?xml version="1.0"?><gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>Club route import</name><trkseg><trkpt lat="51.500000" lon="-0.100000"/><trkpt lat="51.510000" lon="-0.090000"/></trkseg></trk></gpx>`;

async function downloadText(download: Download): Promise<string> {
  const stream = await download.createReadStream();
  let value = '';
  for await (const chunk of stream!) value += chunk.toString();
  return value;
}

async function waitForWorker(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
    }
  });
}

async function addTwoPointRoute(page: Page, name: string, offset: number): Promise<void> {
  await page.getByRole('button', { name: 'New route' }).click();
  await page.locator('#route-name').fill(name);
  await page.locator('#route-name').press('Tab');
  for (const [lat, lon] of [[51.5 + offset, -0.1], [51.51 + offset, -0.09]]) {
    await page.getByLabel('Latitude').fill(String(lat));
    await page.getByLabel('Longitude').fill(String(lon));
    await page.getByLabel('Longitude').press('Enter');
  }
}

test('@claim:locked-intent keeps every authored point unchanged when an open gap is routed', async ({ page }) => {
  await page.route('https://routing.openstreetmap.de/**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ code: 'Ok', routes: [{ geometry: { coordinates: [[-0.072, 51.548], [-0.088, 51.552], [-0.104, 51.554]] } }] }),
  }));
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Optimize gaps' }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export GPX' }).click();
  const gpx = await downloadText(await pending);
  const authored = [
    ['51.507800', '-0.128200'], ['51.513000', '-0.105000'], ['51.518000', '-0.078000'],
    ['51.532000', '-0.055000'], ['51.548000', '-0.072000'], ['51.554000', '-0.104000'],
    ['51.545000', '-0.137000'], ['51.526000', '-0.153000'], ['51.507800', '-0.128200'],
  ];
  let cursor = -1;
  for (const [lat, lon] of authored) {
    const next = gpx.indexOf(`lat="${lat}" lon="${lon}"`, cursor + 1);
    expect(next).toBeGreaterThan(cursor);
    cursor = next;
  }
  expect(gpx).toContain('lat="51.552000" lon="-0.088000"');
});

test('@claim:gaps-only routes only the segment marked as an open gap', async ({ page }) => {
  let requests = 0;
  await page.route('https://routing.openstreetmap.de/**', (route) => {
    requests += 1;
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ code: 'Ok', routes: [{ geometry: { coordinates: [[-0.072, 51.548], [-0.09, 51.551], [-0.104, 51.554]] } }] }) });
  });
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Optimize gaps' }).click();
  await expect(page.locator('#message')).toContainText('1 open gap optimized');
  await page.getByRole('button', { name: 'Check route' }).click();
  await expect(page.locator('.segment-result')).toHaveCount(8);
  await expect(page.locator('.segment-result').filter({ hasText: 'optimized on the OpenStreetMap bicycle network' })).toHaveCount(1);
  expect(requests).toBe(1);
});

test('@claim:gap-endpoints-only sends only the selected gap endpoints to the bicycle router', async ({ page }) => {
  let requestedUrl = '';
  let requestBody: string | null = 'not-set';
  await page.route('https://routing.openstreetmap.de/**', (route) => {
    requestedUrl = decodeURIComponent(route.request().url());
    requestBody = route.request().postData();
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ code: 'Ok', routes: [{ geometry: { coordinates: [[-0.072, 51.548], [-0.09, 51.551], [-0.104, 51.554]] } }] }) });
  });
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Optimize gaps' }).click();
  await expect(page.locator('#message')).toContainText('Locked coordinates were not changed');
  expect(requestedUrl).toContain('/-0.072,51.548;-0.104,51.554?');
  expect(requestBody).toBeNull();
});

test('@claim:gpx-import imports a GPX file entirely in the browser', async ({ page }) => {
  await page.goto('/demo/');
  await page.locator('#gpx-input').setInputFiles({ name: 'club-route.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(sampleGpx) });
  await expect(page.locator('#route-name')).toHaveValue('Club route import');
  await expect(page.locator('.route-stats strong').first()).toHaveText('2');
  await expect(page.locator('#message')).toContainText('Every segment starts locked');
});

test('@claim:gpx-export-free exports standard GPX without a license', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page.getByText('Route Archive purchases are not open yet.')).toBeVisible();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export GPX' }).click();
  const download = await pending;
  const gpx = await downloadText(download);
  expect(download.suggestedFilename()).toBe('canal-loop-sample.gpx');
  expect(gpx).toContain('<gpx version="1.1"');
  expect(gpx.match(/<trkpt/g)).toHaveLength(9);
});

test('@claim:edit-check-history checks warnings and supports undo and redo', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Check route' }).click();
  await expect(page.locator('#message')).toContainText('1 section needs review');
  await page.getByRole('button', { name: 'Flag' }).first().click();
  await expect(page.locator('.segment-row').first()).toHaveClass(/segment-row--flagged/);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.segment-row').first()).toHaveClass(/segment-row--locked/);
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(page.locator('.segment-row').first()).toHaveClass(/segment-row--flagged/);
});

test('@claim:draft-refresh restores the current draft after a reload', async ({ page }) => {
  await page.goto('/demo/');
  await page.locator('#route-name').fill('Refresh proof route');
  await page.locator('#route-name').press('Tab');
  await page.reload();
  await expect(page.locator('#route-name')).toHaveValue('Refresh proof route');
  await expect(page.locator('.route-stats strong').first()).toHaveText('9');
});

test('@claim:free-three-routes stores three free routes and rejects a fourth', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Save on device' }).click();
  for (let index = 2; index <= 3; index += 1) {
    await addTwoPointRoute(page, `Saved route ${index}`, index / 1000);
    await page.getByRole('button', { name: 'Save on device' }).click();
  }
  await expect(page.locator('.saved-list li')).toHaveCount(3);
  await addTwoPointRoute(page, 'Rejected fourth route', 0.004);
  await page.getByRole('button', { name: 'Save on device' }).click();
  await expect(page.locator('#message')).toContainText('free archive holds three routes');
  await expect(page.locator('.saved-list li')).toHaveCount(3);
});

test('@claim:offline-workflow drafts, imports, edits, saves, and exports offline after one visit', async ({ browser }: { browser: Browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto('/demo/');
    await waitForWorker(page);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('Offline — local tools ready')).toBeVisible();
    await page.locator('#gpx-input').setInputFiles({ name: 'offline.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(sampleGpx) });
    await page.locator('.segment-name').fill('Offline segment');
    await page.locator('.segment-name').press('Tab');
    await page.getByRole('button', { name: 'Save on device' }).click();
    await expect(page.locator('.saved-list li')).toHaveCount(1);
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export GPX' }).click();
    expect(await downloadText(await pending)).toContain('Offline segment');
  } finally {
    await context.close();
  }
});

test('@claim:offline-cached-export exports cached routed geometry while offline', async ({ browser }: { browser: Browser }) => {
  const context = await browser.newContext();
  await context.route('https://routing.openstreetmap.de/**', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ code: 'Ok', routes: [{ geometry: { coordinates: [[-0.072, 51.548], [-0.088, 51.552], [-0.104, 51.554]] } }] }) }));
  const page = await context.newPage();
  try {
    await page.goto('/demo/');
    await waitForWorker(page);
    await page.getByRole('button', { name: 'Optimize gaps' }).click();
    await expect(page.locator('#message')).toContainText('1 open gap optimized');
    await context.setOffline(true);
    await page.reload();
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export GPX' }).click();
    expect(await downloadText(await pending)).toContain('lat="51.552000" lon="-0.088000"');
  } finally {
    await context.close();
  }
});

test('@claim:automatic-request-privacy makes no automatic off-origin request during the sample flow', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Check route' }).click();
  await page.getByRole('button', { name: 'Save on device' }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export GPX' }).click();
  await pending;
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every((url) => !url.startsWith('http') || new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true);
});

test('@claim:paid-archive enables a fourth saved route plus JSON backup and restore with a valid license', async ({ page }) => {
  await page.route('https://api.sociobot.in/**', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }) }));
  await page.goto('/demo/');
  await expect(page.getByText('Route Archive purchases are not open yet.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Buy Route Archive — $9' })).toHaveCount(0);
  await page.goto('/demo/?license=fixture-license');
  await expect(page.getByText('Route Archive license active on this device')).toBeVisible();
  await expect(page.getByText('US$9 once.')).toBeVisible();
  await page.getByRole('button', { name: 'Save on device' }).click();
  for (let index = 2; index <= 4; index += 1) {
    await addTwoPointRoute(page, `Licensed route ${index}`, index / 1000);
    await page.getByRole('button', { name: 'Save on device' }).click();
  }
  await expect(page.locator('.saved-list li')).toHaveCount(4);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export archive' }).click();
  const archive = await downloadText(await pending);
  expect(JSON.parse(archive).routes).toHaveLength(4);
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('.saved-delete').first().click();
  await expect(page.locator('.saved-list li')).toHaveCount(3);
  await page.locator('#backup-input').setInputFiles({ name: 'route-archive.json', mimeType: 'application/json', buffer: Buffer.from(archive) });
  await expect(page.locator('.saved-list li')).toHaveCount(4);
});

test('@claim:local-delete deletes a saved route without sending it off-origin', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Save on device' }).click();
  await expect(page.locator('.saved-list li')).toHaveCount(1);
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('.saved-delete').click();
  await expect(page.locator('.saved-list li')).toHaveCount(0);
  const count = await page.evaluate(async () => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('demo:route-intent-planner');
    request.onsuccess = () => {
      const transaction = request.result.transaction('routes', 'readonly');
      const counter = transaction.objectStore('routes').count();
      counter.onsuccess = () => { request.result.close(); resolve(counter.result); };
      counter.onerror = () => reject(counter.error);
    };
    request.onerror = () => reject(request.error);
  }));
  expect(count).toBe(0);
  expect(requests.every((url) => !url.startsWith('http') || new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true);
});

test('@claim:no-account-font-tiles completes the core sample flow without an account, runtime font, or map tile', async ({ page }) => {
  const requests: Array<{ type: string; url: string }> = [];
  page.on('request', (request) => requests.push({ type: request.resourceType(), url: request.url() }));
  await page.goto('/demo/');
  await expect(page.getByText(/sign in|log in|create account/i)).toHaveCount(0);
  await page.getByRole('button', { name: 'Check route' }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export GPX' }).click();
  await pending;
  expect(requests.some((request) => request.type === 'font')).toBe(false);
  expect(requests.some((request) => /tile|mapbox|googleapis/i.test(request.url))).toBe(false);
});
