/**
 * MapView Component
 * Main map component using Leaflet (React-Leaflet) with deck.gl overlay support
 */
import { useCallback, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { config } from '../../config';
import type { Coordinates, MapMarker, MapClickEvent } from '../../types';
import { DeckGLOverlay } from './DeckGLOverlay';

// Fix for default marker icons in Leaflet with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  onMapClick?: (event: MapClickEvent) => void;
  markers?: MapMarker[];
  initialCenter?: Coordinates;
  initialZoom?: number;
  className?: string;
  children?: React.ReactNode;
  deckLayers?: any[]; // deck.gl layers
}

// Component to handle map events
function MapEventHandler({ onMapClick }: { onMapClick?: (event: MapClickEvent) => void }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        const clickEvent: MapClickEvent = {
          coordinates: {
            lat: e.latlng.lat,
            lng: e.latlng.lng,
          },
          point: {
            x: e.containerPoint.x,
            y: e.containerPoint.y,
          },
        };
        onMapClick(clickEvent);
      }
    },
  });
  return null;
}

// Helper to create custom colored markers
const createCustomIcon = (type?: string) => {
  const color = getMarkerColor(type);
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative; width: 25px; height: 41px;">
        <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 1.9 0.4 3.7 1.2 5.3L12.5 41l11.3-23.2c0.8-1.6 1.2-3.4 1.2-5.3C25 5.6 19.4 0 12.5 0z" 
                fill="${color}" 
                stroke="#fff" 
                stroke-width="1.5"/>
          <circle cx="12.5" cy="12.5" r="6" fill="#fff"/>
        </svg>
      </div>
    `,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

// Helper function to get marker color based on type
const getMarkerColor = (type?: string): string => {
  switch (type) {
    case 'start':
      return '#10b981'; // Green
    case 'end':
      return '#ef4444'; // Red
    case 'waypoint':
      return '#3b82f6'; // Blue
    default:
      return '#6366f1'; // Indigo
  }
};

export default function MapView({
  onMapClick,
  markers = [],
  initialCenter = config.map.defaultCenter,
  initialZoom = config.map.defaultZoom,
  className = '',
  children,
  deckLayers = [],
}: MapViewProps) {
  const [clickedCoords, setClickedCoords] = useState<Coordinates | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Handle map click with coordinate display
  const handleMapClick = useCallback(
    (event: MapClickEvent) => {
      setClickedCoords(event.coordinates);
      if (onMapClick) {
        onMapClick(event);
      }
    },
    [onMapClick]
  );

  // Format coordinates for display
  const formatCoordinate = useCallback((coord: Coordinates): string => {
    return `${coord.lat.toFixed(4)}°, ${coord.lng.toFixed(4)}°`;
  }, []);

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!mapReady) {
    return (
      <div className={`relative w-full h-full flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-white">Loading map...</div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Map container */}
      <MapContainer
        center={[initialCenter.lat, initialCenter.lng]}
        zoom={initialZoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
        className="z-0"
      >
        {/* Dark theme tile layer (CartoDB Dark) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* Map event handler */}
        <MapEventHandler onMapClick={handleMapClick} />

        {/* Markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.coordinates.lat, marker.coordinates.lng]}
            icon={createCustomIcon(marker.type)}
          >
            {marker.label && (
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold mb-1">{marker.label}</div>
                  <div className="text-xs text-gray-600">
                    {formatCoordinate(marker.coordinates)}
                  </div>
                </div>
              </Popup>
            )}
          </Marker>
        ))}

        {/* Children (e.g., RouteLayer) */}
        {children}

        {/* DeckGL Overlay for weather layers */}
        {deckLayers.length > 0 && <DeckGLOverlay layers={deckLayers} />}
      </MapContainer>

      {/* Coordinates display (when map is clicked) */}
      {clickedCoords && (
        <div className="absolute top-4 left-4 bg-app-panel border border-app-border rounded-lg px-4 py-2 shadow-lg z-[1000]">
          <div className="text-xs text-app-text-secondary mb-1">Last clicked coordinates:</div>
          <div className="font-mono text-sm text-app-text">{formatCoordinate(clickedCoords)}</div>
        </div>
      )}

      {/* Markers count indicator */}
      {markers.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-app-panel border border-app-border rounded-lg px-3 py-2 shadow-lg z-[1000]">
          <div className="text-xs text-app-text-secondary">
            {markers.length} marker{markers.length !== 1 ? 's' : ''} on map
          </div>
        </div>
      )}
    </div>
  );
}
