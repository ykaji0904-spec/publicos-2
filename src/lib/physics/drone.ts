/**
 * @module lib/physics/drone
 * @description Physics model for drone flight simulation.
 *
 * Implements simplified aerodynamic equations for:
 * - Wind effect on flight path
 * - Battery consumption under varying conditions
 * - Maximum safe operating envelope
 *
 * Design: Each physics model is a pure function module.
 * Models are composable and replaceable via the plugin system (Phase 4).
 */

import type { LngLatAlt, SimulationParams, EntityState } from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Air density at sea level, 20°C (kg/m³) */
const RHO_SEA_LEVEL = 1.225;

/** Gravitational acceleration (m/s²) */
const G = 9.80665;

// ---------------------------------------------------------------------------
// Drone Specifications (configurable per model)
// ---------------------------------------------------------------------------

export interface DroneSpec {
  /** Empty mass in kg */
  mass: number;
  /** Maximum payload in kg */
  maxPayload: number;
  /** Frontal drag area in m² */
  dragArea: number;
  /** Drag coefficient */
  dragCoefficient: number;
  /** Battery capacity in Wh */
  batteryCapacity: number;
  /** Hover power consumption in W */
  hoverPower: number;
  /** Max airspeed in m/s */
  maxAirspeed: number;
  /** Max wind speed for safe operation in m/s */
  maxWindSpeed: number;
}

export const DEFAULT_DRONE_SPEC: DroneSpec = {
  mass: 4.0,
  maxPayload: 2.0,
  dragArea: 0.05,
  dragCoefficient: 1.1,
  batteryCapacity: 150,
  hoverPower: 200,
  maxAirspeed: 18,
  maxWindSpeed: 15,
};

// ---------------------------------------------------------------------------
// Physics Calculations
// ---------------------------------------------------------------------------

/**
 * Calculate air density adjusted for altitude (simplified barometric formula).
 */
export function airDensity(altitudeM: number, tempC: number): number {
  const T = tempC + 273.15;
  const T0 = 288.15;
  return RHO_SEA_LEVEL * Math.pow(T0 / T, 1) * Math.exp(-G * altitudeM / (287.05 * T));
}

/**
 * Calculate aerodynamic drag force on the drone.
 *
 * F_drag = 0.5 * ρ * Cd * A * v²
 */
export function dragForce(
  spec: DroneSpec,
  airspeed: number,
  altitude: number,
  tempC: number
): number {
  const rho = airDensity(altitude, tempC);
  return 0.5 * rho * spec.dragCoefficient * spec.dragArea * airspeed * airspeed;
}

/**
 * Estimate power consumption for a given flight state.
 *
 * P_total = P_hover * (1 + payload_factor) + P_drag
 * P_drag = F_drag * airspeed
 */
export function powerConsumption(
  spec: DroneSpec,
  airspeed: number,
  payload: number,
  altitude: number,
  tempC: number
): number {
  const totalMass = spec.mass + payload;
  const payloadFactor = totalMass / spec.mass;
  const pHover = spec.hoverPower * payloadFactor;
  const fDrag = dragForce(spec, airspeed, altitude, tempC);
  const pDrag = fDrag * airspeed;
  return pHover + pDrag;
}

/**
 * Estimate remaining flight time in seconds given current energy level.
 */
export function remainingFlightTime(
  spec: DroneSpec,
  energyLevel: number,
  currentPower: number
): number {
  if (currentPower <= 0) return Infinity;
  const remainingEnergy = spec.batteryCapacity * energyLevel; // Wh
  return (remainingEnergy / currentPower) * 3600; // seconds
}

/**
 * Calculate effective ground speed considering wind.
 *
 * @param airspeed - Drone's speed relative to air (m/s)
 * @param heading - Drone heading in degrees (0=N, clockwise)
 * @param windSpeed - Wind speed in m/s
 * @param windDirection - Wind coming FROM direction in degrees
 * @returns Ground speed in m/s
 */
export function groundSpeed(
  airspeed: number,
  heading: number,
  windSpeed: number,
  windDirection: number
): number {
  const headingRad = (heading * Math.PI) / 180;
  const windRad = ((windDirection + 180) * Math.PI) / 180; // convert "from" to "to"

  const vxDrone = airspeed * Math.sin(headingRad);
  const vyDrone = airspeed * Math.cos(headingRad);
  const vxWind = windSpeed * Math.sin(windRad);
  const vyWind = windSpeed * Math.cos(windRad);

  const vx = vxDrone + vxWind;
  const vy = vyDrone + vyWind;

  return Math.sqrt(vx * vx + vy * vy);
}

/**
 * Assess whether flight conditions are within safe operating envelope.
 */
export interface SafetyAssessment {
  safe: boolean;
  risks: string[];
  batteryMinutes: number;
  windFactor: number;
}

export function assessSafety(
  spec: DroneSpec,
  entity: EntityState,
  env: SimulationParams
): SafetyAssessment {
  const risks: string[] = [];

  // Wind check
  const windFactor = env.windSpeed / spec.maxWindSpeed;
  if (env.windSpeed > spec.maxWindSpeed) {
    risks.push(`Wind speed ${env.windSpeed}m/s exceeds max ${spec.maxWindSpeed}m/s`);
  }
  if (env.weatherCondition === 'typhoon') {
    risks.push('Typhoon conditions — flight not recommended');
  }
  if (env.weatherCondition === 'storm') {
    risks.push('Storm conditions — elevated risk');
  }

  // Battery check
  const power = powerConsumption(
    spec,
    entity.speed,
    0, // assume no payload for safety margin
    entity.position.alt,
    env.temperature
  );
  const flightTimeSec = remainingFlightTime(spec, entity.energyLevel, power);
  const batteryMinutes = flightTimeSec / 60;

  if (batteryMinutes < 5) {
    risks.push(`Critical battery: ${batteryMinutes.toFixed(1)} minutes remaining`);
  } else if (batteryMinutes < 15) {
    risks.push(`Low battery: ${batteryMinutes.toFixed(1)} minutes remaining`);
  }

  return {
    safe: risks.length === 0,
    risks,
    batteryMinutes,
    windFactor,
  };
}
