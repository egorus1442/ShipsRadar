/**
 * TypeScript type definitions
 * Global types for the application
 */

// ==================== Map Types ====================

/**
 * Geographic coordinates (longitude, latitude)
 */
export interface Coordinates {
  lng: number;
  lat: number;
}

/**
 * Map marker data
 */
export interface MapMarker {
  id: string;
  coordinates: Coordinates;
  label?: string;
  type?: 'start' | 'end' | 'waypoint' | 'custom';
}

/**
 * Map click event data
 */
export interface MapClickEvent {
  coordinates: Coordinates;
  point: {
    x: number;
    y: number;
  };
}

/**
 * Map view state
 */
export interface MapViewState {
  center: Coordinates;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

// ==================== Location & Geocoding Types (Stage 3) ====================

/**
 * Coordinate formats supported by the parser
 */
export type CoordinateFormat = 'decimal' | 'dms' | 'dm';

/**
 * Request for forward geocoding (name/address to coordinates)
 */
export interface LocationRequest {
  query: string;
  limit?: number;
  types?: string[];
}

/**
 * Request for reverse geocoding (coordinates to name/address)
 */
export interface ReverseGeocodeRequest {
  coordinates: Coordinates;
  types?: string[];
}

/**
 * Single location feature from geocoding results
 */
export interface LocationFeature {
  id: string;
  place_name: string;
  text: string;
  place_type: string[];
  coordinates: Coordinates;
  relevance: number;
  context?: Array<{
    id: string;
    text: string;
  }>;
}

/**
 * Response from geocoding API
 */
export interface LocationResponse {
  type: 'FeatureCollection';
  query: string;
  features: LocationFeature[];
  attribution: string;
}

/**
 * Result of coordinate parsing
 */
export interface CoordinateParseResult {
  coordinates: Coordinates;
  format: CoordinateFormat;
  original_input: string;
}

/**
 * Location input state (used in UI components)
 */
export interface LocationInputState {
  value: string;
  coordinates: Coordinates | null;
  selectedFeature: LocationFeature | null;
  isValid: boolean;
  error?: string;
}

/**
 * Route input data (start, end, departure time)
 */
export interface RouteInput {
  startLocation: LocationInputState;
  endLocation: LocationInputState;
  departureTime: Date;
}

// ==================== Weather Types (Stage 4) ====================

/**
 * Weather point data at a specific location and time
 */
export interface WeatherPoint {
  coordinates: Coordinates;
  timestamp: string; // ISO 8601 datetime
  wind_speed?: number; // knots
  wind_direction?: number; // degrees
  wave_height?: number; // meters
  wave_direction?: number; // degrees
  wave_period?: number; // seconds
  swell_height?: number; // meters
  swell_direction?: number; // degrees
  swell_period?: number; // seconds
  current_speed?: number; // knots
  current_direction?: number; // degrees
  air_temperature?: number; // Celsius
  sea_temperature?: number; // Celsius
  precipitation?: number; // mm/h
  cloud_cover?: number; // percentage
  visibility?: number; // km
  pressure?: number; // hPa
}

// ==================== Route Types (Stage 5 & 6) ====================

/**
 * Request for route calculation
 */
export interface RouteRequest {
  start: Coordinates;
  end: Coordinates;
  departure_time: string; // ISO 8601 datetime
  vessel_speed?: number; // knots, default 15
  waypoints_count?: number; // default 20
  avoid_extreme_weather?: boolean; // default true
  extreme_wind_threshold?: number; // knots, default 30
  extreme_wave_threshold?: number; // meters, default 5
}

/**
 * Single waypoint on a route
 */
export interface Waypoint {
  id: number; // sequence number (0-based)
  coordinates: Coordinates;
  eta: string; // ISO 8601 datetime
  distance_from_prev: number; // nautical miles
  cumulative_distance: number; // nautical miles from start
  weather?: WeatherPoint;
  is_adjusted: boolean; // adjusted to avoid weather
  warnings: string[];
}

/**
 * Overall route metrics and statistics
 */
export interface RouteMetrics {
  total_distance_nm: number; // nautical miles
  total_distance_km: number; // kilometers
  estimated_duration_hours: number;
  departure_time: string; // ISO 8601 datetime
  arrival_time: string; // ISO 8601 datetime
  average_speed_knots: number;
  waypoints_adjusted: number;
  max_wind_speed?: number; // knots
  max_wave_height?: number; // meters
}

/**
 * Warning about route conditions
 */
export interface RouteWarning {
  severity: 'info' | 'warning' | 'danger';
  waypoint_id: number;
  message: string;
  parameter: string; // wind, waves, etc.
  value: number;
}

/**
 * Complete route response from API
 */
export interface RouteResponse {
  request: RouteRequest;
  waypoints: Waypoint[];
  metrics: RouteMetrics;
  warnings: RouteWarning[];
  algorithm: string; // e.g., "simple_great_circle"
  calculated_at: string; // ISO 8601 datetime
  calculation_time_ms?: number;
}

/**
 * Route display state (UI)
 */
export interface RouteDisplayState {
  route: RouteResponse | null;
  isLoading: boolean;
  error?: string;
  selectedWaypointId?: number;
  showWeatherWarnings: boolean;
  showWaypointsTable: boolean;
}

