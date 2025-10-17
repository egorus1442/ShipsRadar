import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { MapView } from './components/Map';
import { RouteLayer } from './components/RouteLayer';
import { WaypointsTable } from './components/WaypointsTable';
import { WeatherLayersManager, type WeatherLayersConfig } from './components/WeatherLayers';
import { type WeatherControlsConfig } from './components/WeatherControls';
import { TimeSlider } from './components/TimeSlider';
import { CompactSidebar } from './components/CompactSidebar';
import { CompactTopBar } from './components/CompactTopBar';
import { RoutePlanningModal } from './components/RoutePlanningModal';
import { WeatherLayersModal } from './components/WeatherLayersModal';
import { validateConfig } from './config';
import { calculateRoute, RouteCalculationError } from './services/routeApi';
import type {
  MapMarker,
  MapClickEvent,
  LocationInputState,
  RouteResponse,
  WeatherPoint,
} from './types';

function App() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [mapClickMode, setMapClickMode] = useState<'start' | 'end' | null>(null);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [selectedWaypointId, setSelectedWaypointId] = useState<number | undefined>(undefined);
  const routeInputRef = useRef<any>(null);

  // Modal states
  const [isRoutePlanningOpen, setIsRoutePlanningOpen] = useState(false);
  const [isWeatherLayersOpen, setIsWeatherLayersOpen] = useState(false);

  // Weather layers state
  const [weatherLayers, setWeatherLayers] = useState<any[]>([]);
  const [weatherLayersConfig, setWeatherLayersConfig] = useState<WeatherLayersConfig>({
    wind: { enabled: false, opacity: 0.7 },
    waves: { enabled: false, opacity: 0.7, showHeatmap: false },
    currents: { enabled: false, opacity: 0.8, showVectors: true },
  });
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  
  // Weather controls state
  const [weatherControlsConfig, setWeatherControlsConfig] = useState<WeatherControlsConfig>({
    wind: { enabled: false, opacity: 0.7 },
    waves: { enabled: false, opacity: 0.7 },
    currents: { enabled: false, opacity: 0.8 },
    precipitation: { enabled: false, opacity: 0.7 },
    temperature: { enabled: false, opacity: 0.7 },
  });
  const [showWeather, setShowWeather] = useState(false);
  
  // Time slider state
  const [forecastTime, setForecastTime] = useState<Date>(new Date());
  
  // Current weather point (for top bar display)
  const [currentWeatherPoint, setCurrentWeatherPoint] = useState<WeatherPoint | null>(null);
  
  // Map bounds for weather layers - use full world ocean coverage
  const mapBounds = useMemo(() => ({
    north: 85,
    south: -85,
    east: 180,
    west: -180,
  }), []);

  // Validate configuration on mount
  const configValidation = validateConfig();
  if (!configValidation.isValid) {
    console.warn('Configuration warnings:', configValidation.warnings);
  }

  // Listen for route planning modal open event
  useEffect(() => {
    const handleOpenRoutePlanning = () => {
      setIsRoutePlanningOpen(true);
    };
    window.addEventListener('openRoutePlanning', handleOpenRoutePlanning);
    return () => window.removeEventListener('openRoutePlanning', handleOpenRoutePlanning);
  }, []);

  // Handle map click
  const handleMapClick = (event: MapClickEvent) => {
    const { coordinates } = event;
    console.log('Map clicked at:', coordinates);

    // If in map click mode, notify the modal through an event
    if (mapClickMode) {
      window.dispatchEvent(new CustomEvent('mapCoordinatesSelected', {
        detail: { type: mapClickMode, coordinates }
      }));
    }
  };

  // Handle calculate route
  const handleCalculateRoute = async (
    start: LocationInputState,
    end: LocationInputState,
    departureTime: Date
  ) => {
    if (!start.coordinates || !end.coordinates) {
      console.error('Invalid coordinates');
      return;
    }

    setIsCalculatingRoute(true);
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

      // Remove markers
      setMarkers([]);
    } catch (error) {
      console.error('Route calculation error:', error);
      
      if (error instanceof RouteCalculationError) {
        alert(`Route calculation failed: ${error.message}`);
      } else if (error instanceof Error) {
        alert(`Failed to calculate route: ${error.message}`);
      } else {
        alert('An unexpected error occurred while calculating the route');
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

  // Handle weather layers update
  const handleWeatherLayersUpdate = useCallback((layers: any[]) => {
    setWeatherLayers((prev) => {
      if (prev.length === layers.length && 
          prev.every((l, i) => l.id === layers[i]?.id)) {
        return prev;
      }
      return layers;
    });
  }, []);

  // Handle weather controls config change
  const handleWeatherControlsChange = useCallback((config: WeatherControlsConfig) => {
    setWeatherControlsConfig(config);
    
    // Sync with weather layers config
    setWeatherLayersConfig({
      wind: { enabled: config.wind.enabled, opacity: config.wind.opacity },
      waves: { enabled: config.waves.enabled, opacity: config.waves.opacity, showHeatmap: false },
      currents: { enabled: config.currents.enabled, opacity: config.currents.opacity, showVectors: true },
    });
  }, []);

  // Handle show weather toggle
  const handleToggleWeather = useCallback(() => {
    setShowWeather((prev) => !prev);
  }, []);
  
  // Handle forecast time change
  const handleForecastTimeChange = useCallback((time: Date) => {
    setForecastTime(time);
    console.log('Forecast time changed to:', time);
  }, []);

  // Handle create new route
  const handleCreateNewRoute = () => {
    setRoute(null);
    setSelectedWaypointId(undefined);
    setMarkers([]);
    setIsRoutePlanningOpen(true);
  };

  return (
    <div className="h-screen bg-app-bg text-app-text flex flex-col overflow-hidden">
      {/* Compact Top Bar */}
      <CompactTopBar
        route={route}
        weatherData={currentWeatherPoint}
        forecastTime={forecastTime}
      />

      {/* Main Content - Fixed Height */}
      <main className="flex-1 flex overflow-hidden">
        {/* Compact Sidebar */}
        <CompactSidebar
          route={route}
          isCalculating={isCalculatingRoute}
          onCalculateRoute={handleCalculateRoute}
          onCreateNewRoute={handleCreateNewRoute}
          routeInputRef={routeInputRef}
          onStartLocationChange={() => {}}
          onEndLocationChange={() => {}}
          onMapClickMode={setMapClickMode}
          showWeather={showWeather}
          onToggleWeather={handleToggleWeather}
          onOpenWeatherLayers={() => setIsWeatherLayersOpen(true)}
        />

        {/* Map Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Map View - Takes remaining space */}
          <div className="flex-1 relative">
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

              {/* Weather Layers Manager */}
              {(weatherLayersConfig.wind.enabled || 
                weatherLayersConfig.waves.enabled || 
                weatherLayersConfig.currents.enabled) && (
                <WeatherLayersManager
                  bounds={mapBounds}
                  config={weatherLayersConfig}
                  timestamp={forecastTime}
                  onLayersUpdate={handleWeatherLayersUpdate}
                  onLoadingChange={setIsLoadingWeather}
                  onError={setWeatherError}
                />
              )}
            </MapView>

            {/* Map click mode indicator */}
            {mapClickMode && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-app-accent text-white px-4 py-2 rounded-lg shadow-lg z-10 animate-pulse">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <svg className="w-4 h-4 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>Click on map to set {mapClickMode === 'start' ? 'START' : 'END'} point</span>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoadingWeather && (
              <div className="absolute top-4 right-4 bg-app-panel border border-app-border rounded-lg px-3 py-2 shadow-lg z-10">
                <div className="flex items-center gap-2 text-xs text-app-accent">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-app-accent"></div>
                  <span>Loading weather...</span>
                </div>
              </div>
            )}
          </div>

          {/* Time Slider - Fixed at bottom */}
          <div className="border-t border-app-border bg-app-panel">
            <TimeSlider
              currentTime={forecastTime}
              onChange={handleForecastTimeChange}
            />
          </div>

          {/* Waypoints Table - Collapsible bottom panel */}
          {route && route.waypoints.length > 0 && (
            <div className="border-t border-app-border bg-app-panel max-h-32 overflow-auto">
              <WaypointsTable
                waypoints={route.waypoints}
                selectedWaypointId={selectedWaypointId}
                onWaypointClick={handleWaypointClick}
              />
            </div>
          )}
        </div>
      </main>

      {/* Route Planning Modal */}
      <RoutePlanningModal
        isOpen={isRoutePlanningOpen}
        onClose={() => {
          setIsRoutePlanningOpen(false);
          setMapClickMode(null);
        }}
        onCalculate={handleCalculateRoute}
        onMapClickMode={setMapClickMode}
      />

      {/* Weather Layers Modal */}
      <WeatherLayersModal
        isOpen={isWeatherLayersOpen}
        onClose={() => setIsWeatherLayersOpen(false)}
        config={weatherControlsConfig}
        onChange={handleWeatherControlsChange}
      />
    </div>
  );
}

export default App;
