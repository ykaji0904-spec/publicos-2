# PublicOS 2.0 — Spatial Operating System

> From static GIS to a living, autonomous spatial operating system.

PublicOS 2.0 is an open spatial computing platform that fuses real-time 3D visualization, collaborative editing (CRDT), extensible plugin architecture (WASM sandbox), physics-aware simulation, and agentic AI orchestration into a unified web-based environment.

## Architecture Pillars

| Pillar | Technology | Purpose |
|--------|-----------|---------|
| **Rendering** | Mapbox GL JS v3 + deck.gl (interleaved) | Depth-correct 2.5D/3D hybrid visualization |
| **Collaboration** | Yjs (CRDT) + WebSocket (Hocuspocus) | Multi-user real-time state sync |
| **Data Pipeline** | Tippecanoe + PMTiles + S3 | "Upload Anything" serverless tiling |
| **Extensibility** | QuickJS + WebAssembly sandbox | Safe third-party plugin execution |
| **Simulation** | LERP/SLERP interpolation + GPU instancing | Smooth physics-aware animation at 60fps |
| **AI Kernel** | Claude / OpenAI Function Calling | Natural language → system operations |

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Map Engine**: Mapbox GL JS v3
- **Overlay Engine**: deck.gl (MapboxOverlay, interleaved mode)
- **State Management**: Zustand (local UI) + Yjs (shared collaborative state)
- **Backend**: Supabase (PostgreSQL + PostGIS)
- **Auth**: Supabase Auth / Auth.js
- **Hosting**: Vercel
- **AI**: Anthropic Claude API / OpenAI API

## Implementation Roadmap

```
Phase 1: Sovereign Foundation    — Base map + interleaved rendering
Phase 2: Collaboration Fabric   — CRDT sync + cursor presence
Phase 3: Data Pipeline           — Upload Anything + PMTiles
Phase 4: Plugin Kernel           — WASM sandbox + plugin API
Phase 5: Simulation Loop         — LERP/SLERP + GPU instancing
Phase 6: AI Orchestration        — Function Calling + feedback loop
```

## Project Structure

```
publicos-2/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (map)/              # Map layout group
│   │   └── api/                # API routes (upload, ai, ws)
│   ├── components/
│   │   ├── map/                # Map renderer, controls, layers
│   │   ├── ui/                 # Shared UI components
│   │   ├── collaboration/      # Cursor presence, user list
│   │   ├── simulation/         # Simulation controls, timeline
│   │   └── ai/                 # AI chat panel, command palette
│   ├── lib/
│   │   ├── map/                # Mapbox/deck.gl initialization
│   │   ├── collaboration/      # Yjs providers, awareness
│   │   ├── data-pipeline/      # Upload handlers, tile processing
│   │   ├── plugins/            # WASM sandbox, plugin loader
│   │   ├── simulation/         # Interpolation engine, animation loop
│   │   ├── ai/                 # LLM client, function schemas
│   │   ├── physics/            # Physics models (drone, fluid, wind)
│   │   └── utils/              # Shared utilities
│   ├── types/                  # TypeScript type definitions
│   ├── stores/                 # Zustand stores
│   └── workers/                # Web Workers (WASM, computation)
├── public/                     # Static assets
├── plugins/examples/           # Example plugin implementations
├── docs/                       # Architecture & API documentation
├── tests/                      # Unit & integration tests
└── .github/workflows/          # CI/CD pipelines
```

## Getting Started

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

## License

Apache 2.0

---

*We no longer merely map the world — we encode its behavior.*
