/**
 * @module tests/unit/drone-physics.test
 * @description Unit tests for the drone physics model.
 */

import { describe, it, expect } from 'vitest';
import {
  airDensity,
  dragForce,
  powerConsumption,
  groundSpeed,
  assessSafety,
  DEFAULT_DRONE_SPEC,
} from '@/lib/physics/drone';
import type { EntityState, SimulationParams } from '@/types';

describe('airDensity', () => {
  it('returns sea-level density at 0m altitude', () => {
    const rho = airDensity(0, 15); // standard atmosphere ~15°C
    expect(rho).toBeGreaterThan(1.1);
    expect(rho).toBeLessThan(1.3);
  });

  it('decreases with altitude', () => {
    const rho0 = airDensity(0, 20);
    const rho1000 = airDensity(1000, 20);
    expect(rho1000).toBeLessThan(rho0);
  });
});

describe('dragForce', () => {
  it('increases with airspeed squared', () => {
    const f10 = dragForce(DEFAULT_DRONE_SPEC, 10, 100, 20);
    const f20 = dragForce(DEFAULT_DRONE_SPEC, 20, 100, 20);
    // F ∝ v², so f20 should be ~4x f10
    expect(f20 / f10).toBeCloseTo(4, 0);
  });

  it('returns 0 at 0 airspeed', () => {
    expect(dragForce(DEFAULT_DRONE_SPEC, 0, 100, 20)).toBe(0);
  });
});

describe('powerConsumption', () => {
  it('increases with payload', () => {
    const pNoLoad = powerConsumption(DEFAULT_DRONE_SPEC, 10, 0, 100, 20);
    const pLoaded = powerConsumption(DEFAULT_DRONE_SPEC, 10, 2, 100, 20);
    expect(pLoaded).toBeGreaterThan(pNoLoad);
  });

  it('is positive for hovering (0 airspeed)', () => {
    const p = powerConsumption(DEFAULT_DRONE_SPEC, 0, 0, 100, 20);
    expect(p).toBeGreaterThan(0);
  });
});

describe('groundSpeed', () => {
  it('equals airspeed with no wind', () => {
    const gs = groundSpeed(10, 0, 0, 0);
    expect(gs).toBeCloseTo(10);
  });

  it('increases with tailwind', () => {
    // Heading north (0°), wind from south (180° → blowing north)
    const gs = groundSpeed(10, 0, 5, 180);
    expect(gs).toBeGreaterThan(10);
  });

  it('decreases with headwind', () => {
    // Heading north (0°), wind from north (0° → blowing south)
    const gs = groundSpeed(10, 0, 5, 0);
    expect(gs).toBeLessThan(10);
  });
});

describe('assessSafety', () => {
  const entity: EntityState = {
    id: 'drone-1',
    type: 'drone',
    position: { lng: 132.45, lat: 34.39, alt: 100 },
    heading: 0,
    pitch: 0,
    roll: 0,
    speed: 10,
    energyLevel: 0.8,
    metadata: {},
    timestamp: Date.now(),
  };

  it('reports safe under normal conditions', () => {
    const env: SimulationParams = {
      windSpeed: 5,
      windDirection: 180,
      weatherCondition: 'clear',
      temperature: 20,
      timeScale: 1,
    };
    const result = assessSafety(DEFAULT_DRONE_SPEC, entity, env);
    expect(result.safe).toBe(true);
    expect(result.risks).toHaveLength(0);
  });

  it('flags typhoon conditions as unsafe', () => {
    const env: SimulationParams = {
      windSpeed: 25,
      windDirection: 180,
      weatherCondition: 'typhoon',
      temperature: 20,
      timeScale: 1,
    };
    const result = assessSafety(DEFAULT_DRONE_SPEC, entity, env);
    expect(result.safe).toBe(false);
    expect(result.risks.length).toBeGreaterThan(0);
  });

  it('flags low battery', () => {
    const lowBatEntity = { ...entity, energyLevel: 0.02 };
    const env: SimulationParams = {
      windSpeed: 5,
      windDirection: 180,
      weatherCondition: 'clear',
      temperature: 20,
      timeScale: 1,
    };
    const result = assessSafety(DEFAULT_DRONE_SPEC, lowBatEntity, env);
    expect(result.safe).toBe(false);
    expect(result.risks.some((r) => r.includes('battery'))).toBe(true);
  });
});
