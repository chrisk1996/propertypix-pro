"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout";
import FloorPlanCanvas2D, {
  type WallSegment,
  type RoomPolygon,
  type DoorData,
  type WindowData,
  type Tool,
} from "@/components/floorplan/FloorPlanCanvas2D";
import ToolPalette from "@/components/floorplan/ToolPalette";
import PropertiesPanel from "@/components/floorplan/PropertiesPanel";
import KeyboardShortcutsHelp from "@/components/floorplan/KeyboardShortcutsHelp";
import FirstTimeUserTutorial, {
  useTutorialState,
} from "@/components/floorplan/FirstTimeUserTutorial";
import ExportModal from "@/components/floorplan/ExportModal";
import { useUndoRedo } from "@/components/floorplan/useUndoRedo";
import {
  useFurniture,
  type FurnitureDragItem,
} from "@/components/floorplan/useFurniture";
import FurnitureLibrary, {
  type FurnitureItem,
} from "@/components/FurnitureLibrary";
import type { PlacedFurniturePiece } from "@/components/PlacedFurniture";
import dynamic from "next/dynamic";

const FloorPlan3DViewer = dynamic(
  () => import("@/components/FloorPlan3DViewer"),
  { ssr: false },
);

type ViewMode = "2d" | "3d" | "split";

