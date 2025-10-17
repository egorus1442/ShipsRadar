/**
 * RouteInputPanel Component
 * Main panel for route input with start/end locations and departure time
 */

import { useState, useImperativeHandle, forwardRef } from 'react';
import { LocationInput } from '../LocationInput';
import { DateTimePicker } from '../DateTimePicker';
import type {
  LocationInputState,
  Coordinates,
} from '../../types';
import { reverseGeocodeLocation } from '../../services/geocodingApi';

interface RouteInputPanelProps {
  onCalculateRoute?: (
    start: LocationInputState,
    end: LocationInputState,
    departureTime: Date
  ) => void;
  onStartLocationChange?: (location: LocationInputState) => void;
  onEndLocationChange?: (location: LocationInputState) => void;
  onMapClickMode?: (mode: 'start' | 'end' | null) => void;
  className?: string;
}

export const RouteInputPanel = forwardRef<any, RouteInputPanelProps>(function RouteInputPanel({
  onCalculateRoute,
  onStartLocationChange,
  onEndLocationChange,
  onMapClickMode,
  className = '',
}: RouteInputPanelProps, ref) {
  // State
  const [startLocation, setStartLocation] = useState<LocationInputState>({
    value: '',
    coordinates: null,
    selectedFeature: null,
    isValid: false,
  });

  const [endLocation, setEndLocation] = useState<LocationInputState>({
    value: '',
    coordinates: null,
    selectedFeature: null,
    isValid: false,
  });

  const [departureTime, setDepartureTime] = useState<Date>(new Date());
  const [mapClickMode, setMapClickMode] = useState<'start' | 'end' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle start location change
  const handleStartLocationChange = (location: LocationInputState) => {
    setStartLocation(location);
    if (onStartLocationChange) {
      onStartLocationChange(location);
    }
    // Disable map click mode when typing
    if (mapClickMode === 'start' && location.value) {
      setMapClickMode(null);
      if (onMapClickMode) {
        onMapClickMode(null);
      }
    }
  };

  // Handle end location change
  const handleEndLocationChange = (location: LocationInputState) => {
    setEndLocation(location);
    if (onEndLocationChange) {
      onEndLocationChange(location);
    }
    // Disable map click mode when typing
    if (mapClickMode === 'end' && location.value) {
      setMapClickMode(null);
      if (onMapClickMode) {
        onMapClickMode(null);
      }
    }
  };

  // Handle "Set on map" button click
  const handleSetOnMap = (type: 'start' | 'end') => {
    const newMode = mapClickMode === type ? null : type;
    setMapClickMode(newMode);
    if (onMapClickMode) {
      onMapClickMode(newMode);
    }
  };

  // Public method to set location from map click (will be called from parent)
  const setLocationFromCoordinates = async (
    type: 'start' | 'end',
    coordinates: Coordinates
  ) => {
    setIsProcessing(true);
    
    try {
      // Perform reverse geocoding
      const result = await reverseGeocodeLocation({ coordinates });
      
      const locationState: LocationInputState = {
        value: result.features[0]?.place_name || `${coordinates.lat.toFixed(4)}°, ${coordinates.lng.toFixed(4)}°`,
        coordinates,
        selectedFeature: result.features[0] || null,
        isValid: true,
      };

      if (type === 'start') {
        setStartLocation(locationState);
        if (onStartLocationChange) {
          onStartLocationChange(locationState);
        }
      } else {
        setEndLocation(locationState);
        if (onEndLocationChange) {
          onEndLocationChange(locationState);
        }
      }

      // Disable map click mode
      setMapClickMode(null);
      if (onMapClickMode) {
        onMapClickMode(null);
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      
      // Fallback: just set coordinates without name
      const locationState: LocationInputState = {
        value: `${coordinates.lat.toFixed(4)}°, ${coordinates.lng.toFixed(4)}°`,
        coordinates,
        selectedFeature: null,
        isValid: true,
      };

      if (type === 'start') {
        setStartLocation(locationState);
      } else {
        setEndLocation(locationState);
      }

      setMapClickMode(null);
      if (onMapClickMode) {
        onMapClickMode(null);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Expose method for parent component
  // This is a hack, ideally use ref or context, but keeping it simple for MVP
  (RouteInputPanel as any).setLocationFromCoordinates = setLocationFromCoordinates;

  // Handle calculate route
  const handleCalculateRoute = () => {
    if (!startLocation.isValid || !endLocation.isValid) {
      return;
    }

    if (onCalculateRoute) {
      onCalculateRoute(startLocation, endLocation, departureTime);
    }
  };

  // Swap start and end
  const handleSwapLocations = () => {
    const temp = startLocation;
    setStartLocation(endLocation);
    setEndLocation(temp);
    
    if (onStartLocationChange) {
      onStartLocationChange(endLocation);
    }
    if (onEndLocationChange) {
      onEndLocationChange(temp);
    }
  };

  // Expose method to parent via ref
  useImperativeHandle(ref, () => ({
    setLocationFromCoordinates,
  }));

  // Clear all
  const handleClearAll = () => {
    setStartLocation({
      value: '',
      coordinates: null,
      selectedFeature: null,
      isValid: false,
    });
    setEndLocation({
      value: '',
      coordinates: null,
      selectedFeature: null,
      isValid: false,
    });
    setDepartureTime(new Date());
    setMapClickMode(null);
    
    if (onStartLocationChange) {
      onStartLocationChange({
        value: '',
        coordinates: null,
        selectedFeature: null,
        isValid: false,
      });
    }
    if (onEndLocationChange) {
      onEndLocationChange({
        value: '',
        coordinates: null,
        selectedFeature: null,
        isValid: false,
      });
    }
    if (onMapClickMode) {
      onMapClickMode(null);
    }
  };

  const canCalculate = startLocation.isValid && endLocation.isValid && !isProcessing;

  return (
    <div className={`bg-app-panel rounded-lg border border-app-border p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-app-text">Route Planning</h2>
        <button
          onClick={handleClearAll}
          className="text-xs text-app-text-secondary hover:text-app-text transition-colors"
          type="button"
        >
          Clear All
        </button>
      </div>

      {/* Start Location */}
      <div className="mb-4">
        <LocationInput
          label="Start Point (A)"
          placeholder="Enter port, city, or coordinates"
          value={startLocation}
          onChange={handleStartLocationChange}
          disabled={isProcessing}
        />
        <button
          onClick={() => handleSetOnMap('start')}
          className={`
            mt-2 w-full px-3 py-2 text-sm rounded
            border transition-colors
            ${
              mapClickMode === 'start'
                ? 'bg-app-accent border-app-accent text-white'
                : 'bg-app-bg border-app-border text-app-text hover:border-app-accent'
            }
          `}
          type="button"
          disabled={isProcessing}
        >
          {mapClickMode === 'start' ? '📍 Click on map...' : '🗺️ Set on Map'}
        </button>
      </div>

      {/* Swap button */}
      <div className="flex justify-center -my-2 relative z-10">
        <button
          onClick={handleSwapLocations}
          className="
            p-2 bg-app-panel border border-app-border rounded-full
            hover:bg-app-bg hover:border-app-accent
            transition-colors
          "
          type="button"
          disabled={isProcessing}
          title="Swap start and end"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* End Location */}
      <div className="mb-4">
        <LocationInput
          label="End Point (B)"
          placeholder="Enter port, city, or coordinates"
          value={endLocation}
          onChange={handleEndLocationChange}
          disabled={isProcessing}
        />
        <button
          onClick={() => handleSetOnMap('end')}
          className={`
            mt-2 w-full px-3 py-2 text-sm rounded
            border transition-colors
            ${
              mapClickMode === 'end'
                ? 'bg-app-accent border-app-accent text-white'
                : 'bg-app-bg border-app-border text-app-text hover:border-app-accent'
            }
          `}
          type="button"
          disabled={isProcessing}
        >
          {mapClickMode === 'end' ? '📍 Click on map...' : '🗺️ Set on Map'}
        </button>
      </div>

      {/* Departure Time */}
      <div className="mb-4 pb-4 border-b border-app-border">
        <DateTimePicker
          label="Departure Time"
          value={departureTime}
          onChange={setDepartureTime}
          minDate={new Date()}
          disabled={isProcessing}
        />
      </div>

      {/* Calculate Button */}
      <button
        onClick={handleCalculateRoute}
        disabled={!canCalculate}
        className={`
          w-full px-4 py-3 rounded font-medium
          transition-all transform
          ${
            canCalculate
              ? 'bg-app-accent hover:bg-app-accent/90 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
              : 'bg-app-bg border border-app-border text-app-text-secondary cursor-not-allowed opacity-50'
          }
        `}
        type="button"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          '🚢 Calculate Route'
        )}
      </button>

      {/* Status message */}
      {!canCalculate && !isProcessing && (
        <div className="mt-3 text-xs text-app-text-secondary text-center">
          {!startLocation.isValid && !endLocation.isValid
            ? 'Please enter start and end locations'
            : !startLocation.isValid
            ? 'Please enter start location'
            : 'Please enter end location'}
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-app-bg border border-app-border rounded text-xs text-app-text-secondary">
        <div className="font-medium mb-1">💡 Tips:</div>
        <ul className="space-y-1 list-disc list-inside">
          <li>Enter location names or coordinates</li>
          <li>Click "Set on Map" then click on the map</li>
          <li>Use autocomplete suggestions</li>
          <li>Coordinates format: "35.4437, 139.6380"</li>
        </ul>
      </div>
    </div>
  );
});

