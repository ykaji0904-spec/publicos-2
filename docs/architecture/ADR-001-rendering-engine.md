# ADR-001: Hybrid Rendering Engine Selection

## Status
Accepted

## Context
PublicOS 2.0 requires depth-correct compositing of 2.5D base maps (Mapbox GL JS) with 3D simulation overlays (deck.gl). The system must support PLATEAU 3D city models occluding simulation particles (drones, wind) and vice versa.

## Decision
**Mapbox GL JS v3 (base) + deck.gl (overlay) in interleaved mode.**

- `MapboxOverlay` with `interleaved: true` shares the WebGL2 context
- Shared depth buffer enables correct occlusion without dual-canvas overhead
- Mapbox handles: base map tiles, vector styling, terrain (GSI DEM), 3D buildings
- deck.gl handles: simulation entities, heatmaps, point clouds, custom layers

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| CesiumJS only | True 3D, WGS84 globe, native 3D Tiles | Heavy (~79MB), poor mobile perf, no CRDT ecosystem |
| Mapbox only | Fast, great UX, vector tiles | 2.5D only, no true depth compositing for overlays |
| MapLibre + deck.gl | OSS, no vendor lock-in | Smaller ecosystem, less stable interleaved mode |

## Consequences
- Urban-scale focus (city/prefecture level) — not global/orbital scale
- CesiumJS can be integrated later as a plugin (Phase 4) for orbital views
- Terrain uses GSI Terrain-RGB tiles (Japan-specific, high accuracy)

## References
- PublicOS 2.0 Design Spec §2.1-2.2
- deck.gl MapboxOverlay docs: https://deck.gl/docs/api-reference/mapbox/mapbox-overlay
