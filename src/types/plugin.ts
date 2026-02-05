/**
 * @module types/plugin
 * @description Types for the Re:Earth-inspired WASM plugin sandbox system.
 *
 * Plugins execute in two isolated contexts:
 * 1. Logic Context (WASM/QuickJS) — computation, no DOM access
 * 2. UI Context (sandboxed iframe) — display, postMessage only
 */

// ---------------------------------------------------------------------------
// Plugin Manifest
// ---------------------------------------------------------------------------

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  /** Entry point for logic context (WASM) */
  entryLogic: string;
  /** Entry point for UI context (iframe HTML) */
  entryUI?: string;
  /** Permissions this plugin requests */
  permissions: PluginPermission[];
  /** Required PublicOS API version */
  apiVersion: string;
}

export type PluginPermission =
  | 'read:layers'
  | 'write:layers'
  | 'read:simulation'
  | 'write:simulation'
  | 'read:viewstate'
  | 'write:viewstate'
  | 'network:fetch'
  | 'storage:local';

// ---------------------------------------------------------------------------
// Plugin API (exposed inside WASM sandbox)
// ---------------------------------------------------------------------------

/**
 * API surface available to plugin logic running inside QuickJS/WASM.
 * Mirrors the `reearth` global object pattern from Re:Earth.
 */
export interface PluginAPI {
  /** Read the current map view state */
  getViewState(): Promise<{ lng: number; lat: number; zoom: number }>;
  /** Read layer data by ID */
  getLayerData(layerId: string): Promise<GeoJSON.FeatureCollection | null>;
  /** Add a temporary visualization layer */
  addVisualization(config: PluginVisualization): Promise<string>;
  /** Remove a visualization layer */
  removeVisualization(vizId: string): Promise<void>;
  /** Send a message to the UI context */
  postMessage(data: unknown): void;
  /** Register a handler for messages from UI context */
  onMessage(handler: (data: unknown) => void): void;
  /** Log output (sandboxed, no console access) */
  log(level: 'info' | 'warn' | 'error', message: string): void;
}

export interface PluginVisualization {
  type: 'geojson' | 'heatmap' | 'icon' | 'path';
  data: GeoJSON.FeatureCollection;
  style: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Plugin Runtime State
// ---------------------------------------------------------------------------

export interface PluginInstance {
  manifest: PluginManifest;
  status: 'loading' | 'active' | 'error' | 'stopped';
  /** WASM worker reference */
  workerId: string | null;
  /** Error message if status is 'error' */
  error?: string;
}
