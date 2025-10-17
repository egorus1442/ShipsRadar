/**
 * Weather Layers Manager Component
 * Manages loading and rendering of weather visualization layers
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { WindLayer } from './WindLayer';
import { WavesLayer } from './WavesLayer';
import { CurrentsLayer } from './CurrentsLayer';
import { fetchWeatherForBounds, type WeatherDataPoint } from '../../services/weatherApi';

export interface WeatherLayersConfig {
  wind: {
    enabled: boolean;
    opacity: number;
  };
  waves: {
    enabled: boolean;
    opacity: number;
    showHeatmap: boolean;
  };
  currents: {
    enabled: boolean;
    opacity: number;
    showVectors: boolean;
  };
}

export interface WeatherLayersManagerProps {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  timestamp?: Date;
  config: WeatherLayersConfig;
  onLayersUpdate: (layers: any[]) => void;
  onLoadingChange?: (loading: boolean) => void;
  onError?: (error: string) => void;
}

export function WeatherLayersManager({
  bounds,
  timestamp,
  config,
  onLayersUpdate,
  onLoadingChange,
  onError,
}: WeatherLayersManagerProps) {
  const [windData, setWindData] = useState<WeatherDataPoint[]>([]);
  const [wavesData, setWavesData] = useState<WeatherDataPoint[]>([]);
  const [currentsData, setCurrentsData] = useState<WeatherDataPoint[]>([]);
  const [loadingStates, setLoadingStates] = useState({
    wind: false,
    waves: false,
    currents: false,
  });

  // Collect all layers from child components
  const [allLayers, setAllLayers] = useState<any[]>([]);

  const handleLayersUpdate = useCallback((layerType: string, layers: any[]) => {
    setAllLayers((prev) => {
      // Remove old layers of this type
      const filtered = prev.filter((layer) => !layer.id.startsWith(layerType));
      // Add new layers
      const newLayers = [...filtered, ...layers];
      
      // Only update if actually changed
      if (JSON.stringify(prev.map(l => l.id).sort()) === JSON.stringify(newLayers.map(l => l.id).sort())) {
        return prev;
      }
      
      return newLayers;
    });
  }, []);

  // Update parent when layers change
  useEffect(() => {
    onLayersUpdate(allLayers);
  }, [allLayers, onLayersUpdate]);

  // Update loading state
  useEffect(() => {
    const isLoading = Object.values(loadingStates).some((loading) => loading);
    onLoadingChange?.(isLoading);
  }, [loadingStates, onLoadingChange]);

  // Fetch wind data
  useEffect(() => {
    if (!config.wind.enabled) {
      setWindData([]);
      return;
    }

    console.log('Fetching wind data for bounds:', bounds);
    let cancelled = false;

    const fetchData = async () => {
      setLoadingStates((prev) => ({ ...prev, wind: true }));
      
      try {
        const response = await fetchWeatherForBounds(
          'wind',
          bounds,
          timestamp,
          'low'  // Use low resolution for better performance with large areas
        );
        
        if (!cancelled) {
          console.log('Wind data received:', response.data_points.length, 'points');
          setWindData(response.data_points);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching wind data:', error);
          onError?.(`Failed to load wind layer: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setWindData([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingStates((prev) => ({ ...prev, wind: false }));
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [config.wind.enabled, bounds, timestamp, onError]);

  // Fetch waves data
  useEffect(() => {
    if (!config.waves.enabled) {
      setWavesData([]);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setLoadingStates((prev) => ({ ...prev, waves: true }));
      
      try {
        const response = await fetchWeatherForBounds(
          'waves',
          bounds,
          timestamp,
          'low'  // Use low resolution for better performance with large areas
        );
        
        if (!cancelled) {
          setWavesData(response.data_points);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching waves data:', error);
          onError?.(`Failed to load waves layer: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setWavesData([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingStates((prev) => ({ ...prev, waves: false }));
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [config.waves.enabled, bounds, timestamp, onError]);

  // Fetch currents data
  useEffect(() => {
    if (!config.currents.enabled) {
      setCurrentsData([]);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setLoadingStates((prev) => ({ ...prev, currents: true }));
      
      try {
        const response = await fetchWeatherForBounds(
          'currents',
          bounds,
          timestamp,
          'low' // Use lower resolution for currents to improve performance
        );
        
        if (!cancelled) {
          setCurrentsData(response.data_points);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching currents data:', error);
          onError?.(`Failed to load currents layer: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setCurrentsData([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingStates((prev) => ({ ...prev, currents: false }));
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [config.currents.enabled, bounds, timestamp, onError]);

  return (
    <>
      {/* Wind Layer */}
      {config.wind.enabled && (
        <WindLayer
          data={windData}
          visible={config.wind.enabled}
          opacity={config.wind.opacity}
          onLayersUpdate={(layers) => handleLayersUpdate('wind', layers)}
        />
      )}

      {/* Waves Layer */}
      {config.waves.enabled && (
        <WavesLayer
          data={wavesData}
          visible={config.waves.enabled}
          opacity={config.waves.opacity}
          showHeatmap={config.waves.showHeatmap}
          onLayersUpdate={(layers) => handleLayersUpdate('waves', layers)}
        />
      )}

      {/* Currents Layer */}
      {config.currents.enabled && (
        <CurrentsLayer
          data={currentsData}
          visible={config.currents.enabled}
          opacity={config.currents.opacity}
          showVectors={config.currents.showVectors}
          onLayersUpdate={(layers) => handleLayersUpdate('currents', layers)}
        />
      )}
    </>
  );
}

export default WeatherLayersManager;

