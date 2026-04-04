// Floor plan store with Zustand + Zundo
import { create } from 'zustand';
import { temporal } from 'zundo';
import { WallNode, createWall } from './nodes/wall';
import { RoomNode, createRoom } from './nodes/room';
import { DoorNode, createDoor } from './nodes/door';
import { WindowNode, createWindow } from './nodes/window';
import { FurnitureNode, createFurniture } from './nodes/furniture';

// Tool types
export type Tool =
  | 'select'
  | 'wall'
  | 'room'
  | 'door'
  | 'window'
  | 'furniture'
  | 'pan'
  | 'measure';

// View mode
export type ViewMode = '2d' | '3d' | 'split';

// Floor plan state
export interface FloorPlanState {
  // Nodes
  walls: WallNode[];
  rooms: RoomNode[];
  doors: DoorNode[];
  windows: WindowNode[];
  furniture: FurnitureNode[];

  // Selection
  selectedId: string | null;
  selectedType: 'wall' | 'room' | 'door' | 'window' | 'furniture' | null;

  // Tool state
  activeTool: Tool;
  viewMode: ViewMode;

  // Canvas state
  scale: number;
  offset: { x: number; y: number };

  // Grid settings
  gridSize: number; // pixels per grid unit
  snapEnabled: boolean;
}

// Floor plan actions
export interface FloorPlanActions {
  // Node CRUD
  addWall: (start: [number, number], end: [number, number]) => void;
  updateWall: (id: string, updates: Partial<WallNode>) => void;
  deleteWall: (id: string) => void;

  addRoom: (points: number[]) => void;
  updateRoom: (id: string, updates: Partial<RoomNode>) => void;
  deleteRoom: (id: string) => void;

  addDoor: (wallId: string, position: number) => void;
  updateDoor: (id: string, updates: Partial<DoorNode>) => void;
  deleteDoor: (id: string) => void;

  addWindow: (wallId: string, position: number) => void;
  updateWindow: (id: string, updates: Partial<WindowNode>) => void;
  deleteWindow: (id: string) => void;

  addFurniture: (catalogId: string, position: [number, number, number]) => void;
  updateFurniture: (id: string, updates: Partial<FurnitureNode>) => void;
  deleteFurniture: (id: string) => void;

  // Selection
  select: (id: string | null, type: FloorPlanState['selectedType']) => void;

  // Tool state
  setTool: (tool: Tool) => void;
  setViewMode: (mode: ViewMode) => void;

