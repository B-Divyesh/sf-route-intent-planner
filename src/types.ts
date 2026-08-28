export type SegmentMode = 'locked' | 'gap' | 'flagged';

export interface RoutePoint {
  id: string;
  lat: number;
  lon: number;
  elevation?: number;
}

/** A coordinate returned by the opt-in OpenStreetMap bicycle router. */
export interface RoutedPoint {
  lat: number;
  lon: number;
}

export interface RouteSegment {
  id: string;
  fromId: string;
  toId: string;
  mode: SegmentMode;
  name: string;
  /**
   * Interior geometry for an optimized open gap. The authored endpoints stay
   * in `points`, so a router can never move a locked pin or rewrite a route
   * corridor by accident.
   */
  routedPoints?: RoutedPoint[];
}

export interface RouteDraft {
  id: string;
  name: string;
  points: RoutePoint[];
  segments: RouteSegment[];
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisItem {
  segmentId: string;
  severity: 'clear' | 'review';
  reason: string;
  distanceKm: number;
}
