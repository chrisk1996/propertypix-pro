'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Environment, Text } from '@react-three/drei';
import { useMemo, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import PlacedFurniture, { type PlacedFurniturePiece } from './PlacedFurniture';
import type { FurnitureItem } from './FurnitureLibrary';

interface Room {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
}

interface Wall {
  start: [number, number];
  end: [number, number];
  type: 'exterior' | 'interior';
}

interface Door {
  position: [number, number];
  rotation: number;
  room: string;
}

interface Window {
  position: [number, number];
  width: number;
  wall: 'exterior';
}

interface FloorPlanData {
  rooms: Room[];
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  totalArea: number;
  bedroomCount: number;
  bathroomCount: number;
}

// Room color mapping
const ROOM_COLORS: Record<string, string> = {
  living: '#e8f5e9',
  kitchen: '#fff3e0',
  bedroom: '#e3f2fd',
  bathroom: '#e0f7fa',
  dining: '#fce4ec',
  office: '#f3e5f5',
  garage: '#efebe9',
  default: '#f5f5f5',
};

const WALL_COLORS: Record<string, string> = {
  living: '#81c784',
  kitchen: '#ffb74d',
  bedroom: '#64b5f6',
  bathroom: '#4dd0e1',
  dining: '#f06292',
  office: '#ba68c8',
  garage: '#a1887f',
  default: '#bdbdbd',
};

// Dynamic room renderer
function RoomMesh({ room }: { room: Room }) {
  const floorColor = ROOM_COLORS[room.type] || ROOM_COLORS.default;
  const wallColor = WALL_COLORS[room.type] || WALL_COLORS.default;
  const wallHeight = 2.8;
  const wallThickness = 0.15;

  return (
    <group position={[room.x, 0, room.y]}>
      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[room.width / 2, 0.01, room.height / 2]}
        receiveShadow
      >
        <planeGeometry args={[room.width, room.height]} />
        <meshStandardMaterial color={floorColor} />
      </mesh>

      {/* Walls */}
      <mesh position={[room.width / 2, wallHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[room.width, wallHeight, wallThickness]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh position={[room.width / 2, wallHeight / 2, room.height]} castShadow receiveShadow>
        <boxGeometry args={[room.width, wallHeight, wallThickness]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh
        position={[0, wallHeight / 2, room.height / 2]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[room.height, wallHeight, wallThickness]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh
        position={[room.width, wallHeight / 2, room.height / 2]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[room.height, wallHeight, wallThickness]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* Room label */}
      <Text
        position={[room.width / 2, 0.1, room.height / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.3}
        color="#333"
        anchorX="center"
        anchorY="middle"
      >
        {room.name}
      </Text>
    </group>
  );
}

// Floor click handler for placing furniture
function FloorClickHandler({
  onFloorClick,
  rooms,
}: {
  onFloorClick: (point: THREE.Vector3) => void;
  rooms: Room[];
}) {
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useRef(new THREE.Vector2());

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      // Calculate mouse position in normalized device coordinates
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse.current, camera);

      // Create a plane at y=0 (floor)
      const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();

      if (raycaster.ray.intersectPlane(floorPlane, intersection)) {
        // Check if click is within any room bounds
        const isInRoom = rooms.some(
          (room) =>
            intersection.x >= room.x &&
            intersection.x <= room.x + room.width &&
            intersection.z >= room.y &&
            intersection.z <= room.y + room.height
        );

        if (isInRoom || rooms.length === 0) {
          onFloorClick(intersection);
        }
      }
    };

    gl.domElement.addEventListener('click', handleClick);
    return () => gl.domElement.removeEventListener('click', handleClick);
  }, [camera, gl, rooms, onFloorClick, raycaster]);

  return null;
}

// Export handler component
function ExportHandler({ scene }: { scene: THREE.Scene }) {
  useEffect(() => {
    const handleExport = () => {
      const exporter = new GLTFExporter();

      // Create a clone of the scene for export (remove helpers, grids, etc.)
      const exportScene = new THREE.Scene();

      // Copy children we want to export (rooms, furniture, etc.)
      scene.traverse((child) => {
        if (child.type === 'Mesh' || child.type === 'Group') {
          // Skip grid and helper objects
          if (child.userData.noExport) return;

          // Clone the object
          const cloned = child.clone();
          exportScene.add(cloned);
        }
      });

      exporter.parse(
        exportScene,
        (gltf) => {
          // Create and download the file
          const blob = new Blob([gltf as ArrayBuffer], { type: 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `floorplan-${Date.now()}.glb`;
          link.click();
          URL.revokeObjectURL(url);
        },
        (error) => {
          console.error('Error exporting GLB:', error);
        },
        { binary: true }
      );
    };

    window.addEventListener('export-glb', handleExport);
    return () => window.removeEventListener('export-glb', handleExport);
  }, [scene]);

  return null;
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[0, 2.5, 0]} intensity={0.3} />
    </>
  );
}

interface FloorPlan3DViewerProps {
  className?: string;
  floorPlanData?: FloorPlanData;
  furniture?: PlacedFurniturePiece[];
  selectedFurnitureItem?: FurnitureItem | null;
  selectedPieceId?: string | null;
  onFurniturePlace?: (position: [number, number, number]) => void;
  onFurnitureSelect?: (id: string) => void;
  onFurnitureUpdate?: (id: string, updates: Partial<PlacedFurniturePiece>) => void;
}

function Scene({
  floorPlanData,
  furniture = [],
  selectedFurnitureItem,
  selectedPieceId,
  onFurniturePlace,
  onFurnitureSelect,
  onFurnitureUpdate,
}: FloorPlan3DViewerProps) {
  const { scene } = useThree();
  const rooms = floorPlanData?.rooms || [];

  // Calculate bounding box for camera positioning
  const bounds = useMemo(() => {
    if (rooms.length === 0) return { maxX: 10, maxZ: 10 };
    let maxX = 0,
      maxZ = 0;
    rooms.forEach((room) => {
      maxX = Math.max(maxX, room.x + room.width);
      maxZ = Math.max(maxZ, room.y + room.height);
    });
    return { maxX, maxZ };
  }, [rooms]);

  const handleFloorClick = useCallback(
    (point: THREE.Vector3) => {
      if (selectedFurnitureItem && onFurniturePlace) {
        // Snap to grid (0.5m increments)
        const snapX = Math.round(point.x * 2) / 2;
        const snapZ = Math.round(point.z * 2) / 2;
        onFurniturePlace([snapX, 0, snapZ]);
      }
    },
    [selectedFurnitureItem, onFurniturePlace]
  );

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[bounds.maxX * 1.5, 8, bounds.maxZ * 1.5]}
        fov={50}
      />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2}
      />
      <Lights />

      {/* Export handler */}
      <ExportHandler scene={scene} />

      {/* Floor click handler */}
      <FloorClickHandler onFloorClick={handleFloorClick} rooms={rooms} />

      {/* Render rooms */}
      {rooms.map((room, index) => (
        <RoomMesh key={`room-${index}`} room={room} />
      ))}

      {/* Fallback demo room */}
      {rooms.length === 0 && (
        <RoomMesh
          room={{
            name: 'Demo Room',
            x: 0,
            y: 0,
            width: 5,
            height: 5,
            type: 'living',
          }}
        />
      )}

      {/* Render placed furniture */}
      {furniture.map((piece) => (
        <PlacedFurniture
          key={piece.id}
          piece={piece}
          isSelected={selectedPieceId === piece.id}
          onSelect={onFurnitureSelect || (() => {})}
          onUpdate={onFurnitureUpdate || (() => {})}
        />
      ))}

      {/* Placement preview */}
      {selectedFurnitureItem && (
        <group>
          <mesh position={[0, selectedFurnitureItem.dimensions.height / 2, 0]}>
            <boxGeometry
              args={[
                selectedFurnitureItem.dimensions.width,
                selectedFurnitureItem.dimensions.height,
                selectedFurnitureItem.dimensions.depth,
              ]}
            />
            <meshStandardMaterial color={selectedFurnitureItem.color} transparent opacity={0.5} />
          </mesh>
        </group>
      )}

      {/* Grid */}
      <Grid
        args={[30, 30]}
        position={[0, 0.01, 0]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#909090"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        userData={{ noExport: true }}
      />
      <Environment preset="apartment" />
    </>
  );
}

export default function FloorPlan3DViewer({
  className,
  floorPlanData,
  furniture,
  selectedFurnitureItem,
  selectedPieceId,
  onFurniturePlace,
  onFurnitureSelect,
  onFurnitureUpdate,
}: FloorPlan3DViewerProps) {
  return (
    <div className={className} style={{ width: '100%', height: '100%', minHeight: '400px' }}>
      <Canvas shadows>
        <Scene
          floorPlanData={floorPlanData}
          furniture={furniture}
          selectedFurnitureItem={selectedFurnitureItem}
          selectedPieceId={selectedPieceId}
          onFurniturePlace={onFurniturePlace}
          onFurnitureSelect={onFurnitureSelect}
          onFurnitureUpdate={onFurnitureUpdate}
        />
      </Canvas>
    </div>
  );
}

// Export types
export type { PlacedFurniturePiece, FloorPlanData };
