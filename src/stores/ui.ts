/**
 * @module stores/ui
 * @description Local UI state management via Zustand.
 *
 * Per PublicOS 2.0 spec §2.3:
 * - Local UI state (sidebar, tool selection) → Zustand
 * - Shared collaborative state (map, simulation) → Yjs (separate module)
 *
 * This separation prevents high-frequency map events from triggering
 * unnecessary React re-renders in unrelated UI components.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActiveTool =
  | 'select'
  | 'draw-point'
  | 'draw-line'
  | 'draw-polygon'
  | 'measure'
  | 'simulate';

export type SidebarPanel =
  | 'layers'
  | 'simulation'
  | 'ai'
  | 'plugins'
  | 'collaboration'
  | null;

interface UIState {
  // --- Sidebar ---
  sidebarOpen: boolean;
  activePanel: SidebarPanel;
  toggleSidebar: () => void;
  setActivePanel: (panel: SidebarPanel) => void;

  // --- Active Tool ---
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;

  // --- AI Panel ---
  aiPanelOpen: boolean;
  toggleAiPanel: () => void;

  // --- Loading States ---
  isMapReady: boolean;
  setMapReady: (ready: boolean) => void;
  loadingMessage: string | null;
  setLoadingMessage: (msg: string | null) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Sidebar
      sidebarOpen: true,
      activePanel: 'layers',
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setActivePanel: (panel) => set({ activePanel: panel, sidebarOpen: true }),

      // Active Tool
      activeTool: 'select',
      setActiveTool: (tool) => set({ activeTool: tool }),

      // AI Panel
      aiPanelOpen: false,
      toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),

      // Loading
      isMapReady: false,
      setMapReady: (ready) => set({ isMapReady: ready }),
      loadingMessage: 'Initializing spatial engine...',
      setLoadingMessage: (msg) => set({ loadingMessage: msg }),
    }),
    { name: 'publicos-ui' }
  )
);