export default function FloorPlanPage() {
  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("2d");

  // 2D Editor state with undo/redo
  const {
    state: walls,
    set: setWalls,
    undo: undoWalls,
    redo: redoWalls,
    canUndo: canUndoWalls,
    canRedo: canRedoWalls,
  } = useUndoRedo<WallSegment[]>([]);
  const {
    state: rooms,
    set: setRooms,
    undo: undoRooms,
    redo: redoRooms,
    canUndo: canUndoRooms,
    canRedo: canRedoRooms,
  } = useUndoRedo<RoomPolygon[]>([]);
  const [doors, setDoors] = useState<DoorData[]>([]);
  const [windows, setWindows] = useState<WindowData[]>([]);
  const [tool, setTool] = useState<Tool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<
    "wall" | "room" | "door" | "window" | "furniture" | null
  >(null);

  // Furniture state (2D)
  const {
    furniture: furniture2D,
    selectedFurnitureId,
    setSelectedFurnitureId,
    addFurniture,
    updateFurniture,
    rotateFurniture,
    deleteFurniture,
    clearAllFurniture,
    undoFurniture,
    redoFurniture,
    canUndoFurniture,
    canRedoFurniture,
  } = useFurniture();

  // Selected furniture for placement
  const [selectedFurnitureItem, setSelectedFurnitureItem] =
    useState<FurnitureDragItem | null>(null);

  // 3D Viewer state
  const [placedFurniture, setPlacedFurniture] = useState<
    PlacedFurniturePiece[]
  >([]);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [cameraPreset] = useState<
    "perspective" | "top" | "front" | "side" | "walkthrough"
  >("perspective");
  const [lightingMode] = useState<"day" | "night">("day");

  // Upload state
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tutorial state
  const { showTutorial, setShowTutorial } = useTutorialState();

  // Combined undo/redo
  const handleUndo = useCallback(() => {
    undoWalls();
    undoRooms();
    undoFurniture();
  }, [undoWalls, undoRooms, undoFurniture]);

  const handleRedo = useCallback(() => {
    redoWalls();
    redoRooms();
    redoFurniture();
  }, [redoWalls, redoRooms, redoFurniture]);

  const canUndo = canUndoWalls || canUndoRooms || canUndoFurniture;
  const canRedo = canRedoWalls || canRedoWalls || canRedoFurniture;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedType === "furniture" && selectedFurnitureId) {
          deleteFurniture(selectedFurnitureId);
          setSelectedFurnitureId(null);
          setSelectedType(null);
        } else if (selectedId && selectedType) {
          if (selectedType === "wall")
            setWalls(walls.filter((w) => w.id !== selectedId));
          if (selectedType === "room")
            setRooms(rooms.filter((r) => r.id !== selectedId));
          setSelectedId(null);
          setSelectedType(null);
        }
      }
      if (e.key === "v" || e.key === "V") setTool("select");
      if (e.key === "w" || e.key === "W") setTool("wall");
      if (e.key === "r" || e.key === "R") {
        if (selectedType === "furniture" && selectedFurnitureId) {
          rotateFurniture(selectedFurnitureId);
        } else {
          setTool("room");
        }
      }
      if (e.key === "d" || e.key === "D") setTool("door");
      if (e.key === "h" || e.key === "H") setTool("pan");
      if (e.key === "f" || e.key === "F") setTool("furniture");
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        setShowExportModal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedId,
    selectedType,
    selectedFurnitureId,
    walls,
    rooms,
    setWalls,
    setRooms,
    deleteFurniture,
    rotateFurniture,
    handleUndo,
    handleRedo,
  ]);

  // API response types
  interface WallAPIResponse {
    start: [number, number];
    end: [number, number];
    type: "exterior" | "interior";
  }
  interface RoomAPIResponse {
    name: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }
  interface FloorPlanAPIResponse {
    walls?: WallAPIResponse[];
    rooms?: RoomAPIResponse[];
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const response = await fetch("/api/floorplan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: event.target?.result,
            fileType: file.type,
          }),
        });
        const data: FloorPlanAPIResponse = await response.json();
        if (data.walls) {
          setWalls(
            data.walls.map((w, i) => ({
              id: `wall-${i}`,
              x1: w.start[0] * 20,
              y1: w.start[1] * 20,
              x2: w.end[0] * 20,
              y2: w.end[1] * 20,
              type: w.type,
              thickness: w.type === "exterior" ? 30 : 15,
            })),
          );
        }
        if (data.rooms) {
          setRooms(
            data.rooms.map((r, i) => ({
              id: `room-${i}`,
              name: r.name,
              type: r.type,
              points: [
                r.x * 20,
                r.y * 20,
                (r.x + r.width) * 20,
                r.y * 20,
                (r.x + r.width) * 20,
                (r.y + r.height) * 20,
                r.x * 20,
                (r.y + r.height) * 20,
              ],
            })),
          );
        }
      } catch {
        console.error("Failed to analyze floor plan");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick actions
  const handleSave = useCallback(() => {
    const data = {
      walls,
      rooms,
      doors,
      windows,
      furniture: furniture2D,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("floorplan-project", JSON.stringify(data));
    alert("Project saved!");
  }, [walls, rooms, doors, windows, furniture2D]);

  const handleNew = useCallback(() => {
    if (confirm("Clear all and start new project?")) {
      setWalls([]);
      setRooms([]);
      setDoors([]);
      setWindows([]);
      clearAllFurniture();
    }
  }, [setWalls, setRooms, clearAllFurniture]);

  return (
    <AppLayout title="Floor Planner">
      <FirstTimeUserTutorial
        onComplete={() => setShowTutorial(false)}
        forceShow={showTutorial}
      />

      {/* Main layout: Tools | Canvas Area + Furniture Bar | Properties */}
      <div className="flex h-[calc(100vh-5rem)]">
        {/* Tool Palette (left sidebar) */}
        <div data-tutorial="tools">
          <ToolPalette activeTool={tool} onToolChange={setTool} />
        </div>

        {/* Center: Canvas + Furniture Library */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Unified top toolbar: View modes + Actions + Upload */}
          <div
            className="flex items-center border-b border-slate-200 bg-white px-2 py-2 gap-1"
            data-tutorial="views"
          >
            {/* View mode buttons */}
            <div className="flex rounded-lg overflow-hidden border border-slate-200">
              <button
                onClick={() => setViewMode("2d")}
                className={`px-4 py-2 text-sm font-semibold transition-all ${
                  viewMode === "2d"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                2D
              </button>
              <button
                onClick={() => setViewMode("3d")}
                className={`px-4 py-2 text-sm font-semibold transition-all border-l border-slate-200 ${
                  viewMode === "3d"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                3D
              </button>
              <button
                onClick={() => setViewMode("split")}
                className={`px-4 py-2 text-sm font-semibold transition-all border-l border-slate-200 ${
                  viewMode === "split"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Split
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-200 mx-2" />

            {/* Action buttons */}
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`px-3 py-2 text-sm rounded-lg transition-all ${
                canUndo
                  ? "text-slate-600 hover:bg-slate-100"
                  : "text-slate-300 cursor-not-allowed"
              }`}
              title="Undo (⌘Z)"
            >
              <span className="material-symbols-outlined text-lg">undo</span>
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`px-3 py-2 text-sm rounded-lg transition-all ${
                canRedo
                  ? "text-slate-600 hover:bg-slate-100"
                  : "text-slate-300 cursor-not-allowed"
              }`}
              title="Redo (⌘Y)"
            >
              <span className="material-symbols-outlined text-lg">redo</span>
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-200 mx-2" />

            <button
              onClick={handleSave}
              className="px-3 py-2 text-sm rounded-lg text-slate-600 hover:bg-slate-100 transition-all"
              title="Save (⌘S)"
            >
              <span className="material-symbols-outlined text-lg">save</span>
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="px-3 py-2 text-sm rounded-lg text-slate-600 hover:bg-slate-100 transition-all"
              title="Export (⌘E)"
            >
              <span className="material-symbols-outlined text-lg">
                download
              </span>
            </button>
            <button
              onClick={handleNew}
              className="px-3 py-2 text-sm rounded-lg text-slate-600 hover:bg-slate-100 transition-all"
              title="New Project"
            >
              <span className="material-symbols-outlined text-lg">add</span>
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all"
            >
              <span className="material-symbols-outlined text-lg">upload</span>
              <span className="hidden sm:inline">Upload</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Canvas area - takes remaining height */}
          <div
            className={`flex-1 flex min-h-0 ${
              viewMode === "split" ? "divide-x divide-slate-200" : ""
            }`}
          >
            {(viewMode === "2d" || viewMode === "split") && (
              <div
                ref={canvasContainerRef}
                className={`relative ${viewMode === "split" ? "w-1/2" : "flex-1"}`}
              >
                <FloorPlanCanvas2D
                  tool={tool}
                  walls={walls}
                  rooms={rooms}
                  doors={doors}
                  windows={windows}
                  furniture={furniture2D}
                  selectedFurnitureId={selectedFurnitureId}
                  onWallsChange={setWalls}
                  onRoomsChange={setRooms}
                  onSelectionChange={(id, type) => {
                    setSelectedId(id);
                    setSelectedType(type);
                    if (id) setSelectedFurnitureId(null);
                  }}
                  onFurniturePlace={(x, y) => {
                    if (selectedFurnitureItem) {
                      addFurniture(selectedFurnitureItem, x, y);
                    }
                  }}
                  onFurnitureSelect={(id) => {
                    setSelectedFurnitureId(id);
                    if (id) {
                      setSelectedId(null);
                      setSelectedType("furniture");
                    }
                  }}
                  onFurnitureMove={(id, x, y) => {
                    updateFurniture(id, { x, y });
                  }}
                  onFurnitureRotate={rotateFurniture}
                  onFurnitureDelete={deleteFurniture}
                />
              </div>
            )}
            {(viewMode === "3d" || viewMode === "split") && (
              <div className={viewMode === "split" ? "w-1/2" : "flex-1"}>
                <FloorPlan3DViewer
                  floorPlanData={{
                    rooms: rooms.map((r) => ({
                      name: r.name,
                      x: r.points[0] / 20,
                      y: r.points[1] / 20,
                      width: (r.points[4] - r.points[0]) / 20,
                      height: (r.points[5] - r.points[1]) / 20,
                      type: r.type,
                    })),
                    walls: walls.map((w) => ({
                      start: [w.x1 / 20, w.y1 / 20] as [number, number],
                      end: [w.x2 / 20, w.y2 / 20] as [number, number],
                      type: w.type,
                    })),
                    doors: [],
                    windows: [],
                    totalArea: 0,
                    bedroomCount: 0,
                    bathroomCount: 0,
                  }}
                  furniture={placedFurniture}
                  selectedPieceId={selectedPieceId}
                  onFurniturePlace={(pos) => {
                    if (!selectedFurnitureItem) return;
                    setPlacedFurniture((prev) => [
                      ...prev,
                      {
                        id: `${selectedFurnitureItem.id}-${Date.now()}`,
                        furniture: {
                          id: selectedFurnitureItem.id,
                          name: selectedFurnitureItem.name,
                          category: selectedFurnitureItem.category,
                          dimensions: {
                            width: selectedFurnitureItem.width,
                            height: 1,
                            depth: selectedFurnitureItem.height,
                          },
                          color: selectedFurnitureItem.color,
                        } as FurnitureItem,
                        position: [pos[0], 0, pos[2]],
                        rotation: 0,
                        scale: 1,
                      },
                    ]);
                  }}
                  onFurnitureSelect={setSelectedPieceId}
                  cameraPreset={cameraPreset}
                  lightingMode={lightingMode}
                />
              </div>
            )}
          </div>

          {/* Bottom Furniture Library - INSIDE the flex-col container */}
          <div
            className="h-32 border-t border-slate-200 bg-white p-4 flex-shrink-0"
            data-tutorial="furniture"
          >
            <div className="flex items-center gap-4 h-full">
              <FurnitureLibrary
                selectedFurniture={
                  selectedFurnitureItem
                    ? {
                        id: selectedFurnitureItem.id,
                        name: selectedFurnitureItem.name,
                        category: selectedFurnitureItem.category,
                        dimensions: {
                          width: selectedFurnitureItem.width,
                          height: 1,
                          depth: selectedFurnitureItem.height,
                        },
                        color: selectedFurnitureItem.color,
                        icon: selectedFurnitureItem.id,
                      }
                    : null
                }
                onSelectFurniture={(item) => {
                  if (item) {
                    setSelectedFurnitureItem({
                      id: item.id,
                      name: item.name,
                      category: item.category,
                      width: item.dimensions.width,
                      height: item.dimensions.depth,
                      color: item.color,
                    });
                    setTool("furniture");
                  } else {
                    setSelectedFurnitureItem(null);
                  }
                }}
                compact
              />
            </div>
          </div>
        </div>

        {/* Properties Panel (right sidebar) */}
        <div data-tutorial="properties">
          <PropertiesPanel
            selectedId={selectedId}
            selectedType={
              selectedType === "furniture"
                ? null
                : (selectedType as "wall" | "room" | "door" | "window" | null)
            }
            wall={
              selectedType === "wall"
                ? walls.find((w) => w.id === selectedId)
                : undefined
            }
            room={
              selectedType === "room"
                ? rooms.find((r) => r.id === selectedId)
                : undefined
            }
            door={
              selectedType === "door"
                ? doors.find((d) => d.id === selectedId)
                : undefined
            }
            window={
              selectedType === "window"
                ? windows.find((w) => w.id === selectedId)
                : undefined
            }
            onWallUpdate={(wall) =>
              setWalls(walls.map((w) => (w.id === wall.id ? wall : w)))
            }
            onRoomUpdate={(room) =>
              setRooms(rooms.map((r) => (r.id === room.id ? room : r)))
            }
            onDelete={() => {
              if (selectedType === "wall")
                setWalls(walls.filter((w) => w.id !== selectedId));
              if (selectedType === "room")
                setRooms(rooms.filter((r) => r.id !== selectedId));
              setSelectedId(null);
              setSelectedType(null);
            }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10">
      </div>

      {/* Processing overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-white px-8 py-6 rounded-2xl shadow-2xl flex items-center gap-4">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="font-semibold">Analyzing floor plan...</span>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts help */}
      <div data-tutorial="shortcuts">
        <KeyboardShortcutsHelp />
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        canvasRef={canvasContainerRef}
        walls={walls}
        rooms={rooms}
      />
    </AppLayout>
  );
}
