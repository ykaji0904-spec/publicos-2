/**
 * @module lib/simulation/interpolation
 * @description Frame-rate-independent interpolation engine for smooth entity animation.
 *
 * Implements the Mini Tokyo 3D approach (PublicOS 2.0 spec §6):
 * - Data packets buffered, not rendered immediately
 * - Render time delayed behind real-time to guarantee interpolation pairs
 * - LERP for position, SLERP for orientation (heading/quaternion)
 *
 * @see https://minitokyo3d.com for reference implementation
 */

import type { Keyframe, InterpolationBuffer, LngLatAlt } from '@/types';

// ---------------------------------------------------------------------------
// LERP — Linear Interpolation
// ---------------------------------------------------------------------------

/**
 * Linearly interpolates between two scalar values.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp01(t);
}

/**
 * Linearly interpolates a 3D geographic position.
 */
export function lerpPosition(a: LngLatAlt, b: LngLatAlt, t: number): LngLatAlt {
  const ct = clamp01(t);
  return {
    lng: a.lng + (b.lng - a.lng) * ct,
    lat: a.lat + (b.lat - a.lat) * ct,
    alt: a.alt + (b.alt - a.alt) * ct,
  };
}

// ---------------------------------------------------------------------------
// SLERP — Spherical Linear Interpolation
// ---------------------------------------------------------------------------

/**
 * Spherical linear interpolation for heading angles (degrees).
 * Ensures shortest-path rotation (e.g., 350° → 10° goes through 0°, not 180°).
 */
export function slerpHeading(a: number, b: number, t: number): number {
  const ct = clamp01(t);
  let diff = ((b - a + 540) % 360) - 180;
  return ((a + diff * ct) + 360) % 360;
}

/**
 * Interpolate a full keyframe (position + orientation).
 * Position uses LERP, heading/pitch/roll use SLERP.
 */
export function interpolateKeyframe(
  prev: Keyframe,
  next: Keyframe,
  renderTime: number
): Keyframe {
  const duration = next.timestamp - prev.timestamp;
  const t = duration > 0 ? (renderTime - prev.timestamp) / duration : 0;

  return {
    position: lerpPosition(prev.position, next.position, t),
    heading: slerpHeading(prev.heading, next.heading, t),
    pitch: lerp(prev.pitch, next.pitch, t),
    roll: lerp(prev.roll, next.roll, t),
    timestamp: renderTime,
  };
}

// ---------------------------------------------------------------------------
// Buffer Management
// ---------------------------------------------------------------------------

/**
 * Adds a new keyframe to the interpolation buffer, maintaining chronological order.
 * Prunes old keyframes that are no longer needed for interpolation.
 */
export function pushKeyframe(
  buffer: InterpolationBuffer,
  keyframe: Keyframe,
  maxBufferSize = 60
): InterpolationBuffer {
  const keyframes = [...buffer.keyframes, keyframe]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-maxBufferSize);

  return { ...buffer, keyframes };
}

/**
 * Computes the interpolated state for the given render time.
 *
 * Strategy: renderTime is offset behind real-time by `buffer.renderDelay`
 * to ensure we always have a bracketing pair [prev, next].
 */
export function computeInterpolatedState(
  buffer: InterpolationBuffer,
  now: number
): InterpolationBuffer {
  const renderTime = now - buffer.renderDelay;
  const { keyframes } = buffer;

  if (keyframes.length === 0) {
    return { ...buffer, current: null };
  }

  if (keyframes.length === 1) {
    return { ...buffer, current: keyframes[0] };
  }

  // Find bracketing keyframes
  let prevIdx = 0;
  for (let i = keyframes.length - 1; i >= 0; i--) {
    if (keyframes[i].timestamp <= renderTime) {
      prevIdx = i;
      break;
    }
  }

  const nextIdx = Math.min(prevIdx + 1, keyframes.length - 1);
  const prev = keyframes[prevIdx];
  const next = keyframes[nextIdx];

  const current = prevIdx === nextIdx
    ? prev
    : interpolateKeyframe(prev, next, renderTime);

  return { ...buffer, current };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

/**
 * Creates a new empty interpolation buffer for an entity.
 */
export function createBuffer(
  entityId: string,
  renderDelay = 1000
): InterpolationBuffer {
  return {
    entityId,
    keyframes: [],
    current: null,
    renderDelay,
  };
}
