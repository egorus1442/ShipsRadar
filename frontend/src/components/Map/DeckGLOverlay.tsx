/**
 * DeckGL Overlay Component
 * Integrates deck.gl with Leaflet map for advanced visualizations
 */

import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { Deck } from '@deck.gl/core';
import type { Layer } from '@deck.gl/core';

export interface DeckGLOverlayProps {
  layers: Layer[];
  onViewStateChange?: (viewState: any) => void;
  getCursor?: (interactiveState: any) => string;
}

/**
 * DeckGL overlay component for Leaflet
 * Renders deck.gl layers on top of Leaflet map
 */
export function DeckGLOverlay({
  layers,
  onViewStateChange,
  getCursor,
}: DeckGLOverlayProps) {
  const map = useMap();
  const deckRef = useRef<Deck | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [deckInstance, setDeckInstance] = useState<Deck | null>(null);

  // Initialize deck.gl
  useEffect(() => {
    if (!map || !containerRef.current || !canvasRef.current) {
      return;
    }

    console.log('Initializing deck.gl with canvas:', canvasRef.current);

    // Create deck.gl instance
    const deck = new Deck({
      canvas: canvasRef.current,
      width: '100%',
      height: '100%',
      initialViewState: {
        longitude: map.getCenter().lng,
        latitude: map.getCenter().lat,
        zoom: map.getZoom() - 1, // deck.gl zoom is offset by 1
        pitch: 0,
        bearing: 0,
      },
      controller: false, // Let Leaflet handle interactions
      layers: [],
      onViewStateChange: onViewStateChange,
      getCursor: getCursor || (() => 'inherit'),
    });

    deckRef.current = deck;
    setDeckInstance(deck);

    // Sync deck.gl view with Leaflet map
    const syncView = () => {
      if (!deckRef.current) return;

      const center = map.getCenter();
      const zoom = map.getZoom();

      deckRef.current.setProps({
        viewState: {
          longitude: center.lng,
          latitude: center.lat,
          zoom: zoom - 1,
          pitch: 0,
          bearing: 0,
        },
      });
    };

    // Listen to Leaflet map events
    map.on('move', syncView);
    map.on('zoom', syncView);
    map.on('resize', () => {
      if (deckRef.current && containerRef.current) {
        deckRef.current.setProps({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    });

    // Initial sync
    syncView();

    // Cleanup
    return () => {
      map.off('move', syncView);
      map.off('zoom', syncView);
      if (deckRef.current) {
        deckRef.current.finalize();
        deckRef.current = null;
      }
    };
  }, [map, onViewStateChange, getCursor]);

  // Update layers when they change
  useEffect(() => {
    if (deckInstance) {
      console.log('DeckGLOverlay: Updating deck.gl with', layers.length, 'layers');
      deckInstance.setProps({ layers });
    }
  }, [deckInstance, layers]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Let Leaflet handle interactions
        zIndex: 400, // Above markers (400) but below popups (600)
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}

export default DeckGLOverlay;

