# Floor Planner Rework Plan

## Overview
Rebuild the Floor Planner based on the Pascal Editor architecture patterns for a more robust, maintainable implementation.

## Phase 1: Core Architecture (Zustand Store)

### 1.1 Create Zustand Store with Zundo
- [ ] Install zustand and zundo
- [ ] Create `src/store/floorplan/store.ts`
- [ ] Define node types: Wall, Room, Door, Window, Furniture
- [ ] Implement selection state
- [ ] Add undo/redo with zundo

### 1.2 Node Schema Definitions
- [ ] WallNode: start/end points, thickness, height, type
- [ ] RoomNode: polygon points, name, type, floor material
- [ ] DoorNode: position, width, rotation, wall reference
- [ ] WindowNode: position, width, rotation, wall reference
- [ ] FurnitureNode: model reference, position, rotation, scale

## Phase 2: 2D Canvas Rework

### 2.1 New Canvas Architecture
- [ ] Separate drawing logic from rendering
- [ ] Implement proper event handling (mouse, touch)
- [ ] Add snap-to-grid utility
- [ ] Create tool system: Select, Wall, Room, Door, Window, Furniture, Pan

### 2.2 Renderers
- [ ] WallRenderer: Draw walls with proper thickness
- [ ] RoomRenderer: Fill rooms with type-based colors
- [ ] DoorRenderer: Door symbols
- [ ] WindowRenderer: Window symbols
- [ ] FurnitureRenderer: Furniture icons/shapes
- [ ] GridRenderer: Background grid
- [ ] GuideRenderer: Snap guides

### 2.3 Interactions
- [ ] Click to select
- [ ] Drag to move
- [ ] Double-click to edit
- [ ] Draw mode for walls/rooms
- [ ] Furniture placement

## Phase 3: 3D Viewer Rework

### 3.1 Scene Registry
- [ ] Map node IDs to Three.js objects
- [ ] Fast lookup for selection highlighting

### 3.2 Geometry Generation
- [ ] Wall geometry from start/end points
- [ ] Room floor/ceiling from polygon
- [ ] Door/window cutouts in walls
- [ ] Furniture loading from GLB

### 3.3 Camera Controls
- [ ] Orbit controls
- [ ] Zoom buttons (connected!)
- [ ] Camera presets: perspective, top, front, walkthrough
- [ ] First-person mode

## Phase 4: UI Components

### 4.1 Layout
- [ ] Fixed sidebar layout (no overlaps!)
- [ ] Top toolbar with view modes
- [ ] Left: Tool palette
- [ ] Right: Properties panel
- [ ] Bottom: Furniture library

### 4.2 Properties Panel
- [ ] Wall properties: thickness, height, type
- [ ] Room properties: name, type, floor
- [ ] Door/window: width, height
- [ ] Furniture: rotation, scale, delete

## Phase 5: Export

- [ ] PNG export from canvas
- [ ] PDF export
- [ ] SVG export
- [ ] GLTF/GLB export from 3D scene

## Implementation Order

1. **Tonight:** Phase 1.1 - Zustand store setup
2. **Tomorrow morning:** Phase 2.1 - Canvas architecture
3. **Tomorrow:** Phase 2.2 & 2.3 - Renderers and interactions
4. **Tomorrow:** Phase 4 - UI layout fix
5. **Later:** Phase 3 - 3D viewer
6. **Later:** Phase 5 - Export

---

## Key Architectural Decisions

1. **Zustand + Zundo** for state management (like Pascal Editor)
2. **Separate renderers** for each node type
3. **Scene registry** for fast object lookup
4. **Dirty node processing** - only regenerate changed geometry
5. **Fixed layout** - no overlaps, proper z-indexing

## Files to Create/Modify

### New Files
- `src/store/floorplan/store.ts`
- `src/store/floorplan/nodes/wall.ts`
- `src/store/floorplan/nodes/room.ts`
- `src/store/floorplan/nodes/door.ts`
- `src/store/floorplan/nodes/window.ts`
- `src/store/floorplan/nodes/furniture.ts`
- `src/components/floorplan-v2/FloorPlanEditor.tsx`
- `src/components/floorplan-v2/Canvas2D.tsx`
- `src/components/floorplan-v2/Viewer3D.tsx`
- `src/components/floorplan-v2/renderers/*.tsx`
- `src/components/floorplan-v2/tools/*.tsx`

### Modified Files
- `src/app/floorplan/page.tsx` - Use new FloorPlanEditor

---

*Created: 2026-04-04 21:15*
*Status: Phase 1 in progress*
