'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
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

// Furniture renderer based on type
function FurnitureMesh({ piece }: { piece: PlacedFurniturePiece }) {
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
          {/* Base */}
          <mesh position={[0, scaledHeight * 0.35, 0]} castShadow>
            <boxGeometry args={[scaledWidth, scaledHeight * 0.7, scaledDepth]} />
            <meshStandardMaterial color={furniture.color} />
          </mesh>
          {/* Back rest */}
          <mesh position={[0, scaledHeight * 0.7, -scaledDepth * 0.35]} castShadow>
            <boxGeometry args={[scaledWidth, scaledHeight * 0.6, scaledDepth * 0.3]} />
            <meshStandardMaterial color={furniture.color} />
          </mesh>
        </group>
      );
      
    case 'bed':
      return (
        <group>
          {/* Mattress */}
          <mesh position={[0, scaledHeight * 0.25, 0]} castShadow>
            <boxGeometry args={[scaledWidth, scaledHeight * 0.5, scaledDepth]} />
            <meshStandardMaterial color={furniture.color} />
          </mesh>
          {/* Headboard */}
          <mesh position={[0, scaledHeight * 0.7, -scaledDepth * 0.45]} castShadow>
            <boxGeometry args={[scaledWidth, scaledHeight * 0.9, scaledDepth * 0.1]} />
            <meshStandardMaterial color="#5c6bc0" />
          </mesh>
          {/* Pillow */}
          <mesh position={[0, scaledHeight * 0.35, -scaledDepth * 0.3]} castShadow>
            <boxGeometry args={[scaledWidth * 0.8, scaledHeight * 0.15, scaledDepth * 0.25]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
        </group>
      );
      
    case 'bathtub':
      return (
        <group>
          {/* Tub */}
          <mesh position={[0, scaledHeight * 0.3, 0]} castShadow>
            <boxGeometry args={[scaledWidth, scaledHeight * 0.6, scaledDepth]} />
            <meshStandardMaterial color={furniture.color} />
          </mesh>
          {/* Inner */}
          <mesh position={[0, scaledHeight * 0.35, 0]}>
            <boxGeometry args={[scaledWidth * 0.9, scaledHeight * 0.4, scaledDepth * 0.85]} />
            <meshStandardMaterial color="#e3f2fd" />
          </mesh>
        </group>
      );
      
    case 'bookshelf':
      return (
        <group>
          {/* Main frame */}
          <mesh position={[0, scaledHeight * 0.5, 0]} castShadow>
            <boxGeometry args={[scaledWidth, scaledHeight, scaledDepth]} />
            <meshStandardMaterial color={furniture.color} />
          </mesh>
          {/* Shelves */}
          {[0.25, 0.5, 0.75].map((yRatio, i) => (
            <mesh key={i} position={[0, scaledHeight * yRatio, 0]}>
              <boxGeometry args={[scaledWidth * 0.95, 0.02, scaledDepth * 0.9]} />
              <meshStandardMaterial color="#8d6e63" />
            </mesh>
          ))}
        </group>
      );
      
    case 'refrigerator':
      return (
        <group>
          {/* Main body */}
          <mesh position={[0, scaledHeight * 0.5, 0]} castShadow>
            <boxGeometry args={[scaledWidth, scaledHeight, scaledDepth]} />
            <meshStandardMaterial color={furniture.color} />
          </mesh>
          {/* Door line */}
          <mesh position={[0, scaledHeight * 0.35, scaledDepth * 0.51]}>
            <boxGeometry args={[scaledWidth * 0.98, scaledHeight * 0.65, 0.01]} />
            <meshStandardMaterial color="#90a4ae" />
          </mesh>
          {/* Handle */}
          <mesh position={[scaledWidth * 0.4, scaledHeight * 0.45, scaledDepth * 0.52]}>
            <boxGeometry args={[0.02, scaledHeight * 0.2, 0.02]} />
            <meshStandardMaterial color="#37474f" />
          </mesh>
        </group>
      );
      
    case 'chair':
    case 'office-chair':
      return (
        <group>
          {/* Seat */}
          <mesh position={[0, scaledHeight * 0.45, 0]} castShadow>
            <boxGeometry args={[scaledWidth, scaledHeight * 0.1, scaledDepth]} />
            <meshStandardMaterial color={furniture.color} />
          </mesh>
          {/* Back */}
          <mesh position={[0, scaledHeight * 0.75, -scaledDepth * 0.4]} castShadow>
            <boxGeometry args={[scaledWidth, scaledHeight * 0.5, scaledDepth * 0.1]} />
            <meshStandardMaterial color={furniture.color} />
          </mesh>
          {/* Legs */}
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
            <mesh key={i} position={[x * scaledWidth * 0.35, scaledHeight * 0.2, z * scaledDepth * 0.35]}>
              <cylinderGeometry args={[0.02, 0.02, scaledHeight * 0.4]} />
              <meshStandardMaterial color="#37474f" />
            </mesh>
          ))}
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

export default function PlacedFurniture({ piece, isSelected, onSelect, onUpdate }: PlacedFurnitureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const { furniture, position, rotation } = piece;
  const scaledHeight = furniture.dimensions.height * piece.scale;
  
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
      
      {/* Selection outline */}
      {isSelected && (
        <group position={[0, scaledHeight * 0.5, 0]}>
          <mesh>
            <boxGeometry args={[
              furniture.dimensions.width * piece.scale + 0.05,
              furniture.dimensions.height * piece.scale + 0.05,
              furniture.dimensions.depth * piece.scale + 0.05
            ]} />
            <meshBasicMaterial color="#4f46e5" wireframe />
          </mesh>
          {/* Rotation indicator */}
          <mesh position={[furniture.dimensions.width * piece.scale * 0.6, 0, 0]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
        </group>
      )}
      
      {/* Hover effect */}
      {isHovered && !isSelected && (
        <mesh position={[0, scaledHeight * 0.5, 0]}>
          <boxGeometry args={[
            furniture.dimensions.width * piece.scale + 0.02,
            furniture.dimensions.height * piece.scale + 0.02,
            furniture.dimensions.depth * piece.scale + 0.02
          ]} />
          <meshBasicMaterial color="#ffffff" wireframe opacity={0.5} transparent />
        </mesh>
      )}
    </group>
  );
}
