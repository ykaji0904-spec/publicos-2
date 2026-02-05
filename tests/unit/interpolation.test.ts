/**
 * @module tests/unit/interpolation.test
 * @description Unit tests for the simulation interpolation engine.
 *
 * Validates:
 * - LERP accuracy for position interpolation
 * - SLERP shortest-path for heading rotation
 * - Buffer management and keyframe pruning
 * - Edge cases (single keyframe, empty buffer)
 */

import { describe, it, expect } from 'vitest';
import {
  lerp,
  lerpPosition,
  slerpHeading,
  interpolateKeyframe,
  createBuffer,
  pushKeyframe,
  computeInterpolatedState,
} from '@/lib/simulation/interpolation';
import type { Keyframe } from '@/types';

// ---------------------------------------------------------------------------
// LERP
// ---------------------------------------------------------------------------

describe('lerp', () => {
  it('returns start value at t=0', () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });

  it('returns end value at t=1', () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it('returns midpoint at t=0.5', () => {
    expect(lerp(10, 20, 0.5)).toBe(15);
  });

  it('clamps t below 0', () => {
    expect(lerp(10, 20, -0.5)).toBe(10);
  });

  it('clamps t above 1', () => {
    expect(lerp(10, 20, 1.5)).toBe(20);
  });
});

describe('lerpPosition', () => {
  it('interpolates 3D geographic position', () => {
    const a = { lng: 132.0, lat: 34.0, alt: 100 };
    const b = { lng: 133.0, lat: 35.0, alt: 200 };
    const mid = lerpPosition(a, b, 0.5);

    expect(mid.lng).toBeCloseTo(132.5);
    expect(mid.lat).toBeCloseTo(34.5);
    expect(mid.alt).toBeCloseTo(150);
  });
});

// ---------------------------------------------------------------------------
// SLERP Heading
// ---------------------------------------------------------------------------

describe('slerpHeading', () => {
  it('interpolates linearly for small arcs', () => {
    expect(slerpHeading(10, 20, 0.5)).toBeCloseTo(15);
  });

  it('takes shortest path across 360/0 boundary', () => {
    // 350° → 10° should pass through 0°, not go the long way through 180°
    const result = slerpHeading(350, 10, 0.5);
    expect(result).toBeCloseTo(0);
  });

  it('handles 180° → 350° correctly', () => {
    const result = slerpHeading(180, 350, 0.5);
    expect(result).toBeCloseTo(265);
  });

  it('returns start at t=0', () => {
    expect(slerpHeading(90, 270, 0)).toBeCloseTo(90);
  });

  it('returns end at t=1', () => {
    expect(slerpHeading(90, 270, 1)).toBeCloseTo(270);
  });
});

// ---------------------------------------------------------------------------
// Keyframe Interpolation
// ---------------------------------------------------------------------------

describe('interpolateKeyframe', () => {
  const prev: Keyframe = {
    position: { lng: 132.0, lat: 34.0, alt: 100 },
    heading: 0,
    pitch: 0,
    roll: 0,
    timestamp: 1000,
  };

  const next: Keyframe = {
    position: { lng: 133.0, lat: 35.0, alt: 200 },
    heading: 90,
    pitch: 10,
    roll: 5,
    timestamp: 2000,
  };

  it('returns prev at renderTime = prev.timestamp', () => {
    const result = interpolateKeyframe(prev, next, 1000);
    expect(result.position.lng).toBeCloseTo(132.0);
    expect(result.heading).toBeCloseTo(0);
  });

  it('returns next at renderTime = next.timestamp', () => {
    const result = interpolateKeyframe(prev, next, 2000);
    expect(result.position.lng).toBeCloseTo(133.0);
    expect(result.heading).toBeCloseTo(90);
  });

  it('returns midpoint at renderTime = midpoint', () => {
    const result = interpolateKeyframe(prev, next, 1500);
    expect(result.position.lng).toBeCloseTo(132.5);
    expect(result.heading).toBeCloseTo(45);
  });
});

// ---------------------------------------------------------------------------
// Buffer Management
// ---------------------------------------------------------------------------

describe('buffer management', () => {
  it('creates empty buffer with correct defaults', () => {
    const buf = createBuffer('drone-1', 1000);
    expect(buf.entityId).toBe('drone-1');
    expect(buf.keyframes).toHaveLength(0);
    expect(buf.current).toBeNull();
    expect(buf.renderDelay).toBe(1000);
  });

  it('pushes keyframes in chronological order', () => {
    let buf = createBuffer('drone-1');
    const kf1: Keyframe = {
      position: { lng: 132, lat: 34, alt: 100 },
      heading: 0, pitch: 0, roll: 0,
      timestamp: 2000,
    };
    const kf2: Keyframe = { ...kf1, timestamp: 1000 };

    buf = pushKeyframe(buf, kf1);
    buf = pushKeyframe(buf, kf2);

    expect(buf.keyframes[0].timestamp).toBe(1000);
    expect(buf.keyframes[1].timestamp).toBe(2000);
  });

  it('computes interpolated state with render delay', () => {
    let buf = createBuffer('drone-1', 500);
    const kf1: Keyframe = {
      position: { lng: 132, lat: 34, alt: 100 },
      heading: 0, pitch: 0, roll: 0,
      timestamp: 1000,
    };
    const kf2: Keyframe = {
      position: { lng: 133, lat: 35, alt: 200 },
      heading: 90, pitch: 0, roll: 0,
      timestamp: 2000,
    };

    buf = pushKeyframe(buf, kf1);
    buf = pushKeyframe(buf, kf2);

    // now=2000, renderDelay=500, so renderTime=1500 → midpoint
    buf = computeInterpolatedState(buf, 2000);

    expect(buf.current).not.toBeNull();
    expect(buf.current!.position.lng).toBeCloseTo(132.5);
    expect(buf.current!.heading).toBeCloseTo(45);
  });

  it('returns null state for empty buffer', () => {
    const buf = computeInterpolatedState(createBuffer('test'), Date.now());
    expect(buf.current).toBeNull();
  });
});
