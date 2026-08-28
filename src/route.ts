import type { AnalysisItem, RouteDraft, RoutePoint, RouteSegment, RoutedPoint, SegmentMode } from './types';

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

export function segmentCoordinates(segment: RouteSegment, from: RoutePoint, to: RoutePoint): RoutedPoint[] {
  return [from, ...(segment.mode === 'gap' ? segment.routedPoints || [] : []), to];
}

export function segmentDistanceKm(segment: RouteSegment, from: RoutePoint, to: RoutePoint): number {
  const coordinates = segmentCoordinates(segment, from, to);
  return coordinates.slice(1).reduce((total, point, index) => total + haversineKm(coordinates[index], point), 0);
}

/** Flatten a draft for GPX while keeping every authored point exact. */
export function exportCoordinates(draft: RouteDraft): RoutedPoint[] {
  if (!draft.points.length) return [];
  const byId = new Map(draft.points.map((point) => [point.id, point]));
  return draft.segments.reduce<RoutedPoint[]>((coordinates, segment) => {
    const from = byId.get(segment.fromId)!;
    const to = byId.get(segment.toId)!;
    if (!coordinates.length) coordinates.push(from);
    if (segment.mode === 'gap') coordinates.push(...(segment.routedPoints || []));
    coordinates.push(to);
    return coordinates;
  }, draft.segments.length ? [] : [draft.points[0]]);
}

/** WGS84 geographic coordinates accepted by GPX and the drafting sheet. */
export function isWgs84Coordinate(lat: number, lon: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/** Validate raw GPX attributes before Number(null) can turn an omission into 0. */
export function parseGpxCoordinateAttributes(latValue: string | null, lonValue: string | null, pointNumber: number): RoutedPoint {
  if (latValue === null || lonValue === null || !latValue.trim() || !lonValue.trim()) {
    throw new Error(`GPX point ${pointNumber} is missing a latitude or longitude. Add both WGS84 coordinates and try again.`);
  }
  const lat = Number(latValue);
  const lon = Number(lonValue);
  if (!isWgs84Coordinate(lat, lon)) {
    throw new Error('One or more GPX points are outside WGS84 bounds or are not numeric. Latitude must be between -90 and 90; longitude must be between -180 and 180.');
  }
  return { lat, lon };
}

export function analyze(draft: RouteDraft): AnalysisItem[] {
  const byId = new Map(draft.points.map((point) => [point.id, point]));
  return draft.segments.map((segment) => {
    const from = byId.get(segment.fromId)!;
    const to = byId.get(segment.toId)!;
    const distanceKm = segmentDistanceKm(segment, from, to);
    if (segment.mode === 'flagged') {
      return { segmentId: segment.id, severity: 'review', reason: 'Marked off-intent — inspect before export.', distanceKm };
    }
    if (segment.mode === 'gap') {
      const routed = (segment.routedPoints?.length || 0) > 0;
      return { segmentId: segment.id, severity: 'review', reason: routed ? 'Open gap — optimized on the OpenStreetMap bicycle network; inspect access before export.' : 'Open gap — choose Optimize gaps to request an OpenStreetMap bicycle route.', distanceKm };
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
  const raw = nodes.map((node, index) => {
    const coordinate = parseGpxCoordinateAttributes(node.getAttribute('lat'), node.getAttribute('lon'), index + 1);
    return { ...coordinate, elevation: node.querySelector('ele') ? Number(node.querySelector('ele')!.textContent) : undefined };
  });
  if (raw.some((point) => !isWgs84Coordinate(point.lat, point.lon))) {
    throw new Error('One or more GPX points are outside WGS84 bounds or are not numeric. Latitude must be between -90 and 90; longitude must be between -180 and 180.');
  }
  if (raw.some((point) => point.elevation !== undefined && !Number.isFinite(point.elevation))) {
    throw new Error('One or more GPX elevation values are invalid. Remove or correct the affected <ele> value and try again.');
  }
  let draft = emptyDraft(document.querySelector('trk > name, rte > name')?.textContent?.trim() || 'Imported route tape');
  for (const point of raw) draft = addPoint(draft, point);
  return draft;
}

const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]!);

export function toGpx(draft: RouteDraft): string {
  const points = exportCoordinates(draft).map((point) => `      <trkpt lat="${point.lat.toFixed(6)}" lon="${point.lon.toFixed(6)}">${'elevation' in point && point.elevation == null ? '' : 'elevation' in point ? `<ele>${point.elevation}</ele>` : ''}</trkpt>`).join('\n');
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
