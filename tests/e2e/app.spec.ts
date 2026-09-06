import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('plans, labels, checks, and exports a route', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await page.getByLabel('Latitude').fill('51.5001');
  await page.getByLabel('Longitude').fill('-0.1101');
  await page.getByLabel('Longitude').press('Enter');
  await expect(page.locator('.route-stats').getByText('1', { exact: true })).toBeVisible();
  await page.locator('#gpx-input').setInputFiles({
    name: 'known-club-route.gpx',
    mimeType: 'application/gpx+xml',
    buffer: Buffer.from('<?xml version="1.0"?><gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>Known club route</name><trkseg><trkpt lat="51.50" lon="-0.11"/><trkpt lat="51.51" lon="-0.10"/></trkseg></trk></gpx>'),
  });
  await expect(page.locator('#route-name')).toHaveValue('Known club route');
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo\/?$/);
  await expect(page.locator('.route-stats').getByText('9', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Check route' }).click();
  await expect(page.getByText(/1 section needs review/)).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export GPX' }).click();
  expect((await download).suggestedFilename()).toContain('canal-loop-sample.gpx');
});

test('legal pages retain landmarks and accessible structure', async ({ page }) => {
  for (const path of ['/privacy/', '/terms/']) {
    await page.goto(path);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  }
});

test('has no accessibility violations on planner, demo, or not-found pages', async ({ page }) => {
  for (const path of ['/', '/demo/', '/404.html']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  }
});

test('makes no automatic off-origin request and does not advertise an unregistered checkout', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await expect(page.getByText('Route Archive purchases are not open yet.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Buy Route Archive — $9' })).toHaveCount(0);
  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true);
});

test('keeps the planner reachable by keyboard and avoids viewport overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#route-name')).toBeVisible();
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to route planner' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('uses instant state changes when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demo/');
  const motion = await page.locator('.button').first().evaluate((element) => ({
    transitionDuration: getComputedStyle(element).transitionDuration,
    animationDuration: getComputedStyle(element).animationDuration,
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
  }));
  expect(Number.parseFloat(motion.transitionDuration)).toBeLessThan(0.001);
  expect(Number.parseFloat(motion.animationDuration)).toBeLessThan(0.001);
  expect(motion.scrollBehavior).toBe('auto');
});

test('works offline after the app shell is installed', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Plan cycling routes/ })).toBeVisible();
  await expect(page.getByText('Offline — local tools ready')).toBeVisible();
  await context.setOffline(false);
});

test('rejects out-of-range GPX and malformed archives without poisoning a later reload', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sb_license:route-intent-planner', 'test-license');
    localStorage.setItem('sb_license:route-intent-planner:verdict', JSON.stringify({ valid: true, checkedAt: Date.now() }));
  });
  await page.goto('/');
  await page.locator('#gpx-input').setInputFiles({
    name: 'out-of-range.gpx',
    mimeType: 'application/gpx+xml',
    buffer: Buffer.from('<?xml version="1.0"?><gpx><trk><trkseg><trkpt lat="91" lon="181"/><trkpt lat="92" lon="182"/></trkseg></trk></gpx>'),
  });
  await expect(page.getByText(/outside WGS84 bounds/)).toBeVisible();

  await page.locator('#backup-input').setInputFiles({
    name: 'malformed-archive.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":1,"routes":[{"id":"bad","name":42}]}'),
  });
  await expect(page.getByText(/contains an invalid route/)).toBeVisible();
  await expect(page.locator('.saved-list')).toHaveCount(0);

  // Simulate the record written by the previously released candidate. The
  // repaired reader must remove it and still render a recoverable planner.
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('route-intent-planner');
      request.onsuccess = () => {
        const transaction = request.result.transaction('routes', 'readwrite');
        transaction.objectStore('routes').put({ id: 'bad', name: 42 });
        transaction.oncomplete = () => { request.result.close(); resolve(); };
        transaction.onerror = () => reject(transaction.error);
      };
      request.onerror = () => reject(request.error);
    });
  });
  await page.reload();
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('.saved-list')).toHaveCount(0);
});

test('rejects absent, blank, and non-numeric GPX coordinates independently', async ({ page }) => {
  await page.goto('/');
  const fixtures = [
    ['missing latitude', '<trkpt lon="-0.1"/><trkpt lat="51.51" lon="-0.09"/>'],
    ['blank longitude', '<trkpt lat="51.5" lon=" "/><trkpt lat="51.51" lon="-0.09"/>'],
    ['non-numeric latitude', '<trkpt lat="north" lon="-0.1"/><trkpt lat="51.51" lon="-0.09"/>'],
    ['non-numeric longitude', '<trkpt lat="51.5" lon="west"/><trkpt lat="51.51" lon="-0.09"/>'],
  ] as const;
  for (const [name, points] of fixtures) {
    await page.locator('#gpx-input').setInputFiles({
      name: `${name}.gpx`,
      mimeType: 'application/gpx+xml',
      buffer: Buffer.from(`<gpx version="1.1"><trk><trkseg>${points}</trkseg></trk></gpx>`),
    });
    await expect(page.locator('#message')).toContainText(/missing a latitude or longitude|not numeric/);
    await expect(page.locator('.route-stats strong').first()).toHaveText('0');
  }
});

