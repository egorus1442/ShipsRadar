/**
 * LocationInput Component
 * Input field with autocomplete for location search
 * Supports location names, addresses, and coordinate formats
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  LocationFeature,
  LocationInputState,
  Coordinates,
} from '../../types';
import {
  autocompleteLocation,
  parseCoordinates,
  formatCoordinates,
  debounce,
  GeocodingApiError,
} from '../../services/geocodingApi';

interface LocationInputProps {
  label: string;
  placeholder?: string;
  value: LocationInputState;
  onChange: (value: LocationInputState) => void;
  onSelectLocation?: (feature: LocationFeature) => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export function LocationInput({
  label,
  placeholder = 'Enter location name or coordinates',
  value,
  onChange,
  onSelectLocation,
  disabled = false,
  className = '',
  icon,
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<LocationFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search function
  const searchLocations = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);

      try {
        // First try to parse as coordinates
        try {
          const parseResult = await parseCoordinates(query);
          if (parseResult) {
            // Valid coordinates - update state
            onChange({
              value: query,
              coordinates: parseResult.coordinates,
              selectedFeature: null,
              isValid: true,
            });
            setSuggestions([]);
            setShowSuggestions(false);
            setIsLoading(false);
            return;
          }
        } catch {
          // Not coordinates, continue with text search
        }

        // Search for location by name
        const response = await autocompleteLocation(query, 5);
        setSuggestions(response.features);
        setShowSuggestions(response.features.length > 0);
        setActiveSuggestionIndex(-1);
      } catch (error) {
        if (error instanceof GeocodingApiError) {
          onChange({
            ...value,
            isValid: false,
            error: error.message,
          });
        }
        console.error('Location search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [onChange, value]
  );

  // Create debounced version
  const debouncedSearch = useCallback(
    debounce((query: string) => searchLocations(query), 300),
    [searchLocations]
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    onChange({
      value: newValue,
      coordinates: null,
      selectedFeature: null,
      isValid: false,
    });

    if (newValue.trim()) {
      debouncedSearch(newValue);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (feature: LocationFeature) => {
    onChange({
      value: feature.place_name,
      coordinates: feature.coordinates,
      selectedFeature: feature,
      isValid: true,
    });

    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);

    if (onSelectLocation) {
      onSelectLocation(feature);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
          handleSelectSuggestion(suggestions[activeSuggestionIndex]);
        }
        break;

      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
    }
  };

  // Clear input
  const handleClear = () => {
    onChange({
      value: '',
      coordinates: null,
      selectedFeature: null,
      isValid: false,
    });
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      <label className="block text-sm font-bold text-white mb-2 flex items-center gap-2">
        {icon}
        {label}
      </label>

      {/* Input field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value.value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-4 py-2 pr-10
            bg-app-bg border rounded
            text-app-text placeholder:text-gray-500
            focus:outline-none focus:ring-2 focus:ring-app-accent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              value.isValid
                ? 'border-green-500'
                : value.error
                ? 'border-red-500'
                : 'border-app-border'
            }
          `}
        />

        {/* Loading spinner or clear button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-app-accent border-t-transparent rounded-full animate-spin" />
          ) : value.value ? (
            <button
              onClick={handleClear}
              className="text-app-text-secondary hover:text-app-text"
              type="button"
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
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {/* Validation status */}
      {value.isValid && value.coordinates && (
        <div className="mt-1 text-xs text-green-500 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>{formatCoordinates(value.coordinates)}</span>
        </div>
      )}

      {/* Error message */}
      {value.error && (
        <div className="mt-1 text-xs text-red-500">{value.error}</div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-[#1a1f2e] border-2 border-[#2d3548] rounded-lg shadow-2xl max-h-64 overflow-y-auto"
        >
          {suggestions.map((feature, index) => (
            <button
              key={feature.id}
              onClick={() => handleSelectSuggestion(feature)}
              className={`
                w-full px-4 py-3 text-left transition-colors
                hover:bg-[#0f1419]
                ${
                  index === activeSuggestionIndex
                    ? 'bg-[#0f1419]'
                    : ''
                }
                ${index > 0 ? 'border-t border-[#2d3548]' : ''}
              `}
              type="button"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    {feature.text}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {feature.place_name}
                  </div>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {formatCoordinates(feature.coordinates, 2)}
                </div>
              </div>
              {/* Relevance indicator */}
              {feature.relevance < 1 && (
                <div className="mt-1 text-xs text-app-text-secondary">
                  Relevance: {(feature.relevance * 100).toFixed(0)}%
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Help text */}
      <div className="mt-1 text-xs text-app-text-secondary">
        Enter location name, address, or coordinates (e.g., "35.4437, 139.6380")
      </div>
    </div>
  );
}

