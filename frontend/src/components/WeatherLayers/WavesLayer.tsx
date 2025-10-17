/**
 * Waves Layer Component
 * Displays wave height as a heatmap using deck.gl
 */

import { useEffect, useMemo } from 'react';
import { ScatterplotLayer } from '@deck.gl/layers';
import type { WeatherDataPoint } from '../../services/weatherApi';

export interface WavesLayerProps {
  data: WeatherDataPoint[];
  visible?: boolean;
  opacity?: number;
  showHeatmap?: boolean;
  onLayersUpdate?: (layers: any[]) => void;
}

// Color scale for wave height (meters)
const WAVE_COLOR_SCALE = [
  { threshold: 0, color: [30, 60, 140, 180] },        // Deep blue (calm)
  { threshold: 1, color: [50, 120, 180, 200] },       // Blue (light waves)
  { threshold: 2, color: [100, 200, 200, 210] },      // Cyan (moderate waves)
  { threshold: 3, color: [200, 200, 100, 220] },      // Yellow (significant waves)
  { threshold: 4, color: [255, 150, 50, 230] },       // Orange (high waves)
  { threshold: 5, color: [255, 50, 50, 240] },        // Red (very high waves)
];

function getWaveColor(height: number): [number, number, number, number] {
  for (let i = WAVE_COLOR_SCALE.length - 1; i >= 0; i--) {
    if (height >= WAVE_COLOR_SCALE[i].threshold) {
      return WAVE_COLOR_SCALE[i].color as [number, number, number, number];
    }
  }
  return WAVE_COLOR_SCALE[0].color as [number, number, number, number];
}

/**
 * Get interpolated intensity for heatmap
 */
function getWaveIntensity(height: number): number {
  // Normalize to 0-1 scale, capping at 10 meters
  return Math.min(height / 10, 1);
}

export function WavesLayer({
  data,
  visible = true,
  opacity = 0.7,
  showHeatmap = false,
  onLayersUpdate,
}: WavesLayerProps) {
  // Note: HeatmapLayer requires @deck.gl/aggregation-layers package
  // For MVP, we'll use ScatterplotLayer with larger radius for similar effect
  const heatmapLayer = useMemo(() => {
    if (!visible || !showHeatmap || data.length === 0) {
      return null;
    }

    // Using ScatterplotLayer as alternative to HeatmapLayer
    return new ScatterplotLayer({
      id: 'waves-heatmap',
      data: data,
      getPosition: (d: WeatherDataPoint) => [d.lng, d.lat, 0],
      getFillColor: (d: WeatherDataPoint) => {
        const color = getWaveColor(d.height || 0);
        return [color[0], color[1], color[2], color[3] * opacity * 0.4];
      },
      getRadius: 40000, // Large radius for heatmap effect
      radiusMinPixels: 8,
      radiusMaxPixels: 20,
      pickable: false,
    });
  }, [data, visible, showHeatmap, opacity]);

  // Scatterplot layer for discrete wave height points
  const scatterLayer = useMemo(() => {
    if (!visible || data.length === 0) {
      return null;
    }

    return new ScatterplotLayer({
      id: 'waves-scatter',
      data: data,
      getPosition: (d: WeatherDataPoint) => [d.lng, d.lat, 0],
      getFillColor: (d: WeatherDataPoint) => {
        const color = getWaveColor(d.height || 0);
        return [color[0], color[1], color[2], color[3] * opacity];
      },
      getRadius: 20000, // meters
      radiusMinPixels: 3,
      radiusMaxPixels: 10,
      pickable: true,
      onHover: (info: any) => {
        if (info.object) {
          const d = info.object as WeatherDataPoint;
          console.log(
            `Wave Height: ${d.height?.toFixed(2)}m${
              d.period ? `, Period: ${d.period.toFixed(1)}s` : ''
            }`
          );
        }
      },
    });
  }, [data, visible, opacity]);

  // Update layers
  useEffect(() => {
    const layers = [heatmapLayer, scatterLayer].filter(Boolean);
    onLayersUpdate?.(layers);
  }, [heatmapLayer, scatterLayer, onLayersUpdate]);

  return null; // This component doesn't render DOM elements
}

export default WavesLayer;