test('optimizes only explicit gaps and exports the road-shaped interior without moving locked points', async ({ page }) => {
  let routerRequests = 0;
  await page.route('https://routing.openstreetmap.de/**', async (route) => {
    routerRequests += 1;
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({
      code: 'Ok', routes: [{ geometry: { coordinates: [[-0.1, 51.5], [-0.095, 51.505], [-0.09, 51.51]] } }],
    }) });
  });
  await page.goto('/');
  await page.getByLabel('Latitude').fill('51.5000');
  await page.getByLabel('Longitude').fill('-0.1000');
  await page.getByLabel('Longitude').press('Enter');
  await page.getByLabel('Latitude').fill('51.5100');
  await page.getByLabel('Longitude').fill('-0.0900');
  await page.getByLabel('Longitude').press('Enter');
  await page.getByRole('button', { name: 'Open gap' }).click();
  expect(routerRequests).toBe(0);
  await page.getByRole('button', { name: 'Optimize gaps' }).click();
  await expect(page.getByText(/1 open gap optimized. Locked coordinates were not changed/)).toBeVisible();
  expect(routerRequests).toBe(1);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export GPX' }).click();
  const gpx = await (await download).createReadStream();
  let text = '';
  for await (const chunk of gpx!) text += chunk.toString();
  expect(text).toContain('lat="51.500000" lon="-0.100000"');
  expect(text).toContain('lat="51.505000" lon="-0.095000"');
  expect(text).toContain('lat="51.510000" lon="-0.090000"');
});

test('shows visible keyboard focus on file controls and keeps mobile targets at 44px', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sb_license:route-intent-planner', 'test-license');
    localStorage.setItem('sb_license:route-intent-planner:verdict', JSON.stringify({ valid: true, checkedAt: Date.now() }));
  });
  await page.goto('/');
  for (const selector of ['#gpx-input', '#backup-input']) {
    await page.locator(selector).focus();
    const details = await page.locator(selector).evaluate((input) => {
      const label = input.closest('label')!;
      const style = getComputedStyle(label);
      const rect = label.getBoundingClientRect();
      return { outlineWidth: style.outlineWidth, height: rect.height };
    });
    expect(details.outlineWidth).toBe('3px');
    expect(details.height).toBeGreaterThanOrEqual(44);
  }
  await page.goto('/demo/');
  for (const selector of ['.segment-name', 'footer a', '.license-box a:not(.button)']) {
    const boxes = await page.locator(selector).evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }));
    expect(boxes.every((box) => box.width >= 44 && box.height >= 44)).toBe(true);
  }
});

test('@claim:demo-isolation keeps sample work separate and restores real data when leaving the demo', async ({ page }) => {
  await page.addInitScript(() => {
    const now = new Date().toISOString();
    localStorage.setItem('route-intent-planner:current', JSON.stringify({ id: 'real', name: 'REAL-DRAFT-SENTINEL', points: [], segments: [], createdAt: now, updatedAt: now }));
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Plan cycling routes around your chosen roads' })).toBeInViewport();
  await expect(page.getByText('For cyclists and ride leaders who know their roads')).toBeInViewport();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeInViewport();
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('#route-name')).toHaveValue('Canal loop — sample');
  await page.locator('#route-name').fill('Changed demo route');
  await page.locator('#route-name').press('Tab');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('route-intent-planner:current') || '{}').name)).toBe('REAL-DRAFT-SENTINEL');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#route-name')).toHaveValue('Canal loop — sample');
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#route-name')).toHaveValue('REAL-DRAFT-SENTINEL');
});

test('opens a blank route from the installed-app shortcut', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page.locator('.route-stats strong').first()).toHaveText('9');
  await page.goto('/?new=1');
  await expect(page).not.toHaveURL(/new=1/);
  await expect(page.locator('.route-stats strong').first()).toHaveText('0');
  await expect(page.locator('#route-name')).toHaveValue('Saturday cycling route');
});

test('explains how to recover when the bicycle router cannot be reached', async ({ page }) => {
  await page.route('https://routing.openstreetmap.de/**', (route) => route.abort('failed'));
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Optimize gaps' }).click();
  await expect(page.locator('#message')).toContainText('could not be reached');
  await expect(page.locator('#message')).toContainText('check your connection and try again');
  await expect(page.locator('.route-stats strong').first()).toHaveText('9');
});

test('serves unknown paths as a designed 404', async ({ page }) => {
  const response = await page.goto('/this-route-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle('Page not found — Route Intent Planner');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open the route planner' })).toBeVisible();
});
