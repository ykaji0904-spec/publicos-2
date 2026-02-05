/**
 * @module types/map
 * @description Core spatial types for PublicOS 2.0 rendering engine.
 *
 * These types define the contract between the map engine (Mapbox GL JS v3),
 * the overlay engine (deck.gl), and all consumer modules (simulation, AI, collaboration).
 *
 * Design principle: All geographic coordinates use WGS84 (EPSG:4326).
 * Screen coordinates and projections are handled internally by the rendering engines.
 */

// ---------------------------------------------------------------------------
// Coordinate Types
// ---------------------------------------------------------------------------

/** WGS84 longitude-latitude pair */
export interface LngLat {
  lng: number;
  lat: number;
}

/** 3D position with altitude in meters above ellipsoid */
export interface LngLatAlt extends LngLat {
  alt: number;
}

/** Camera / viewport state synchronized across collaboration */
export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
  /** Altitude above terrain surface (meters). Used for simulation camera. */
  altitude?: number;
}

// ---------------------------------------------------------------------------
// Layer System
// ---------------------------------------------------------------------------

export type LayerType =
  | 'vector-tile'
  | 'raster-tile'
  | 'geojson'
  | 'pmtiles'
  | '3d-model'
  | 'point-cloud'
  | 'heatmap'
  | 'simulation';

export interface LayerConfig {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  opacity: number;
  /** Source URL or inline data reference */
  source: string | GeoJSON.FeatureCollection;
  /** deck.gl layer props override */
  deckProps?: Record<string, unknown>;
  /** Mapbox style layer spec (for vector/raster) */
  mapboxLayer?: mapboxgl.LayerSpecification;
  /** Z-order for interleaved depth sorting */
  zIndex: number;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Map Engine Configuration
// ---------------------------------------------------------------------------

export interface MapEngineConfig {
  mapboxToken: string;
  style: string;
  initialViewState: ViewState;
  terrain: {
    enabled: boolean;
    /** GSI Terrain-RGB tile URL */
    source: string;
    exaggeration: number;
  };
  interleaved: boolean;
}

/** Default configuration for Japan-focused operations */
export const DEFAULT_MAP_CONFIG: MapEngineConfig = {
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '',
  style: 'mapbox://styles/mapbox/dark-v11',
  initialViewState: {
    longitude: 132.4553,  // Hiroshima
    latitude: 34.3853,
    zoom: 12,
    pitch: 45,
    bearing: 0,
  },
  terrain: {
    enabled: true,
    source: 'https://cyberjapandata.gsi.go.jp/xyz/dem5a_png/{z}/{x}/{y}.png',
    exaggeration: 1.5,
  },
  interleaved: true,
};
