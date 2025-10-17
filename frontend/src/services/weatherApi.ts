/**
 * Weather API Service
 * Handles fetching weather layer data for map visualization
 */

import { config } from '../config';

export interface WeatherLayerRequest {
  layer_type: 'wind' | 'waves' | 'currents' | 'temperature';
  bbox: [number, number, number, number]; // [west, south, east, north]
  timestamp?: string; // ISO format
  resolution?: 'low' | 'medium' | 'high';
}

export interface WeatherLayerResponse {
  layer_type: string;
  bbox: number[];
  timestamp: string;
  data_points: WeatherDataPoint[];
  metadata: {
    resolution?: string;
    point_count?: number;
    source?: string;
  };
}

export interface WeatherDataPoint {
  lat: number;
  lng: number;
  // Wind layer
  speed?: number;
  direction?: number;
  u?: number;
  v?: number;
  gust?: number;
  // Waves layer
  height?: number;
  period?: number;
  // Temperature layer
  temperature?: number;
  // Common
  timestamp: string;
}

export class WeatherApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'WeatherApiError';
  }
}

/**
 * Fetch weather layer data for map visualization
 */
export async function fetchWeatherLayer(
  request: WeatherLayerRequest
): Promise<WeatherLayerResponse> {
  try {
    const response = await fetch(`${config.api.baseUrl}/api/weather/layer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new WeatherApiError(
        errorData.detail || `Failed to fetch weather layer: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof WeatherApiError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new WeatherApiError(
        `Network error during weather layer fetch: ${error.message}`
      );
    }

    throw new WeatherApiError('Unknown error occurred while fetching weather layer');
  }
}

/**
 * Get weather data for the visible map bounds
 */
export async function fetchWeatherForBounds(
  layerType: 'wind' | 'waves' | 'currents' | 'temperature',
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  },
  timestamp?: Date,
  resolution: 'low' | 'medium' | 'high' = 'medium'
): Promise<WeatherLayerResponse> {
  const bbox: [number, number, number, number] = [
    bounds.west,
    bounds.south,
    bounds.east,
    bounds.north,
  ];

  const request: WeatherLayerRequest = {
    layer_type: layerType,
    bbox,
    timestamp: timestamp ? timestamp.toISOString() : undefined,
    resolution,
  };

  return fetchWeatherLayer(request);
}

/**
 * Cache for weather layer data
 */
class WeatherLayerCache {
  private cache: Map<string, { data: WeatherLayerResponse; timestamp: number }> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  private makeKey(request: WeatherLayerRequest): string {
    return `${request.layer_type}_${request.bbox.join(',')}_${request.timestamp || 'now'}_${request.resolution || 'medium'}`;
  }

  get(request: WeatherLayerRequest): WeatherLayerResponse | null {
    const key = this.makeKey(request);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(request: WeatherLayerRequest, data: WeatherLayerResponse): void {
    const key = this.makeKey(request);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Singleton cache instance
const weatherCache = new WeatherLayerCache();

/**
 * Fetch weather layer with caching
 */
export async function fetchWeatherLayerCached(
  request: WeatherLayerRequest
): Promise<WeatherLayerResponse> {
  // Check cache first
  const cached = weatherCache.get(request);
  if (cached) {
    console.log('Weather layer cache hit:', request.layer_type);
    return cached;
  }

  // Fetch fresh data
  const data = await fetchWeatherLayer(request);

  // Store in cache
  weatherCache.set(request, data);

  return data;
}

/**
 * Clear weather layer cache
 */
export function clearWeatherCache(): void {
  weatherCache.clear();
}

/**
 * Get cache statistics
 */
export function getWeatherCacheStats(): { size: number } {
  return {
    size: weatherCache.size(),
  };
}