  // Canvas state
  setScale: (scale: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setOffset: (offset: { x: number; y: number }) => void;

  // Grid
  toggleSnap: () => void;

  // Bulk operations
  clearAll: () => void;
  loadProject: (state: Partial<FloorPlanState>) => void;
}

// Initial state
const initialState: FloorPlanState = {
  walls: [],
  rooms: [],
  doors: [],
  windows: [],
  furniture: [],
  selectedId: null,
  selectedType: null,
  activeTool: 'select',
  viewMode: '2d',
  scale: 1,
  offset: { x: 0, y: 0 },
  gridSize: 20, // 20px = 1 meter at scale 1
  snapEnabled: true,
};

// Create store with temporal (undo/redo)
export const useFloorPlanStore = create<FloorPlanState & FloorPlanActions>()(
  temporal((set, get) => ({
    ...initialState,

    // Wall actions
    addWall: (start, end) => {
      const wall = createWall(start, end);
      set((state) => ({ walls: [...state.walls, wall] }));
    },
    updateWall: (id, updates) => {
      set((state) => ({
        walls: state.walls.map((w) =>
          w.id === id ? { ...w, ...updates, updatedAt: Date.now() } : w
        ),
      }));
    },
    deleteWall: (id) => {
      set((state) => ({
        walls: state.walls.filter((w) => w.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
        selectedType: state.selectedId === id ? null : state.selectedType,
      }));
    },

    // Room actions
    addRoom: (points) => {
      const room = createRoom(points);
      set((state) => ({ rooms: [...state.rooms, room] }));
    },
    updateRoom: (id, updates) => {
      set((state) => ({
        rooms: state.rooms.map((r) =>
          r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r
        ),
      }));
    },
    deleteRoom: (id) => {
      set((state) => ({
        rooms: state.rooms.filter((r) => r.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
        selectedType: state.selectedId === id ? null : state.selectedType,
      }));
    },

    // Door actions
    addDoor: (wallId, position) => {
      const door = createDoor(wallId, position);
      set((state) => ({ doors: [...state.doors, door] }));
    },
    updateDoor: (id, updates) => {
      set((state) => ({
        doors: state.doors.map((d) =>
          d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d
        ),
      }));
    },
    deleteDoor: (id) => {
      set((state) => ({
        doors: state.doors.filter((d) => d.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
        selectedType: state.selectedId === id ? null : state.selectedType,
      }));
    },

    // Window actions
    addWindow: (wallId, position) => {
      const window = createWindow(wallId, position);
      set((state) => ({ windows: [...state.windows, window] }));
    },
    updateWindow: (id, updates) => {
      set((state) => ({
        windows: state.windows.map((w) =>
          w.id === id ? { ...w, ...updates, updatedAt: Date.now() } : w
        ),
      }));
    },
    deleteWindow: (id) => {
      set((state) => ({
        windows: state.windows.filter((w) => w.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
        selectedType: state.selectedId === id ? null : state.selectedType,
      }));
    },

    // Furniture actions
    addFurniture: (catalogId, position) => {
      const furniture = createFurniture(catalogId, position);
      set((state) => ({ furniture: [...state.furniture, furniture] }));
    },
    updateFurniture: (id, updates) => {
      set((state) => ({
        furniture: state.furniture.map((f) =>
          f.id === id ? { ...f, ...updates, updatedAt: Date.now() } : f
        ),
      }));
    },
    deleteFurniture: (id) => {
      set((state) => ({
        furniture: state.furniture.filter((f) => f.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
        selectedType: state.selectedId === id ? null : state.selectedType,
      }));
    },

    // Selection
    select: (id, type) => {
      set({ selectedId: id, selectedType: type });
    },

    // Tool state
    setTool: (tool) => {
      set({ activeTool: tool });
    },
    setViewMode: (mode) => {
      set({ viewMode: mode });
    },

    // Canvas state
    setScale: (scale) => {
      set({ scale: Math.max(0.1, Math.min(5, scale)) });
    },
    zoomIn: () => {
      set((state) => ({ scale: Math.min(5, state.scale * 1.2) }));
    },
    zoomOut: () => {
      set((state) => ({ scale: Math.max(0.1, state.scale / 1.2) }));
    },
    setOffset: (offset) => {
      set({ offset });
    },

    // Grid
    toggleSnap: () => {
      set((state) => ({ snapEnabled: !state.snapEnabled }));
    },

    // Bulk operations
    clearAll: () => {
      set({
        walls: [],
        rooms: [],
        doors: [],
        windows: [],
        furniture: [],
        selectedId: null,
        selectedType: null,
      });
    },
    loadProject: (state) => {
      set({ ...initialState, ...state });
    },
  }))
);

// Export temporal for undo/redo
export const useTemporalStore = <T>(
  selector: (state: FloorPlanState) => T
) => {
  const temporalStore = useFloorPlanStore.temporal;
  return selector(temporalStore.getState() as FloorPlanState);
};

// Undo/Redo helpers
export const useFloorPlanUndo = () => {
  const { undo, redo, clear } = useFloorPlanStore.temporal.getState();
  const canUndo = useFloorPlanStore.temporal.getState().past.length > 0;
  const canRedo = useFloorPlanStore.temporal.getState().future.length > 0;
  return { undo, redo, clear, canUndo, canRedo };
};
