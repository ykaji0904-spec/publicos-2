/**
 * @module lib/ai/tools
 * @description Function Calling tool definitions for AI orchestration.
 *
 * These JSON schemas are sent to the LLM (Claude/OpenAI) to enable
 * structured tool use. The AI "System Operator" can invoke any of these
 * tools to manipulate the PublicOS system.
 *
 * @see PublicOS 2.0 spec §7.1
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Zod Schemas (used for runtime validation of AI tool calls)
// ---------------------------------------------------------------------------

export const MapFlyToSchema = z.object({
  location: z.union([
    z.string().describe('Place name or address to geocode'),
    z.object({
      lng: z.number(),
      lat: z.number(),
    }),
  ]),
  zoom: z.number().min(0).max(22).optional(),
  pitch: z.number().min(0).max(85).optional(),
  bearing: z.number().min(0).max(360).optional(),
});

export const UploadDataSchema = z.object({
  url: z.string().url().describe('URL of the data source to ingest'),
  name: z.string().optional().describe('Display name for the layer'),
  autoStyle: z.boolean().default(true).describe('Auto-detect and apply styling'),
});

export const SetSimulationParamsSchema = z.object({
  windSpeed: z.number().min(0).max(100).optional(),
  windDirection: z.number().min(0).max(360).optional(),
  weatherCondition: z
    .enum(['clear', 'rain', 'storm', 'typhoon', 'snow'])
    .optional(),
  temperature: z.number().min(-50).max(60).optional(),
  timeScale: z.number().min(0.1).max(100).optional(),
});

export const AddPluginSchema = z.object({
  pluginId: z.string().describe('Plugin identifier from the registry'),
  config: z.record(z.unknown()).optional(),
});

export const RunInterpolationSchema = z.object({
  mode: z.enum(['realtime', 'smooth', 'predictive']),
});

export const QueryFeaturesSchema = z.object({
  layerId: z.string(),
  bbox: z
    .object({
      west: z.number(),
      south: z.number(),
      east: z.number(),
      north: z.number(),
    })
    .optional(),
  filter: z.record(z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Tool Definitions (for LLM function calling)
// ---------------------------------------------------------------------------

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * Complete set of tools exposed to the AI orchestration layer.
 * Format compatible with both Anthropic and OpenAI function calling APIs.
 */
export const AI_TOOLS: ToolDefinition[] = [
  {
    name: 'map_fly_to',
    description:
      'Move the map camera to a specified location. Accepts a place name (will be geocoded) or explicit coordinates.',
    parameters: {
      type: 'object',
      properties: {
        location: {
          oneOf: [
            { type: 'string', description: 'Place name or address' },
            {
              type: 'object',
              properties: {
                lng: { type: 'number' },
                lat: { type: 'number' },
              },
              required: ['lng', 'lat'],
            },
          ],
        },
        zoom: { type: 'number', minimum: 0, maximum: 22 },
        pitch: { type: 'number', minimum: 0, maximum: 85 },
        bearing: { type: 'number', minimum: 0, maximum: 360 },
      },
      required: ['location'],
    },
  },
  {
    name: 'set_simulation_params',
    description:
      'Update simulation environment parameters. Changes are synchronized to all connected users via CRDT.',
    parameters: {
      type: 'object',
      properties: {
        windSpeed: { type: 'number', description: 'Wind speed in m/s' },
        windDirection: {
          type: 'number',
          description: 'Wind direction in degrees (0=N)',
        },
        weatherCondition: {
          type: 'string',
          enum: ['clear', 'rain', 'storm', 'typhoon', 'snow'],
        },
        temperature: { type: 'number', description: 'Temperature in Celsius' },
        timeScale: { type: 'number', description: 'Simulation speed multiplier' },
      },
    },
  },
  {
    name: 'upload_data',
    description:
      'Ingest external data into the platform. Triggers the Tippecanoe pipeline for automatic tiling.',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Data source URL' },
        name: { type: 'string', description: 'Display name for the layer' },
        autoStyle: {
          type: 'boolean',
          description: 'Auto-detect and apply styling',
          default: true,
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'add_plugin',
    description:
      'Install and activate a plugin from the registry. Plugin runs in a WASM sandbox.',
    parameters: {
      type: 'object',
      properties: {
        pluginId: { type: 'string', description: 'Plugin identifier' },
        config: { type: 'object', description: 'Plugin configuration' },
      },
      required: ['pluginId'],
    },
  },
  {
    name: 'run_interpolation',
    description:
      'Switch the animation interpolation mode for entity movement rendering.',
    parameters: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['realtime', 'smooth', 'predictive'],
          description:
            'realtime: minimal delay; smooth: buffered LERP/SLERP; predictive: extrapolation',
        },
      },
      required: ['mode'],
    },
  },
  {
    name: 'query_features',
    description:
      'Query geographic features from a specific layer, optionally filtered by bounding box or attributes.',
    parameters: {
      type: 'object',
      properties: {
        layerId: { type: 'string' },
        bbox: {
          type: 'object',
          properties: {
            west: { type: 'number' },
            south: { type: 'number' },
            east: { type: 'number' },
            north: { type: 'number' },
          },
        },
        filter: { type: 'object' },
      },
      required: ['layerId'],
    },
  },
];
