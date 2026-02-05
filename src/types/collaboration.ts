/**
 * @module types/collaboration
 * @description Types for real-time multi-user collaboration via Yjs CRDT.
 *
 * State model follows Felt/Figma patterns:
 * - ViewState → yMap('viewState')
 * - Layers → yArray('layers')
 * - SimulationParams → yMap('simulationParams')
 * - Annotations → yArray('annotations')
 */

import type { ViewState, LayerConfig } from './map';
import type { SimulationParams } from './simulation';

// ---------------------------------------------------------------------------
// User Presence (Awareness Protocol)
// ---------------------------------------------------------------------------

export interface UserPresence {
  userId: string;
  name: string;
  color: string;
  /** Cursor position on the map (WGS84) */
  cursor: { lng: number; lat: number } | null;
  /** Currently selected layer or feature ID */
  selection: string | null;
  /** Timestamp of last activity (ISO 8601) */
  lastActive: string;
}

// ---------------------------------------------------------------------------
// Shared Document State (Yjs Shared Types)
// ---------------------------------------------------------------------------

/** Root structure of the Yjs document */
export interface SharedDocState {
  viewState: ViewState;
  layers: LayerConfig[];
  simulationParams: SimulationParams;
  annotations: Annotation[];
}

export interface Annotation {
  id: string;
  type: 'point' | 'line' | 'polygon' | 'text';
  geometry: GeoJSON.Geometry;
  properties: {
    label?: string;
    color: string;
    strokeWidth?: number;
    createdBy: string;
    createdAt: string;
  };
}

// ---------------------------------------------------------------------------
// Collaboration Session
// ---------------------------------------------------------------------------

export interface CollaborationSession {
  roomId: string;
  wsUrl: string;
  users: UserPresence[];
  isConnected: boolean;
}
