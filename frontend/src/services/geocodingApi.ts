/**
 * Geocoding API Service
 * Handles communication with backend geocoding endpoints
 */

import { config } from '../config';
import type {
  LocationRequest,
  LocationResponse,
  ReverseGeocodeRequest,
  CoordinateParseResult,
  Coordinates,
} from '../types';

const API_BASE = config.api.baseUrl;

/**
 * Error class for API errors
 */
export class GeocodingApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: string
  ) {
    super(message);
    this.name = 'GeocodingApiError';
  }
}

/**
 * Forward geocoding - convert location name/address to coordinates
 */
export async function geocodeLocation(
  request: LocationRequest
): Promise<LocationResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/geocode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new GeocodingApiError(
        errorData.detail || 'Geocoding failed',
        response.status,
        errorData.details
      );
    }

    const data: LocationResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof GeocodingApiError) {
      throw error;
    }
    console.error('Geocoding error:', error);
    throw new GeocodingApiError('Network error during geocoding');
  }
}

/**
 * Reverse geocoding - convert coordinates to location name/address
 */
export async function reverseGeocodeLocation(
  request: ReverseGeocodeRequest
): Promise<LocationResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/reverse-geocode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new GeocodingApiError(
        errorData.detail || 'Reverse geocoding failed',
        response.status,
        errorData.details
      );
    }

    const data: LocationResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof GeocodingApiError) {
      throw error;
    }
    console.error('Reverse geocoding error:', error);
    throw new GeocodingApiError('Network error during reverse geocoding');
  }
}

/**
 * Parse coordinate string in various formats
 */
export async function parseCoordinates(
  coords: string
): Promise<CoordinateParseResult> {
  try {
    const params = new URLSearchParams({ coords });
    const response = await fetch(
      `${API_BASE}/api/parse-coordinates?${params.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new GeocodingApiError(
        errorData.detail || 'Coordinate parsing failed',
        response.status,
        errorData.details
      );
    }

    const data: CoordinateParseResult = await response.json();
    return data;
  } catch (error) {
    if (error instanceof GeocodingApiError) {
      throw error;
    }
    console.error('Coordinate parsing error:', error);
    throw new GeocodingApiError('Network error during coordinate parsing');
  }
}

/**
 * Autocomplete location search (optimized for typeahead)
 */
export async function autocompleteLocation(
  query: string,
  limit: number = 5,
  types?: string[]
): Promise<LocationResponse> {
  try {
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
    });

    if (types && types.length > 0) {
      params.set('types', types.join(','));
    }

    const response = await fetch(
      `${API_BASE}/api/autocomplete?${params.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new GeocodingApiError(
        errorData.detail || 'Autocomplete failed',
        response.status,
        errorData.details
      );
    }

    const data: LocationResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof GeocodingApiError) {
      throw error;
    }
    console.error('Autocomplete error:', error);
    throw new GeocodingApiError('Network error during autocomplete');
  }
}

/**
 * Debounce helper for autocomplete
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Validate coordinates are within valid ranges
 */
export function validateCoordinates(coords: Coordinates): boolean {
  return (
    coords.lat >= -90 &&
    coords.lat <= 90 &&
    coords.lng >= -180 &&
    coords.lng <= 180
  );
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(
  coords: Coordinates,
  decimals: number = 4
): string {
  return `${coords.lat.toFixed(decimals)}°, ${coords.lng.toFixed(decimals)}°`;
}

