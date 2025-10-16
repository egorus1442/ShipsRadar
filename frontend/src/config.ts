/**
 * Application configuration
 * Loads and validates environment variables
 */

export const config = {
  // API configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  },

  // Application settings
  app: {
    environment: import.meta.env.VITE_ENV || 'development',
  },

  // Map settings (Leaflet)
  map: {
    defaultCenter: {
      lat: 20,
      lng: 0,
    },
    defaultZoom: 3,
    minZoom: 2,
    maxZoom: 18,
    // Dark theme tile layers (no API key required!)
    tileLayer: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
} as const;

/**
 * Validates configuration
 * Leaflet doesn't require API keys, so always valid!
 */
export function validateConfig(): { isValid: boolean; warnings: string[] } {
  return {
    isValid: true,
    warnings: [],
  };
}

