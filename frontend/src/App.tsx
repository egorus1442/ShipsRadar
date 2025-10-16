import { useState, useRef } from 'react';
import { MapView } from './components/Map';
import { RouteInputPanel } from './components/RouteInputPanel';
import { validateConfig } from './config';
import type {
  MapMarker,
  MapClickEvent,
  LocationInputState,
  Coordinates,
} from './types';

function App() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [mapClickMode, setMapClickMode] = useState<'start' | 'end' | null>(null);
  const routeInputRef = useRef<any>(null);

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
  const handleCalculateRoute = (
    start: LocationInputState,
    end: LocationInputState,
    departureTime: Date
  ) => {
    console.log('Calculate route:', {
      start: start.coordinates,
      end: end.coordinates,
      departureTime,
    });

    // TODO: This will be implemented in Stage 5
    alert(
      `Route calculation will be implemented in Stage 5!\n\n` +
        `From: ${start.value}\n` +
        `To: ${end.value}\n` +
        `Departure: ${departureTime.toLocaleString()}`
    );
  };

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
            <div className="px-3 py-1 bg-blue-900/20 border border-blue-700 rounded text-blue-400 text-sm">
              Stage 3 Complete ✓
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Left Panel - Route Input */}
        <aside className="lg:w-96 flex-shrink-0">
          <RouteInputPanel
            ref={routeInputRef}
            onCalculateRoute={handleCalculateRoute}
            onStartLocationChange={handleStartLocationChange}
            onEndLocationChange={handleEndLocationChange}
            onMapClickMode={handleMapClickModeChange}
          />

          {/* Instructions */}
          <div className="mt-4 bg-app-panel rounded-lg border border-app-border p-4">
            <h3 className="text-sm font-medium text-app-text mb-3">
              Stage 3 Features ✓
            </h3>
            <ul className="space-y-2 text-xs text-app-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Location input with autocomplete</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Mapbox Geocoding API integration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Coordinate parsing (decimal, DMS)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Reverse geocoding</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Click on map to set location</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>DateTimePicker for departure</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Interactive markers on map</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Input validation</span>
              </li>
            </ul>
          </div>

          {/* Map click mode indicator */}
          {mapClickMode && (
            <div className="mt-4 bg-app-accent/20 border border-app-accent rounded-lg p-4 animate-pulse">
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

        {/* Map View - Main Area */}
        <div className="flex-1 bg-app-panel rounded-lg border border-app-border overflow-hidden min-h-[600px] relative">
          <MapView
            onMapClick={handleMapClick}
            markers={markers}
            className="w-full h-full"
          />
          
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
      </main>

      {/* Footer */}
      <footer className="bg-app-panel border-t border-app-border px-6 py-3 text-center text-sm text-app-text-secondary">
        <p>
          ShipsRadar MVP - Stage 3 Complete ✓ | Next: Stage 4 (Weather Service)
        </p>
      </footer>
    </div>
  );
}

export default App;
