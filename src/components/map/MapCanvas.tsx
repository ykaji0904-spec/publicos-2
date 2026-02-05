/**
 * @component MapCanvas
 * @description Core map rendering component.
 *
 * Initializes the hybrid Mapbox GL JS v3 + deck.gl engine with
 * interleaved depth compositing. Manages the full lifecycle of the
 * map instance and connects it to the Zustand UI store.
 *
 * This component is loaded with `dynamic({ ssr: false })` since
 * Mapbox GL JS requires browser APIs (WebGL, DOM).
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useUIStore } from '@/stores/ui';
import { createMapEngine, type MapEngine } from '@/lib/map/engine';

export default function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MapEngine | null>(null);
  const setMapReady = useUIStore((s) => s.setMapReady);

  const initializeEngine = useCallback(() => {
    if (!containerRef.current || engineRef.current) return;

    try {
      const engine = createMapEngine(containerRef.current);

      engine.map.on('load', () => {
        setMapReady(true);
        console.info('[PublicOS] Map engine initialized — interleaved mode active');
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
    <div
      ref={containerRef}
      className="absolute inset-0"
      data-testid="map-canvas"
    />
  );
}
