/**
 * @module types/simulation
 * @description Types for physics-aware simulation engine.
 *
 * Covers:
 * - Environmental parameters (wind, weather)
 * - Entity state (drones, vehicles)
 * - Interpolation buffers (LERP/SLERP)
 * - Simulation timeline control
 */

import type { LngLatAlt } from './map';

// ---------------------------------------------------------------------------
// Environment Parameters
// ---------------------------------------------------------------------------

export interface SimulationParams {
  /** Wind speed in m/s */
  windSpeed: number;
  /** Wind direction in degrees (0 = North, clockwise) */
  windDirection: number;
  /** Weather condition affects physics models */
  weatherCondition: 'clear' | 'rain' | 'storm' | 'typhoon' | 'snow';
  /** Ambient temperature in Celsius */
  temperature: number;
  /** Simulation time scale (1.0 = real-time, 2.0 = 2x speed) */
  timeScale: number;
}

export const DEFAULT_SIMULATION_PARAMS: SimulationParams = {
  windSpeed: 5,
  windDirection: 180,
  weatherCondition: 'clear',
  temperature: 20,
  timeScale: 1.0,
};

// ---------------------------------------------------------------------------
// Entity State (Drones, Vehicles, etc.)
// ---------------------------------------------------------------------------

export interface EntityState {
  id: string;
  type: 'drone' | 'vehicle' | 'vessel' | 'person';
  position: LngLatAlt;
  /** Heading in degrees (0 = North) */
  heading: number;
  /** Pitch angle in degrees */
  pitch: number;
  /** Roll angle in degrees */
  roll: number;
  /** Speed in m/s */
  speed: number;
  /** Battery or fuel level (0.0 - 1.0) */
  energyLevel: number;
  /** Entity-specific payload */
  metadata: Record<string, unknown>;
  /** Timestamp of this state snapshot (ms since epoch) */
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Interpolation Buffer
// ---------------------------------------------------------------------------

/** A keyframe for position/orientation interpolation */
export interface Keyframe {
  position: LngLatAlt;
  heading: number;
  pitch: number;
  roll: number;
  timestamp: number;
}

/** Buffer holding past and future keyframes for an entity */
export interface InterpolationBuffer {
  entityId: string;
  keyframes: Keyframe[];
  /** Current interpolated state (computed each frame) */
  current: Keyframe | null;
  /** Render delay offset in ms (typically 500-2000ms behind real-time) */
  renderDelay: number;
}

export type InterpolationMode = 'realtime' | 'smooth' | 'predictive';

// ---------------------------------------------------------------------------
// Simulation Timeline
// ---------------------------------------------------------------------------

export interface SimulationTimeline {
  /** Is the simulation currently running */
  playing: boolean;
  /** Current simulation time (ms since epoch) */
  currentTime: number;
  /** Start of simulation window */
  startTime: number;
  /** End of simulation window (null = live) */
  endTime: number | null;
  /** Playback speed multiplier */
  speed: number;
}
