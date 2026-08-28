import { describe, expect, it } from 'vitest';
import { addPoint, analyze, emptyDraft, haversineKm, sampleDraft, toGpx } from '../src/route';

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
});
