import type { AnalysisItem, RouteDraft, RoutePoint, RouteSegment, SegmentMode } from './types';

const id = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

export function emptyDraft(name = 'Saturday route tape'): RouteDraft {
  const now = new Date().toISOString();
  return { id: id(), name, points: [], segments: [], createdAt: now, updatedAt: now };
}

export function addPoint(draft: RouteDraft, point: Omit<RoutePoint, 'id'>, mode: SegmentMode = 'locked'): RouteDraft {
  const next: RoutePoint = { ...point, id: id() };
  const previous = draft.points.at(-1);
  const segments = previous
    ? [...draft.segments, { id: id(), fromId: previous.id, toId: next.id, mode, name: '' }]
    : draft.segments;
  return { ...draft, points: [...draft.points, next], segments, updatedAt: new Date().toISOString() };
}

export function rebuildSegments(points: RoutePoint[], existing: RouteSegment[] = []): RouteSegment[] {
  return points.slice(1).map((point, index) => {
    const from = points[index];
    const match = existing.find((segment) => segment.fromId === from.id && segment.toId === point.id);
    return match ?? { id: id(), fromId: from.id, toId: point.id, mode: 'locked', name: '' };
  });
}

export function haversineKm(a: Pick<RoutePoint, 'lat' | 'lon'>, b: Pick<RoutePoint, 'lat' | 'lon'>): number {
  const rad = (value: number) => value * Math.PI / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const lat1 = rad(a.lat);
  const lat2 = rad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function analyze(draft: RouteDraft): AnalysisItem[] {
  const byId = new Map(draft.points.map((point) => [point.id, point]));
  return draft.segments.map((segment) => {
    const from = byId.get(segment.fromId)!;
    const to = byId.get(segment.toId)!;
    const distanceKm = haversineKm(from, to);
    if (segment.mode === 'flagged') {
      return { segmentId: segment.id, severity: 'review', reason: 'Marked off-intent — inspect before export.', distanceKm };
    }
    if (segment.mode === 'gap') {
      return { segmentId: segment.id, severity: 'review', reason: 'Open gap — straight advisory connector only.', distanceKm };
    }
    if (distanceKm > 15) {
      return { segmentId: segment.id, severity: 'review', reason: 'Long locked jump — confirm no trace points are missing.', distanceKm };
    }
    return { segmentId: segment.id, severity: 'clear', reason: 'Locked to your authored line.', distanceKm };
  });
}

export function parseGpx(xml: string): RouteDraft {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (document.querySelector('parsererror')) throw new Error('This file is not valid XML.');
  const nodes = [...document.querySelectorAll('trkpt, rtept')];
  if (nodes.length < 2) throw new Error('The GPX needs at least two track or route points.');
  if (nodes.length > 2000) throw new Error(`This GPX has ${nodes.length.toLocaleString()} points. This version preserves up to 2,000 exactly; simplify the track before importing.`);
  const raw = nodes.map((node) => ({
    lat: Number(node.getAttribute('lat')),
    lon: Number(node.getAttribute('lon')),
    elevation: node.querySelector('ele') ? Number(node.querySelector('ele')!.textContent) : undefined,
  }));
  if (raw.some((point) => !Number.isFinite(point.lat) || !Number.isFinite(point.lon))) {
    throw new Error('One or more GPX points have invalid coordinates.');
  }
  let draft = emptyDraft(document.querySelector('trk > name, rte > name')?.textContent?.trim() || 'Imported route tape');
  for (const point of raw) draft = addPoint(draft, point);
  return draft;
}

const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]!);

export function toGpx(draft: RouteDraft): string {
  const points = draft.points.map((point) => `      <trkpt lat="${point.lat.toFixed(6)}" lon="${point.lon.toFixed(6)}">${point.elevation == null ? '' : `<ele>${point.elevation}</ele>`}</trkpt>`).join('\n');
  const notes = draft.segments.map((segment, index) => `${index + 1}:${segment.mode}${segment.name ? `:${segment.name}` : ''}`).join(' | ');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Route Intent Planner" xmlns="http://www.topografix.com/GPX/1/1">\n  <metadata><name>${escapeXml(draft.name)}</name><desc>${escapeXml(`Intent ledger — ${notes}`)}</desc></metadata>\n  <trk><name>${escapeXml(draft.name)}</name><trkseg>\n${points}\n  </trkseg></trk>\n</gpx>\n`;
}

export function sampleDraft(): RouteDraft {
  const coords = [
    [51.5078, -0.1282], [51.513, -0.105], [51.518, -0.078], [51.532, -0.055],
    [51.548, -0.072], [51.554, -0.104], [51.545, -0.137], [51.526, -0.153], [51.5078, -0.1282],
  ];
  let draft = emptyDraft('Canal loop — sample');
  for (const [lat, lon] of coords) draft = addPoint(draft, { lat, lon });
  draft.segments[1].name = 'Canal towpath';
  draft.segments[1].mode = 'locked';
  draft.segments[4].name = 'Check river crossing';
  draft.segments[4].mode = 'gap';
  return draft;
}
