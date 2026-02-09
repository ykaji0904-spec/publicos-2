/**
 * @module lib/map/engine
 * @description Initializes the hybrid rendering engine: Mapbox GL JS v3 base
 * with deck.gl MapboxOverlay in interleaved mode for depth-correct compositing.
 *
 * Architecture decision (from PublicOS 2.0 spec §2.2):
 * - interleaved: true → deck.gl shares Mapbox's WebGL2 context
 * - Shared depth buffer enables correct occlusion between Mapbox 3D buildings
 *   and deck.gl simulation layers (particles, drones, etc.)
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
  setLayers: (layers: Layer[]) => void;
  flyTo: (target: Partial<ViewState>, duration?: number) => void;
  getViewState: () => ViewState;
  destroy: () => void;
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

export function createMapEngine(
  container: HTMLElement,
  config: Partial<MapEngineConfig> = {}
): MapEngine {
  const cfg = { ...DEFAULT_MAP_CONFIG, ...config };

  // --- Mapbox GL JS v3 ---
  mapboxgl.accessToken = cfg.mapboxToken;

  const map = new mapboxgl.Map({
    container,
    style: cfg.style,
    center: [cfg.initialViewState.longitude, cfg.initialViewState.latitude],
    zoom: cfg.initialViewState.zoom,
    pitch: cfg.initialViewState.pitch,
    bearing: cfg.initialViewState.bearing,
    antialias: true,
  });

  // --- deck.gl MapboxOverlay (Interleaved) ---
  const overlay = new MapboxOverlay({
    interleaved: cfg.interleaved,
    layers: [],
  });

  map.addControl(overlay as unknown as mapboxgl.IControl);

  // --- Style Load: Terrain, 3D Buildings, Sky ---
  map.on('style.load', () => {
    // Terrain (Mapbox DEM)
    if (cfg.terrain.enabled) {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });

      map.setTerrain({
        source: 'mapbox-dem',
        exaggeration: cfg.terrain.exaggeration,
      });
    }

    // Sky / Atmosphere
    map.addLayer({
      id: 'sky',
      type: 'sky',
      paint: {
        'sky-type': 'atmosphere',
        'sky-atmosphere-sun': [0.0, 45.0],
        'sky-atmosphere-sun-intensity': 15,
      },
    });

    // 3D Building extrusions
    const layers = map.getStyle().layers;
    const labelLayerId = layers?.find(
      (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
    )?.id;

    map.addLayer(
      {
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': '#1a1a2e',
          'fill-extrusion-height': [
            'interpolate', ['linear'], ['zoom'],
            14, 0,
            14.05, ['get', 'height'],
          ],
          'fill-extrusion-base': [
            'interpolate', ['linear'], ['zoom'],
            14, 0,
            14.05, ['get', 'min_height'],
          ],
          'fill-extrusion-opacity': 0.7,
        },
      },
      labelLayerId
    );
  });

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
