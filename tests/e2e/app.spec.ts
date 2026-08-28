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
  await page.getByRole('button', { name: 'Load sample' }).click();
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
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  }
});

test('has no serious or critical accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
});

test('works offline after the app shell is installed', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Keep the line/ })).toBeVisible();
  await expect(page.getByText('Offline — local tools ready')).toBeVisible();
  await context.setOffline(false);
});
