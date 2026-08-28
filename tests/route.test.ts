import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { addPoint, analyze, emptyDraft, exportCoordinates, haversineKm, isWgs84Coordinate, parseGpxCoordinateAttributes, sampleDraft, toGpx } from '../src/route';
import { parseBackup } from '../src/validation';

describe('route intent model', () => {
  it('locks newly-authored corridors by default', () => {
    let draft = emptyDraft('Club loop');
    draft = addPoint(draft, { lat: 51.5, lon: -0.12 });
    draft = addPoint(draft, { lat: 51.51, lon: -0.1 });
    expect(draft.segments).toHaveLength(1);
    expect(draft.segments[0].mode).toBe('locked');
  });

  it('flags open gaps while keeping locked segments clear', () => {
    const draft = sampleDraft();
    const results = analyze(draft);
    expect(results.filter((item) => item.severity === 'review')).toHaveLength(1);
    expect(results[4].reason).toContain('Open gap');
  });

  it('exports standard GPX with the intent ledger and exact points', () => {
    const draft = sampleDraft();
    const gpx = toGpx(draft);
    expect(gpx).toContain('xmlns="http://www.topografix.com/GPX/1/1"');
    expect(gpx).toContain('2:locked:Canal towpath');
    expect(gpx.match(/<trkpt/g)).toHaveLength(draft.points.length);
    expect(gpx).toContain('lat="51.507800"');
  });

  it('uses geodesic distance rather than screen distance', () => {
    const distance = haversineKm({ lat: 51.5, lon: -0.1 }, { lat: 51.5, lon: -0.09 });
    expect(distance).toBeGreaterThan(0.68);
    expect(distance).toBeLessThan(0.71);
  });

  it('treats only finite WGS84 coordinate pairs as valid', () => {
    expect(isWgs84Coordinate(90, 180)).toBe(true);
    expect(isWgs84Coordinate(-90, -180)).toBe(true);
    expect(isWgs84Coordinate(91, 181)).toBe(false);
    expect(isWgs84Coordinate(Number.NaN, 0)).toBe(false);
  });

  it.each([
    ['missing latitude', null, '-0.1'],
    ['missing longitude', '51.5', null],
    ['blank latitude', ' ', '-0.1'],
    ['blank longitude', '51.5', ''],
    ['non-numeric latitude', 'north', '-0.1'],
    ['non-numeric longitude', '51.5', 'west'],
  ])('rejects GPX with %s instead of turning it into (0,0)', (_case, lat, lon) => {
    expect(() => parseGpxCoordinateAttributes(lat, lon, 1)).toThrow(/missing a latitude or longitude|not numeric/);
  });

  it('exports an optimized line only inside its open gap and preserves authored pins', () => {
    let draft = emptyDraft('Gap proof');
    draft = addPoint(draft, { lat: 51.5, lon: -0.12 });
    draft = addPoint(draft, { lat: 51.51, lon: -0.10 });
    draft = addPoint(draft, { lat: 51.52, lon: -0.08 });
    draft.segments[1] = { ...draft.segments[1], mode: 'gap', routedPoints: [{ lat: 51.514, lon: -0.095 }, { lat: 51.517, lon: -0.088 }] };
    const coordinates = exportCoordinates(draft);
    expect(coordinates.map(({ lat, lon }) => [lat, lon])).toEqual([
      [51.5, -0.12], [51.51, -0.1], [51.514, -0.095], [51.517, -0.088], [51.52, -0.08],
    ]);
    const gpx = toGpx(draft);
    expect(gpx).toContain('lat="51.510000" lon="-0.100000"');
    expect(gpx).toContain('lat="51.514000" lon="-0.095000"');
    expect(gpx).toContain('lat="51.520000" lon="-0.080000"');
  });

  it('rejects malformed paid archives before any route can be persisted', () => {
    expect(() => parseBackup({ version: 1, routes: [{ id: 'bad', name: 42 }] })).toThrow(/invalid route/);
    expect(() => parseBackup({ routes: [] })).toThrow(/version 1/);
  });

  it('ships immutable asset and browser-hardening header rules for static deployment', () => {
    const headers = readFileSync('public/_headers', 'utf8');
    const azureConfig = readFileSync('public/staticwebapp.config.json', 'utf8');
    expect(headers).toContain('Content-Security-Policy:');
    expect(headers).toContain('Permissions-Policy:');
    expect(headers).toMatch(/\/assets\/\*[\s\S]*max-age=31536000, immutable/);
    expect(headers).toMatch(/\/manifest\.json[\s\S]*application\/manifest\+json/);
    expect(headers).toMatch(/\/manifest\.webmanifest[\s\S]*application\/manifest\+json/);
    expect(azureConfig).toContain('Content-Security-Policy');
    expect(azureConfig).toContain('Permissions-Policy');
    expect(azureConfig).toContain('max-age=31536000, immutable');
    expect(azureConfig).toContain('application/manifest+json');
    expect(azureConfig).toContain('routing.openstreetmap.de');
  });
});
