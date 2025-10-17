import { useState, useRef, useCallback, useMemo } from 'react';
import { MapView } from './components/Map';
import { RouteInputPanel } from './components/RouteInputPanel';
import { RouteLayer } from './components/RouteLayer';
import { RouteMetrics } from './components/RouteMetrics';
import { WeatherWarnings } from './components/WeatherWarnings';
import { WaypointsTable } from './components/WaypointsTable';
import { WeatherLayersManager, type WeatherLayersConfig } from './components/WeatherLayers';
import { validateConfig } from './config';
import { calculateRoute, RouteCalculationError } from './services/routeApi';
import type {
  MapMarker,
  MapClickEvent,
  LocationInputState,
  Coordinates,
  RouteResponse,
} from './types';

function App() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [mapClickMode, setMapClickMode] = useState<'start' | 'end' | null>(null);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [selectedWaypointId, setSelectedWaypointId] = useState<number | undefined>(undefined);
  const routeInputRef = useRef<any>(null);

  // Weather layers state
  const [weatherLayers, setWeatherLayers] = useState<any[]>([]);
  const [weatherLayersConfig, setWeatherLayersConfig] = useState<WeatherLayersConfig>({
    wind: { enabled: false, opacity: 0.7 },
    waves: { enabled: false, opacity: 0.7, showHeatmap: false },
    currents: { enabled: false, opacity: 0.8, showVectors: true },
  });
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  
  // Map bounds for weather layers - use visible map area (memoized to prevent re-renders)
  const mapBounds = useMemo(() => ({
    north: 60,
    south: -60,
    east: 180,
    west: -180,
  }), []);

  // Validate configuration on mount
  const configValidation = validateConfig();
  if (!configValidation.isValid) {
    console.warn('Configuration warnings:', configValidation.warnings);
  }

  // Handle map click
  const handleMapClick = (event: MapClickEvent) => {
    const { coordinates } = event;
    console.log('Map clicked at:', coordinates);

    // If in map click mode, set the location
    if (mapClickMode && routeInputRef.current) {
      routeInputRef.current.setLocationFromCoordinates(mapClickMode, coordinates);
    }
  };

  // Handle start location change
  const handleStartLocationChange = (location: LocationInputState) => {
    if (location.coordinates) {
      // Update or add start marker
      setMarkers((prev) => {
        const filtered = prev.filter((m) => m.id !== 'start-point');
        return [
          ...filtered,
          {
            id: 'start-point',
            coordinates: location.coordinates!,
            label: location.selectedFeature?.text || 'Start',
            type: 'start',
          },
        ];
      });
    } else {
      // Remove start marker if coordinates cleared
      setMarkers((prev) => prev.filter((m) => m.id !== 'start-point'));
    }
  };

  // Handle end location change
  const handleEndLocationChange = (location: LocationInputState) => {
    if (location.coordinates) {
      // Update or add end marker
      setMarkers((prev) => {
        const filtered = prev.filter((m) => m.id !== 'end-point');
        return [
          ...filtered,
          {
            id: 'end-point',
            coordinates: location.coordinates!,
            label: location.selectedFeature?.text || 'End',
            type: 'end',
          },
        ];
      });
    } else {
      // Remove end marker if coordinates cleared
      setMarkers((prev) => prev.filter((m) => m.id !== 'end-point'));
    }
  };

  // Handle map click mode change
  const handleMapClickModeChange = (mode: 'start' | 'end' | null) => {
    setMapClickMode(mode);
  };

  // Handle calculate route
  const handleCalculateRoute = async (
    start: LocationInputState,
    end: LocationInputState,
    departureTime: Date
  ) => {
    if (!start.coordinates || !end.coordinates) {
      setRouteError('Please provide valid start and end coordinates');
      return;
    }

    setIsCalculatingRoute(true);
    setRouteError(null);
    setRoute(null);

    try {
      console.log('Calculating route:', {
        start: start.coordinates,
        end: end.coordinates,
        departureTime,
      });

      const routeResponse = await calculateRoute(
        start.coordinates,
        end.coordinates,
        departureTime,
        {
          vesselSpeed: 15.0,
          waypointsCount: 20,
          avoidExtremeWeather: true,
          extremeWindThreshold: 30.0,
          extremeWaveThreshold: 5.0,
        }
      );

      console.log('Route calculated successfully:', routeResponse);
      setRoute(routeResponse);
      setSelectedWaypointId(undefined);

      // Remove start/end markers (route will show waypoints instead)
      setMarkers([]);
    } catch (error) {
      console.error('Route calculation error:', error);
      
      if (error instanceof RouteCalculationError) {
        setRouteError(error.message);
      } else if (error instanceof Error) {
        setRouteError(`Failed to calculate route: ${error.message}`);
      } else {
        setRouteError('An unexpected error occurred while calculating the route');
      }
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Handle waypoint click
  const handleWaypointClick = (waypointId: number) => {
    setSelectedWaypointId(waypointId);
    console.log('Selected waypoint:', waypointId);
  };

  // Handle warning click (navigate to waypoint)
  const handleWarningClick = (waypointId: number) => {
    setSelectedWaypointId(waypointId);
    // TODO: Could also zoom to waypoint on map
  };

  // Handle weather layers update
  const handleWeatherLayersUpdate = useCallback((layers: any[]) => {
    setWeatherLayers((prev) => {
      // Only update if layers actually changed
      if (prev.length === layers.length && 
          prev.every((l, i) => l.id === layers[i]?.id)) {
        return prev;
      }
      return layers;
    });
  }, []);

  // Toggle weather layer
  const toggleWeatherLayer = useCallback((layerType: 'wind' | 'waves' | 'currents') => {
    setWeatherLayersConfig((prev) => {
      const newConfig = {
        ...prev,
        [layerType]: {
          ...prev[layerType],
          enabled: !prev[layerType].enabled,
        },
      };
      console.log(`Weather layer ${layerType} toggled:`, newConfig[layerType].enabled);
      return newConfig;
    });
  }, []);

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col">
      {/* Header */}
      <header className="bg-app-panel border-b border-app-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🚢 ShipsRadar MVP</h1>
            <p className="text-sm text-app-text-secondary">
              Ship Route Optimization with Weather Data
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-green-900/20 border border-green-700 rounded text-green-400 text-sm">
              Stage 7 Complete ✓
            </div>
            {route && (
              <div className="px-3 py-1 bg-blue-900/20 border border-blue-700 rounded text-blue-400 text-sm">
                {route.waypoints.length} waypoints
              </div>
            )}
            {/* Weather Layers Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleWeatherLayer('wind')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  weatherLayersConfig.wind.enabled
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Toggle Wind Layer"
              >
                💨 Wind
              </button>
              <button
                onClick={() => toggleWeatherLayer('waves')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  weatherLayersConfig.waves.enabled
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Toggle Waves Layer"
              >
                🌊 Waves
              </button>
              <button
                onClick={() => toggleWeatherLayer('currents')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  weatherLayersConfig.currents.enabled
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Toggle Currents Layer"
              >
                🌀 Currents
              </button>
              {isLoadingWeather && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-app-accent"></div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Left Panel - Route Input */}
        <aside className="lg:w-96 flex-shrink-0 space-y-4">
          <RouteInputPanel
            ref={routeInputRef}
            onCalculateRoute={handleCalculateRoute}
            onStartLocationChange={handleStartLocationChange}
            onEndLocationChange={handleEndLocationChange}
            onMapClickMode={handleMapClickModeChange}
          />

          {/* Loading state */}
          {isCalculatingRoute && (
            <div className="bg-app-panel rounded-lg border border-app-border p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-app-accent"></div>
                <div className="text-sm text-app-text">Calculating optimal route...</div>
              </div>
            </div>
          )}

          {/* Error state */}
          {routeError && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-red-500 text-xl">⚠️</div>
                <div>
                  <div className="text-sm font-medium text-red-400 mb-1">
                    Route Calculation Error
                  </div>
                  <div className="text-xs text-red-300">{routeError}</div>
                </div>
              </div>
            </div>
          )}

          {/* Route Metrics */}
          {route && <RouteMetrics metrics={route.metrics} />}

          {/* Weather Warnings */}
          {route && (
            <WeatherWarnings
              warnings={route.warnings}
              onWarningClick={handleWarningClick}
            />
          )}

          {/* Weather loading/error states */}
          {isLoadingWeather && (
            <div className="bg-app-panel rounded-lg border border-app-border p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-app-accent"></div>
                <div className="text-sm text-app-text">Loading weather layers...</div>
              </div>
            </div>
          )}

          {weatherError && (
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-500 text-xl">⚠️</div>
                <div>
                  <div className="text-sm font-medium text-yellow-400 mb-1">
                    Weather Layer Warning
                  </div>
                  <div className="text-xs text-yellow-300">{weatherError}</div>
                </div>
              </div>
            </div>
          )}

          {/* Map click mode indicator */}
          {mapClickMode && (
            <div className="bg-app-accent/20 border border-app-accent rounded-lg p-4 animate-pulse">
              <div className="flex items-center gap-2 text-app-accent font-medium">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Click on map to set {mapClickMode === 'start' ? 'START' : 'END'} point
                </span>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Map View */}
          <div className="flex-1 bg-app-panel rounded-lg border border-app-border overflow-hidden min-h-[600px] relative">
            <MapView
              onMapClick={handleMapClick}
              markers={markers}
              className="w-full h-full"
              deckLayers={weatherLayers}
            >
              {/* Route Layer */}
              {route && (
                <RouteLayer
                  route={route}
                  selectedWaypointId={selectedWaypointId}
                  onWaypointClick={handleWaypointClick}
                />
              )}

              {/* Weather Layers Manager - only render if any layer is enabled */}
              {(weatherLayersConfig.wind.enabled || 
                weatherLayersConfig.waves.enabled || 
                weatherLayersConfig.currents.enabled) && (
                <WeatherLayersManager
                  bounds={mapBounds}
                  config={weatherLayersConfig}
                  onLayersUpdate={handleWeatherLayersUpdate}
                  onLoadingChange={setIsLoadingWeather}
                  onError={setWeatherError}
                />
              )}
            </MapView>
            
            {/* Map overlay cursor hint */}
            {mapClickMode && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-app-panel/95 border border-app-accent rounded-lg px-4 py-2 shadow-lg z-10">
                <div className="flex items-center gap-2 text-sm text-app-accent font-medium">
                  <svg className="w-4 h-4 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>Click anywhere on the map</span>
                </div>
              </div>
            )}
          </div>

          {/* Waypoints Table (Bottom) */}
          {route && route.waypoints.length > 0 && (
            <WaypointsTable
              waypoints={route.waypoints}
              selectedWaypointId={selectedWaypointId}
              onWaypointClick={handleWaypointClick}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-app-panel border-t border-app-border px-6 py-3 text-center text-sm text-app-text-secondary">
        <p>
          ShipsRadar MVP - Stage 7 Complete ✓ | Weather Visualization with Wind, Waves & Currents Layers
        </p>
      </footer>
    </div>
  );
}

export default App;
