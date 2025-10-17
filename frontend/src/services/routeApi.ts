/**
 * Route API Client
 * Handles communication with backend route calculation API
 */

import { config } from '../config';
import type {
  RouteRequest,
  RouteResponse,
  Coordinates,
} from '../types';

/**
 * Calculate optimal route between two points
 * 
 * @param start Starting coordinates
 * @param end Ending coordinates
 * @param departureTime Departure time from start point
 * @param options Additional route calculation options
 * @returns Promise<RouteResponse> Route with waypoints, metrics, and warnings
 */
export async function calculateRoute(
  start: Coordinates,
  end: Coordinates,
  departureTime: Date,
  options?: {
    vesselSpeed?: number;
    waypointsCount?: number;
    avoidExtremeWeather?: boolean;
    extremeWindThreshold?: number;
    extremeWaveThreshold?: number;
  }
): Promise<RouteResponse> {
  const requestBody: RouteRequest = {
    start,
    end,
    departure_time: departureTime.toISOString(),
    vessel_speed: options?.vesselSpeed ?? 15.0,
    waypoints_count: options?.waypointsCount ?? 20,
    avoid_extreme_weather: options?.avoidExtremeWeather ?? true,
    extreme_wind_threshold: options?.extremeWindThreshold ?? 30.0,
    extreme_wave_threshold: options?.extremeWaveThreshold ?? 5.0,
  };

  const response = await fetch(`${config.api.baseUrl}/api/route/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new RouteCalculationError(
      errorData.detail || `Failed to calculate route: ${response.statusText}`,
      response.status
    );
  }

  const data = await response.json();
  return data as RouteResponse;
}

/**
 * Get sample routes for testing
 */
export async function getSampleRoutes(): Promise<any> {
  const response = await fetch(`${config.api.baseUrl}/api/route/sample`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new RouteCalculationError(
      `Failed to get sample routes: ${response.statusText}`,
      response.status
    );
  }

  return await response.json();
}

/**
 * Test route calculation endpoint
 * Calculates a predefined route (Singapore to Rotterdam)
 */
export async function testRouteCalculation(): Promise<RouteResponse> {
  const response = await fetch(`${config.api.baseUrl}/api/route/test`, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new RouteCalculationError(
      errorData.detail || `Failed to test route calculation: ${response.statusText}`,
      response.status
    );
  }

  return await response.json();
}

/**
 * Check route service health
 */
export async function checkRouteServiceHealth(): Promise<{
  status: string;
  calculator: string;
  weather_service: string;
  cache_size: number;
}> {
  const response = await fetch(`${config.api.baseUrl}/api/route/health`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new RouteCalculationError(
      `Route service unavailable: ${response.statusText}`,
      response.status
    );
  }

  return await response.json();
}

/**
 * Custom error class for route calculation errors
 */
export class RouteCalculationError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'RouteCalculationError';
  }
}

/**
 * Utility: Format distance in nautical miles
 */
export function formatDistance(distanceNm: number): string {
  if (distanceNm < 1) {
    return `${(distanceNm * 1852).toFixed(0)} m`;
  }
  return `${distanceNm.toFixed(1)} nm`;
}

/**
 * Utility: Format duration in hours
 */
export function formatDuration(hours: number): string {
  const days = Math.floor(hours / 24);
  const remainingHours = Math.floor(hours % 24);
  const minutes = Math.round((hours % 1) * 60);

  if (days > 0) {
    return `${days}d ${remainingHours}h ${minutes}m`;
  } else if (remainingHours > 0) {
    return `${remainingHours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Utility: Format speed in knots
 */
export function formatSpeed(knots: number): string {
  return `${knots.toFixed(1)} kts`;
}

/**
 * Utility: Format wind speed with Beaufort scale
 */
export function formatWindSpeed(knots: number): string {
  const beaufort = getBeaufortScale(knots);
  return `${knots.toFixed(1)} kts (${beaufort.name})`;
}

/**
 * Get Beaufort scale for wind speed
 */
export function getBeaufortScale(knots: number): {
  force: number;
  name: string;
  description: string;
} {
  if (knots < 1) return { force: 0, name: 'Calm', description: 'Sea like a mirror' };
  if (knots < 4) return { force: 1, name: 'Light air', description: 'Ripples without crests' };
  if (knots < 7) return { force: 2, name: 'Light breeze', description: 'Small wavelets' };
  if (knots < 11) return { force: 3, name: 'Gentle breeze', description: 'Large wavelets' };
  if (knots < 17) return { force: 4, name: 'Moderate breeze', description: 'Small waves' };
  if (knots < 22) return { force: 5, name: 'Fresh breeze', description: 'Moderate waves' };
  if (knots < 28) return { force: 6, name: 'Strong breeze', description: 'Large waves' };
  if (knots < 34) return { force: 7, name: 'Near gale', description: 'Sea heaps up' };
  if (knots < 41) return { force: 8, name: 'Gale', description: 'Moderately high waves' };
  if (knots < 48) return { force: 9, name: 'Strong gale', description: 'High waves' };
  if (knots < 56) return { force: 10, name: 'Storm', description: 'Very high waves' };
  if (knots < 64) return { force: 11, name: 'Violent storm', description: 'Exceptionally high waves' };
  return { force: 12, name: 'Hurricane', description: 'Air filled with foam' };
}

/**
 * Utility: Format wave height
 */
export function formatWaveHeight(meters: number): string {
  return `${meters.toFixed(2)} m`;
}

/**
 * Utility: Get severity color based on warning severity
 */
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'danger':
      return 'text-red-500';
    case 'warning':
      return 'text-yellow-500';
    case 'info':
      return 'text-blue-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Utility: Get severity icon based on warning severity
 */
export function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'danger':
      return '⚠️';
    case 'warning':
      return '⚡';
    case 'info':
      return 'ℹ️';
    default:
      return '•';
  }
}

