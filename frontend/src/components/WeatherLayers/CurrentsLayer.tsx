/**
 * Currents Layer Component
 * Displays ocean currents as vector field using deck.gl
 */

import { useEffect, useMemo } from 'react';
import { LineLayer, ScatterplotLayer } from '@deck.gl/layers';
import type { WeatherDataPoint } from '../../services/weatherApi';

export interface CurrentsLayerProps {
  data: WeatherDataPoint[];
  visible?: boolean;
  opacity?: number;
  showVectors?: boolean;
  onLayersUpdate?: (layers: any[]) => void;
}

// Color scale for current speed (knots)
const CURRENT_COLOR_SCALE = [
  { threshold: 0, color: [150, 150, 150, 180] },      // Gray (no current)
  { threshold: 0.5, color: [100, 150, 255, 200] },    // Light blue (weak)
  { threshold: 1.0, color: [100, 200, 255, 220] },    // Cyan (moderate)
  { threshold: 2.0, color: [255, 200, 100, 230] },    // Yellow (strong)
  { threshold: 3.0, color: [255, 100, 50, 240] },     // Orange (very strong)
];

function getCurrentColor(speed: number): [number, number, number, number] {
  for (let i = CURRENT_COLOR_SCALE.length - 1; i >= 0; i--) {
    if (speed >= CURRENT_COLOR_SCALE[i].threshold) {
      return CURRENT_COLOR_SCALE[i].color as [number, number, number, number];
    }
  }
  return CURRENT_COLOR_SCALE[0].color as [number, number, number, number];
}

export function CurrentsLayer({
  data,
  visible = true,
  opacity = 0.8,
  showVectors = true,
  onLayersUpdate,
}: CurrentsLayerProps) {
  // Vector arrows layer
  const vectorLayer = useMemo(() => {
    if (!visible || !showVectors || data.length === 0) {
      return null;
    }

    // Filter out points with very weak currents for cleaner visualization
    const filteredData = data.filter((d) => {
      const speed = d.speed || (d.u && d.v ? Math.sqrt(d.u ** 2 + d.v ** 2) : 0);
      return speed > 0.1; // Only show currents > 0.1 knots
    });

    return new LineLayer({
      id: 'currents-vectors',
      data: filteredData,
      getSourcePosition: (d: WeatherDataPoint) => [d.lng, d.lat, 0],
      getTargetPosition: (d: WeatherDataPoint) => {
        // Arrow length proportional to current speed
        const u = d.u || 0;
        const v = d.v || 0;
        const speed = d.speed || Math.sqrt(u ** 2 + v ** 2);
        
        // Scale factor: longer arrows for stronger currents
        const scale = 0.2 * (1 + Math.log10(Math.max(speed, 0.1)));
        
        return [d.lng + u * scale, d.lat + v * scale, 0];
      },
      getColor: (d: WeatherDataPoint) => {
        const speed = d.speed || (d.u && d.v ? Math.sqrt(d.u ** 2 + d.v ** 2) * 1.94384 : 0);
        const color = getCurrentColor(speed);
        return [color[0], color[1], color[2], color[3] * opacity];
      },
      getWidth: (d: WeatherDataPoint) => {
        const speed = d.speed || 0;
        return Math.max(1, Math.min(5, speed * 0.5));
      },
      widthMinPixels: 1,
      widthMaxPixels: 4,
      pickable: false,
    });
  }, [data, visible, showVectors, opacity]);

  // Current speed dots layer
  const speedLayer = useMemo(() => {
    if (!visible || data.length === 0) {
      return null;
    }

    return new ScatterplotLayer({
      id: 'currents-speed',
      data: data,
      getPosition: (d: WeatherDataPoint) => [d.lng, d.lat, 0],
      getFillColor: (d: WeatherDataPoint) => {
        const speed = d.speed || (d.u && d.v ? Math.sqrt(d.u ** 2 + d.v ** 2) * 1.94384 : 0);
        const color = getCurrentColor(speed);
        return [color[0], color[1], color[2], color[3] * opacity * 0.5];
      },
      getRadius: 12000, // meters
      radiusMinPixels: 2,
      radiusMaxPixels: 6,
      pickable: true,
      onHover: (info: any) => {
        if (info.object) {
          const d = info.object as WeatherDataPoint;
          const speed = d.speed || (d.u && d.v ? Math.sqrt(d.u ** 2 + d.v ** 2) * 1.94384 : 0);
          const direction = d.direction !== undefined
            ? d.direction
            : d.u && d.v
            ? (Math.atan2(d.v, d.u) * 180 / Math.PI + 90) % 360
            : 0;
          
          console.log(`Current: ${speed.toFixed(2)} knots, Direction: ${direction.toFixed(0)}°`);
        }
      },
    });
  }, [data, visible, opacity]);

  // Update layers
  useEffect(() => {
    const layers = [speedLayer, vectorLayer].filter(Boolean);
    onLayersUpdate?.(layers);
  }, [speedLayer, vectorLayer, onLayersUpdate]);

  return null; // This component doesn't render DOM elements
}

export default CurrentsLayer;

