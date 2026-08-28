export type SegmentMode = 'locked' | 'gap' | 'flagged';

export interface RoutePoint {
  id: string;
  lat: number;
  lon: number;
  elevation?: number;
}

export interface RouteSegment {
  id: string;
  fromId: string;
  toId: string;
  mode: SegmentMode;
  name: string;
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
