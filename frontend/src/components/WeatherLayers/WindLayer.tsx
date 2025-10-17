/**
 * Wind Layer Component
 * Displays animated wind particles using deck.gl
 */

import { useEffect, useMemo } from 'react';
import { ScatterplotLayer, LineLayer } from '@deck.gl/layers';
import type { WeatherDataPoint } from '../../services/weatherApi';

export interface WindParticle {
  id: string;
  position: [number, number];
  velocity: [number, number];
  age: number;
  maxAge: number;
  color: [number, number, number, number];
}

export interface WindLayerProps {
  data: WeatherDataPoint[];
  visible?: boolean;
  opacity?: number;
  particleCount?: number;
  onLayersUpdate?: (layers: any[]) => void;
}

// Color scale based on wind speed (knots)
const WIND_COLOR_SCALE = [
  { threshold: 0, color: [100, 150, 255, 200] },      // Light blue (calm)
  { threshold: 10, color: [100, 200, 100, 220] },     // Green (light breeze)
  { threshold: 20, color: [255, 255, 100, 230] },     // Yellow (moderate wind)
  { threshold: 30, color: [255, 150, 50, 240] },      // Orange (strong wind)
  { threshold: 40, color: [255, 50, 50, 250] },       // Red (gale)
];

function getWindColor(speed: number): [number, number, number, number] {
  for (let i = WIND_COLOR_SCALE.length - 1; i >= 0; i--) {
    if (speed >= WIND_COLOR_SCALE[i].threshold) {
      return WIND_COLOR_SCALE[i].color as [number, number, number, number];
    }
  }
  return WIND_COLOR_SCALE[0].color as [number, number, number, number];
}

/**
 * Interpolate wind vector at a given position
 */
function interpolateWind(
  position: [number, number],
  windData: WeatherDataPoint[]
): { u: number; v: number; speed: number } | null {
  if (windData.length === 0) {
    return null;
  }

  // Find nearest wind data point (simple nearest neighbor)
  let nearest = windData[0];
  let minDist = Infinity;

  for (const point of windData) {
    const dx = point.lng - position[0];
    const dy = point.lat - position[1];
    const dist = dx * dx + dy * dy;

    if (dist < minDist) {
      minDist = dist;
      nearest = point;
    }
  }

  if (nearest.u !== undefined && nearest.v !== undefined) {
    return {
      u: nearest.u,
      v: nearest.v,
      speed: nearest.speed || Math.sqrt(nearest.u ** 2 + nearest.v ** 2),
    };
  }

  return null;
}

/**
 * Create wind particle system
 */
function createWindParticles(
  windData: WeatherDataPoint[],
  count: number,
  bounds: { west: number; south: number; east: number; north: number }
): WindParticle[] {
  const particles: WindParticle[] = [];

  for (let i = 0; i < count; i++) {
    const lng = bounds.west + Math.random() * (bounds.east - bounds.west);
    const lat = bounds.south + Math.random() * (bounds.north - bounds.south);

    const wind = interpolateWind([lng, lat], windData);
    
    if (wind) {
      particles.push({
        id: `particle-${i}`,
        position: [lng, lat],
        velocity: [wind.u * 0.001, wind.v * 0.001], // Scale down for visualization
        age: Math.random() * 100,
        maxAge: 100 + Math.random() * 50,
        color: getWindColor(wind.speed),
      });
    }
  }

  return particles;
}

export function WindLayer({
  data,
  visible = true,
  opacity = 0.8,
  particleCount = 5000,
  onLayersUpdate,
}: WindLayerProps) {
  // Calculate bounds from data
  const bounds = useMemo(() => {
    if (data.length === 0) {
      return { west: -180, south: -90, east: 180, north: 90 };
    }

    let west = Infinity,
      south = Infinity,
      east = -Infinity,
      north = -Infinity;

    data.forEach((point) => {
      west = Math.min(west, point.lng);
      east = Math.max(east, point.lng);
      south = Math.min(south, point.lat);
      north = Math.max(north, point.lat);
    });

    return { west, south, east, north };
  }, [data]);

  // Create wind visualization layer (vector field)
  const windVectorLayer = useMemo(() => {
    if (!visible || data.length === 0) {
      return null;
    }

    // Sample data for vector arrows (not all points to avoid clutter)
    const sampledData = data.filter((_, index) => index % 3 === 0);

    return new LineLayer({
      id: 'wind-vectors',
      data: sampledData,
      getSourcePosition: (d: WeatherDataPoint) => [d.lng, d.lat, 0],
      getTargetPosition: (d: WeatherDataPoint) => {
        const scale = 0.15; // Arrow length scale
        const u = (d.u || 0) * scale;
        const v = (d.v || 0) * scale;
        return [d.lng + u, d.lat + v, 0];
      },
      getColor: (d: WeatherDataPoint) => {
        const color = getWindColor(d.speed || 0);
        return [color[0], color[1], color[2], color[3] * opacity];
      },
      getWidth: 2,
      widthMinPixels: 1,
      widthMaxPixels: 3,
      pickable: false,
    });
  }, [data, visible, opacity]);

  // Create wind speed heatmap layer (dots)
  const windSpeedLayer = useMemo(() => {
    if (!visible || data.length === 0) {
      return null;
    }

    return new ScatterplotLayer({
      id: 'wind-speed',
      data: data,
      getPosition: (d: WeatherDataPoint) => [d.lng, d.lat, 0],
      getFillColor: (d: WeatherDataPoint) => {
        const color = getWindColor(d.speed || 0);
        return [color[0], color[1], color[2], color[3] * opacity * 0.6];
      },
      getRadius: 15000, // meters
      radiusMinPixels: 2,
      radiusMaxPixels: 8,
      pickable: true,
      onHover: (info: any) => {
        if (info.object) {
          const d = info.object as WeatherDataPoint;
          console.log(`Wind: ${d.speed?.toFixed(1)} knots, Direction: ${d.direction?.toFixed(0)}°`);
        }
      },
    });
  }, [data, visible, opacity]);

  // Update layers
  useEffect(() => {
    const layers = [windSpeedLayer, windVectorLayer].filter(Boolean);
    console.log('WindLayer: Updating layers, count:', layers.length, 'visible:', visible, 'data points:', data.length);
    onLayersUpdate?.(layers);
  }, [windSpeedLayer, windVectorLayer, onLayersUpdate, visible, data.length]);

  return null; // This component doesn't render DOM elements
}

export default WindLayer;

