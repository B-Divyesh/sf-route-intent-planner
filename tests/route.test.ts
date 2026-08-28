import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { addPoint, analyze, emptyDraft, haversineKm, isWgs84Coordinate, sampleDraft, toGpx } from '../src/route';
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
    expect(azureConfig).toContain('Content-Security-Policy');
    expect(azureConfig).toContain('Permissions-Policy');
    expect(azureConfig).toContain('max-age=31536000, immutable');
    expect(azureConfig).toContain('application/manifest+json');
  });
});
