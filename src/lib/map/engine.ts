/**
 * @module lib/map/engine
 * @description Initializes the hybrid rendering engine: Mapbox GL JS v3 base
 * with deck.gl MapboxOverlay in interleaved mode for depth-correct compositing.
 *
 * Architecture decision (from PublicOS 2.0 spec §2.2):
 * - interleaved: true → deck.gl shares Mapbox's WebGL2 context
 * - Shared depth buffer enables correct occlusion between Mapbox 3D buildings
 *   and deck.gl simulation layers (particles, drones, etc.)
 *
 * @see https://deck.gl/docs/api-reference/mapbox/mapbox-overlay
 */

import mapboxgl from 'mapbox-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { Layer } from '@deck.gl/core';
import type { MapEngineConfig, ViewState } from '@/types/map';
import { DEFAULT_MAP_CONFIG } from '@/types/map';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MapEngine {
  map: mapboxgl.Map;
  overlay: MapboxOverlay;
  /** Update deck.gl layers without re-creating the overlay */
  setLayers: (layers: Layer[]) => void;
  /** Animate camera to a target view state */
  flyTo: (target: Partial<ViewState>, duration?: number) => void;
  /** Get current view state */
  getViewState: () => ViewState;
  /** Clean up all resources */
  destroy: () => void;
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Creates and returns the PublicOS map engine instance.
 *
 * @param container - DOM element to mount the map into
 * @param config - Engine configuration (defaults to Hiroshima-centered view)
 * @returns Fully initialized MapEngine with interleaved deck.gl overlay
 */
export function createMapEngine(
  container: HTMLElement,
  config: Partial<MapEngineConfig> = {}
): MapEngine {
  const cfg = { ...DEFAULT_MAP_CONFIG, ...config };

  // --- Mapbox GL JS v3 Initialization ---
  mapboxgl.accessToken = cfg.mapboxToken;

  const map = new mapboxgl.Map({
    container,
    style: cfg.style,
    center: [cfg.initialViewState.longitude, cfg.initialViewState.latitude],
    zoom: cfg.initialViewState.zoom,
    pitch: cfg.initialViewState.pitch,
    bearing: cfg.initialViewState.bearing,
    antialias: true,
    // Enable WebGL2 for interleaved mode compatibility
    useWebGL2: true,
  });

  // --- deck.gl MapboxOverlay (Interleaved) ---
  const overlay = new MapboxOverlay({
    interleaved: cfg.interleaved,
    layers: [],
  });

  map.addControl(overlay as unknown as mapboxgl.IControl);

  // --- Terrain Setup (GSI Terrain-RGB) ---
  if (cfg.terrain.enabled) {
    map.on('style.load', () => {
      map.addSource('gsi-terrain', {
        type: 'raster-dem',
        tiles: [cfg.terrain.source],
        tileSize: 256,
        maxzoom: 15,
        attribution: '© 国土地理院',
      });

      map.setTerrain({
        source: 'gsi-terrain',
        exaggeration: cfg.terrain.exaggeration,
      });
    });
  }

  // --- Navigation Controls ---
  map.addControl(new mapboxgl.NavigationControl(), 'top-right');
  map.addControl(
    new mapboxgl.ScaleControl({ maxWidth: 200, unit: 'metric' }),
    'bottom-left'
  );

  // --- Public API ---
  const setLayers = (layers: Layer[]) => {
    overlay.setProps({ layers });
  };

  const flyTo = (target: Partial<ViewState>, duration = 2000) => {
    map.flyTo({
      center: target.longitude != null && target.latitude != null
        ? [target.longitude, target.latitude]
        : undefined,
      zoom: target.zoom,
      pitch: target.pitch,
      bearing: target.bearing,
      duration,
      essential: true,
    });
  };

  const getViewState = (): ViewState => {
    const center = map.getCenter();
    return {
      longitude: center.lng,
      latitude: center.lat,
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing(),
    };
  };

  const destroy = () => {
    overlay.finalize();
    map.remove();
  };

  return { map, overlay, setLayers, flyTo, getViewState, destroy };
}
