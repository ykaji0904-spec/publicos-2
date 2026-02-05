/**
 * @module types/ai
 * @description Types for AI orchestration layer (Claude/OpenAI Function Calling).
 *
 * The AI kernel acts as a "System Operator" — translating natural language
 * into concrete operations across all PublicOS modules via typed tool schemas.
 */

import type { SimulationParams } from './simulation';

// ---------------------------------------------------------------------------
// Tool Definitions (Function Calling Schema)
// ---------------------------------------------------------------------------

/**
 * All tools the AI can invoke against the PublicOS system.
 * Each tool maps to a concrete system operation.
 */
export type AIToolName =
  | 'map_fly_to'
  | 'map_add_layer'
  | 'map_remove_layer'
  | 'upload_data'
  | 'set_simulation_params'
  | 'run_simulation'
  | 'add_plugin'
  | 'remove_plugin'
  | 'run_interpolation'
  | 'add_annotation'
  | 'query_features'
  | 'export_snapshot';

export interface AIToolCall {
  name: AIToolName;
  arguments: Record<string, unknown>;
}

export interface AIToolResult {
  toolName: AIToolName;
  success: boolean;
  data?: unknown;
  error?: string;
}

// ---------------------------------------------------------------------------
// Conversation
// ---------------------------------------------------------------------------

export type AIMessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface AIMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  toolCalls?: AIToolCall[];
  toolResults?: AIToolResult[];
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Tool Parameter Types
// ---------------------------------------------------------------------------

export interface MapFlyToParams {
  location: string | { lng: number; lat: number };
  zoom?: number;
  pitch?: number;
  bearing?: number;
}

export interface UploadDataParams {
  url: string;
  name?: string;
  autoStyle?: boolean;
}

export interface SetSimulationParamsPayload {
  params: Partial<SimulationParams>;
}

export interface AddPluginParams {
  pluginId: string;
  config?: Record<string, unknown>;
}

export interface RunInterpolationParams {
  mode: 'realtime' | 'smooth' | 'predictive';
}
