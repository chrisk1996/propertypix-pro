'use client';

import { useRef, useState, Suspense } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import type { FurnitureItem } from './FurnitureLibrary';

export interface PlacedFurniturePiece {
  id: string;
  furniture: FurnitureItem;
  position: [number, number, number];
  rotation: number; // in radians
  scale: number;
}

interface PlacedFurnitureProps {
  piece: PlacedFurniturePiece;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<PlacedFurniturePiece>) => void;
}

// GLTF Model Component
function GLTFModel({ path, scale }: { path: string; scale: number }) {
  try {
    const { scene } = useGLTF(path);
    const clonedScene = scene.clone();
    
    // Apply scale - Kenney models are ~2m, scale down
    clonedScene.scale.setScalar(scale * 0.5);
    clonedScene.position.set(0, 0, 0);
    
    return <primitive object={clonedScene} />;
  } catch (e) {
    console.error('Error loading GLTF model:', path, e);
    return null;
  }
}

// Fallback box geometry when GLTF fails or not available
function FallbackBox({ piece }: { piece: PlacedFurniturePiece }) {
  const { furniture, scale } = piece;
  const { width, height, depth } = furniture.dimensions;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const scaledDepth = depth * scale;

  // Special rendering for certain furniture types
  switch (furniture.id) {
    case 'sofa':
      return (
        <group>
          <mesh position={[0, scaledHeight * 0.35, 0]} castShadow>
            <boxGeometry args={[scaledWidth, scaledHeight * 0.7, scaledDepth]} />
            <meshStandardMaterial color={furniture.color} />
          </mesh>
          <mesh position={[0, scaledHeight * 0.7, -scaledDepth * 0.35]} castShadow>
            <boxGeometry args={[scaledWidth, scaledHeight * 0.6, scaledDepth * 0.3]} />
            <meshStandardMaterial color={furniture.color} />
          </mesh>
        </group>
      );
    case 'bed':
      return (
        <group>
          <mesh position={[0, scaledHeight * 0.25, 0]} castShadow>
            <boxGeometry args={[scaledWidth, scaledHeight * 0.5, scaledDepth]} />
            <meshStandardMaterial color={furniture.color} />
          </mesh>
          <mesh position={[0, scaledHeight * 0.7, -scaledDepth * 0.45]} castShadow>
            <boxGeometry args={[scaledWidth, scaledHeight * 0.9, scaledDepth * 0.1]} />
            <meshStandardMaterial color="#5c6bc0" />
          </mesh>
          <mesh position={[0, scaledHeight * 0.35, -scaledDepth * 0.3]} castShadow>
            <boxGeometry args={[scaledWidth * 0.8, scaledHeight * 0.15, scaledDepth * 0.25]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
        </group>
      );
    default:
      return (
        <mesh position={[0, scaledHeight * 0.5, 0]} castShadow>
          <boxGeometry args={[scaledWidth, scaledHeight, scaledDepth]} />
          <meshStandardMaterial color={furniture.color} />
        </mesh>
      );
  }
}

// Furniture renderer - uses GLTF if available, falls back to geometry
function FurnitureMesh({ piece }: { piece: PlacedFurniturePiece }) {
  const { furniture, scale } = piece;
  const { width, height, depth } = furniture.dimensions;
  const scaledHeight = height * scale;

  if (furniture.useGLTF && furniture.modelPath) {
    return (
      <Suspense fallback={
        <mesh position={[0, scaledHeight * 0.5, 0]} castShadow>
          <boxGeometry args={[width * scale, scaledHeight, depth * scale]} />
          <meshStandardMaterial color={furniture.color} transparent opacity={0.5} />
        </mesh>
      }>
        <GLTFModel path={furniture.modelPath} scale={scale} />
      </Suspense>
    );
  }

  return <FallbackBox piece={piece} />;
}

export default function PlacedFurniture({
  piece,
  isSelected,
  onSelect,
}: PlacedFurnitureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { furniture, position, rotation } = piece;
  const scaledHeight = furniture.dimensions.height * piece.scale;
  const w = furniture.dimensions.width * piece.scale;
  const h = furniture.dimensions.height * piece.scale;
  const d = furniture.dimensions.depth * piece.scale;

  return (
    <group
      ref={groupRef}
      position={[position[0], 0, position[2]]}
      rotation={[0, rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(piece.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setIsHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setIsHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      <FurnitureMesh piece={piece} />

      {/* Selection outline - MORE VISIBLE */}
      {isSelected && (
        <group position={[0, h * 0.5, 0]}>
          {/* Outer glow */}
          <mesh>
            <boxGeometry args={[w + 0.2, h + 0.2, d + 0.2]} />
            <meshBasicMaterial color="#4f46e5" transparent opacity={0.15} />
          </mesh>
          {/* Wireframe box */}
          <mesh>
            <boxGeometry args={[w + 0.1, h + 0.1, d + 0.1]} />
            <meshBasicMaterial color="#818cf8" wireframe />
          </mesh>
          {/* Corner spheres for visibility */}
          {[[-1,-1], [1,-1], [-1,1], [1,1]].map(([x, z], i) => (
            <mesh key={i} position={[x * (w/2 + 0.1), 0, z * (d/2 + 0.1)]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshBasicMaterial color="#22c55e" />
            </mesh>
          ))}
        </group>
      )}

      {/* Hover effect */}
      {isHovered && !isSelected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.05, h + 0.05, d + 0.05]} />
          <meshBasicMaterial color="#ffffff" wireframe opacity={0.7} transparent />
        </mesh>
      )}
    </group>
  );
}

// Preload all furniture models
const MODEL_PATHS = [
  '/models/furniture/loungeSofa.glb',
  '/models/furniture/tableCoffee.glb',
  '/models/furniture/cabinetTelevision.glb',
  '/models/furniture/loungeChair.glb',
  '/models/furniture/bedDouble.glb',
  '/models/furniture/sideTable.glb',
  '/models/furniture/bookcaseClosed.glb',
  '/models/furniture/cabinetBedDrawer.glb',
  '/models/furniture/table.glb',
  '/models/furniture/chairCushion.glb',
  '/models/furniture/kitchenBar.glb',
  '/models/furniture/kitchenFridge.glb',
  '/models/furniture/toilet.glb',
  '/models/furniture/bathroomSink.glb',
  '/models/furniture/bathtub.glb',
  '/models/furniture/shower.glb',
  '/models/furniture/desk.glb',
  '/models/furniture/chairDesk.glb',
  '/models/furniture/bookcaseOpen.glb',
];

// Preload models for faster rendering
MODEL_PATHS.forEach(path => {
  try {
    useGLTF.preload(path);
  } catch (e) {
    // Ignore preload errors - model may not exist yet
  }
});
