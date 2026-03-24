'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Environment } from '@react-three/drei';

// Simple room geometry for demo
function Room() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>

      {/* Walls */}
      {/* Back wall */}
      <mesh position={[0, 1.5, -5]} castShadow receiveShadow>
        <boxGeometry args={[10, 3, 0.2]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>

      {/* Left wall */}
      <mesh position={[-5, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[10, 3, 0.2]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>

      {/* Right wall (partial - for door) */}
      <mesh position={[5, 1.5, -3]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 3, 0.2]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>

      {/* Front wall (partial - for door) */}
      <mesh position={[0, 1.5, 5]} castShadow receiveShadow>
        <boxGeometry args={[10, 3, 0.2]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
    </group>
  );
}

// Furniture placeholders
function Furniture() {
  return (
    <group>
      {/* Table */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.5, 0.1, 0.8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[-0.6, 0.2, 0]} castShadow>
        <boxGeometry args={[0.1, 0.4, 0.8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0.6, 0.2, 0]} castShadow>
        <boxGeometry args={[0.1, 0.4, 0.8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Chair 1 */}
      <group position={[-2, 0, 0]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.5, 0.05, 0.5]} />
          <meshStandardMaterial color="#4169E1" />
        </mesh>
        <mesh position={[0, 0.5, -0.2]} castShadow>
          <boxGeometry args={[0.5, 0.5, 0.1]} />
          <meshStandardMaterial color="#4169E1" />
        </mesh>
      </group>

      {/* Chair 2 */}
      <group position={[2, 0, 0]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.5, 0.05, 0.5]} />
          <meshStandardMaterial color="#4169E1" />
        </mesh>
        <mesh position={[0, 0.5, -0.2]} castShadow>
          <boxGeometry args={[0.5, 0.5, 0.1]} />
          <meshStandardMaterial color="#4169E1" />
        </mesh>
      </group>
    </group>
  );
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
}

export default function FloorPlan3DViewer({ className }: FloorPlan3DViewerProps) {
  return (
    <div className={className} style={{ width: '100%', height: '100%', minHeight: '400px' }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[8, 8, 8]} fov={50} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2}
        />

        <Lights />
        <Room />
        <Furniture />

        {/* Grid for reference */}
        <Grid
          args={[20, 20]}
          position={[0, 0.01, 0]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#909090"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
        />

        <Environment preset="apartment" />
      </Canvas>
    </div>
  );
}
