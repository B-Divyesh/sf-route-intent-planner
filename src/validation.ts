import { isWgs84Coordinate } from './route';
import type { RouteDraft, RoutePoint, RouteSegment, SegmentMode } from './types';

const MODES: readonly SegmentMode[] = ['locked', 'gap', 'flagged'];

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function validPoint(value: unknown): value is RoutePoint {
  if (!record(value) || !nonEmptyString(value.id) || typeof value.lat !== 'number' || typeof value.lon !== 'number') return false;
  return isWgs84Coordinate(value.lat, value.lon) && (value.elevation === undefined || (typeof value.elevation === 'number' && Number.isFinite(value.elevation)));
}

function validRoutedPoints(value: unknown): boolean {
  return Array.isArray(value)
    && value.length <= 2_000
    && value.every((point) => record(point) && typeof point.lat === 'number' && typeof point.lon === 'number' && isWgs84Coordinate(point.lat, point.lon));
}

function validSegment(value: unknown): value is RouteSegment {
  return record(value)
    && nonEmptyString(value.id)
    && nonEmptyString(value.fromId)
    && nonEmptyString(value.toId)
    && typeof value.name === 'string'
    && typeof value.mode === 'string'
    && MODES.includes(value.mode as SegmentMode)
    && (value.routedPoints === undefined || validRoutedPoints(value.routedPoints));
}

/**
 * Strictly validate persisted routes before they reach rendering or IndexedDB.
 * Consecutive segment topology is deliberate: the planner does not support a
 * disconnected graph, so a backup cannot smuggle in dangling references.
 */
export function isRouteDraft(value: unknown): value is RouteDraft {
  if (!record(value)
    || !nonEmptyString(value.id)
    || typeof value.name !== 'string'
    || !validTimestamp(value.createdAt)
    || !validTimestamp(value.updatedAt)
    || !Array.isArray(value.points)
    || !Array.isArray(value.segments)
    || !value.points.every(validPoint)
    || !value.segments.every(validSegment)
    || value.segments.length !== Math.max(0, value.points.length - 1)) return false;

  const route = value as unknown as RouteDraft;
  const pointIds = new Set(route.points.map((point) => point.id));
  const segmentIds = new Set(route.segments.map((segment) => segment.id));
  if (pointIds.size !== route.points.length || segmentIds.size !== route.segments.length) return false;

  return route.segments.every((segment, index) => (
    segment.fromId === route.points[index].id
    && segment.toId === route.points[index + 1].id
    && (segment.mode === 'gap' || !segment.routedPoints?.length)
  ));
}

export function parseBackup(value: unknown): RouteDraft[] {
  if (!record(value) || value.version !== 1 || !Array.isArray(value.routes)) {
    throw new Error('That archive is not a Route Intent Planner version 1 JSON backup.');
  }
  if (!value.routes.every(isRouteDraft)) {
    throw new Error('That archive contains an invalid route. No routes were imported.');
  }
  const routeIds = new Set(value.routes.map((route) => route.id));
  if (routeIds.size !== value.routes.length) {
    throw new Error('That archive repeats a route ID. No routes were imported.');
  }
  return value.routes;
}
