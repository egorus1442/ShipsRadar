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

// ==================== Future Types Placeholder ====================

// Route calculation types will be added in Stage 5
// Weather types will be added in Stage 4

