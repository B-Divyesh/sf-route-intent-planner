import { isWgs84Coordinate } from './route';
import type { RoutedPoint } from './types';

export const BIKE_ROUTER_ORIGIN = 'https://routing.openstreetmap.de';
const MAX_ROUTED_POINTS = 2_000;

interface RouterResponse {
  code?: string;
  routes?: Array<{ geometry?: { coordinates?: unknown } }>;
}

/**
 * Route one user-selected gap on an OSM-compatible bicycle graph. This is
 * deliberately never called automatically: opening a gap remains local and
 * a rider explicitly chooses when its endpoint coordinates may leave the
 * device. Only interior coordinates are returned to the draft.
 */
export async function routeOpenGap(from: RoutedPoint, to: RoutedPoint): Promise<RoutedPoint[]> {
  if (!isWgs84Coordinate(from.lat, from.lon) || !isWgs84Coordinate(to.lat, to.lon)) {
    throw new Error('This gap has invalid endpoint coordinates and cannot be optimized.');
  }
  const coordinates = `${from.lon},${from.lat};${to.lon},${to.lat}`;
  const url = new URL(`/routed-bike/route/v1/driving/${coordinates}`, BIKE_ROUTER_ORIGIN);
  url.search = new URLSearchParams({ alternatives: 'false', geometries: 'geojson', overview: 'full', steps: 'false' }).toString();
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('The bicycle router is unavailable. Your gap and local draft are unchanged; try again when online.');
  const body = await response.json() as RouterResponse;
  const raw = body.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(raw) || raw.length < 2) throw new Error('The bicycle router returned no usable line. Your gap is unchanged.');
  if (raw.length > MAX_ROUTED_POINTS + 2) throw new Error('This optimized gap has too many points to keep reliably. Choose closer endpoints or add a waypoint.');
  const points = raw.map((coordinate): RoutedPoint | null => {
    if (!Array.isArray(coordinate) || coordinate.length < 2 || typeof coordinate[0] !== 'number' || typeof coordinate[1] !== 'number') return null;
    return isWgs84Coordinate(coordinate[1], coordinate[0]) ? { lat: coordinate[1], lon: coordinate[0] } : null;
  });
  if (points.some((point) => point === null)) throw new Error('The bicycle router returned invalid coordinates. Your gap is unchanged.');
  // Do not retain router-provided endpoints: authored pins are the exact
  // export anchors. Only the road-shaped interior belongs to this gap.
  return (points as RoutedPoint[]).slice(1, -1);
}
