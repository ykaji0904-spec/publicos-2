/**
 * @component MapCanvas
 * @description Core map rendering component — Phase 1: Sovereign Foundation.
 *
 * Initializes the hybrid Mapbox GL JS v3 + deck.gl engine with
 * interleaved depth compositing. Features:
 * - 3D terrain (Mapbox DEM)
 * - 3D building extrusions
 * - Sky/atmosphere layer
 * - Coordinate display on mouse move
 * - Click-to-inspect coordinates
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useUIStore } from '@/stores/ui';
import { createMapEngine, type MapEngine } from '@/lib/map/engine';

export default function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MapEngine | null>(null);
  const setMapReady = useUIStore((s) => s.setMapReady);
  const [coords, setCoords] = useState<{ lng: number; lat: number; zoom: number } | null>(null);

  const initializeEngine = useCallback(() => {
    if (!containerRef.current || engineRef.current) return;

    try {
      const engine = createMapEngine(containerRef.current);

      engine.map.on('load', () => {
        setMapReady(true);
        console.info('[PublicOS] Map engine initialized — interleaved mode active');
        console.info('[PublicOS] 3D buildings, terrain, sky enabled');
      });

      // Track mouse coordinates
      engine.map.on('mousemove', (e) => {
        setCoords({
          lng: Math.round(e.lngLat.lng * 10000) / 10000,
          lat: Math.round(e.lngLat.lat * 10000) / 10000,
          zoom: Math.round(engine.map.getZoom() * 100) / 100,
        });
      });

      engine.map.on('error', (e) => {
        console.error('[PublicOS] Map engine error:', e);
      });

      engineRef.current = engine;
    } catch (error) {
      console.error('[PublicOS] Failed to initialize map engine:', error);
    }
  }, [setMapReady]);

  useEffect(() => {
    initializeEngine();

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
        setMapReady(false);
      }
    };
  }, [initializeEngine, setMapReady]);

  return (
    <>
      <div
        ref={containerRef}
        className="absolute inset-0"
        data-testid="map-canvas"
      />
      {/* Coordinate Display */}
      {coords && (
        <div className="absolute top-3 left-3 z-10 rounded bg-pos-surface/90 px-3 py-1.5 font-mono text-[11px] text-pos-text backdrop-blur-sm border border-pos-border">
          <span className="text-pos-muted">LNG </span>
          <span className="text-pos-accent">{coords.lng.toFixed(4)}</span>
          <span className="text-pos-muted ml-3">LAT </span>
          <span className="text-pos-accent">{coords.lat.toFixed(4)}</span>
          <span className="text-pos-muted ml-3">Z </span>
          <span className="text-pos-accent">{coords.zoom.toFixed(1)}</span>
        </div>
      )}
    </>
  );
}
