'use client';

import { useCallback } from 'react';
import * as THREE from 'three';
import { Camera, Maximize2, RotateCcw, Eye, Lightbulb, Sun } from 'lucide-react';

interface CameraPreset {
  name: string;
  position: [number, number, number];
  target: [number, number, number];
}

export const CAMERA_PRESETS: Record<string, CameraPreset> = {
  perspective: {
    name: 'Perspective',
    position: [8, 8, 8],
    target: [0, 0, 0],
  },
  top: {
    name: 'Top',
    position: [0, 15, 0],
    target: [0, 0, 0],
  },
  front: {
    name: 'Front',
    position: [0, 5, 12],
    target: [0, 0, 0],
  },
  side: {
    name: 'Side',
    position: [12, 5, 0],
    target: [0, 0, 0],
  },
  walkthrough: {
    name: 'Walkthrough',
    position: [0, 1.7, 0],
    target: [3, 1.7, 0],
  },
};

interface CameraControlsProps {
  currentPreset?: string;
  onPresetChange: (preset: keyof typeof CAMERA_PRESETS) => void;
  onReset: () => void;
  onToggleLighting?: () => void;
  lightingMode?: 'day' | 'night';
  onToggleFirstPerson?: () => void;
  isFirstPerson?: boolean;
}

export default function CameraControls({
  currentPreset = 'perspective',
  onPresetChange,
  onReset,
  onToggleLighting,
  lightingMode = 'day',
  onToggleFirstPerson,
  isFirstPerson = false,
}: CameraControlsProps) {
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-gray-800 rounded-lg">
      {/* Camera Presets */}
      <div className="flex gap-1">
        {Object.entries(CAMERA_PRESETS).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => onPresetChange(key as keyof typeof CAMERA_PRESETS)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              currentPreset === key
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={preset.name}
          >
            {key === 'top' && <Maximize2 className="w-3.5 h-3.5" />}
            {key === 'walkthrough' && <Eye className="w-3.5 h-3.5" />}
            {key === 'perspective' && <Camera className="w-3.5 h-3.5" />}
            {key !== 'top' && key !== 'walkthrough' && key !== 'perspective' && (
              <Camera className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{preset.name}</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px bg-gray-600" />

      {/* Reset */}
      <button
        onClick={onReset}
        className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
        title="Reset Camera"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Reset</span>
      </button>

      {/* Lighting Toggle */}
      {onToggleLighting && (
        <button
          onClick={onToggleLighting}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            lightingMode === 'night'
              ? 'bg-indigo-900 text-indigo-200'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title={`Lighting: ${lightingMode}`}
        >
          {lightingMode === 'day' ? (
            <Sun className="w-3.5 h-3.5" />
          ) : (
            <Lightbulb className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">{lightingMode === 'day' ? 'Day' : 'Night'}</span>
        </button>
      )}

      {/* First Person Toggle */}
      {onToggleFirstPerson && (
        <button
          onClick={onToggleFirstPerson}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            isFirstPerson
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title={isFirstPerson ? 'Exit First Person' : 'Enter First Person'}
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isFirstPerson ? 'Exit FP' : 'First Person'}</span>
        </button>
      )}
    </div>
  );
}

// Hook for camera state management
export function useCameraState() {
  const applyPreset = useCallback(
    (preset: keyof typeof CAMERA_PRESETS, cameraRef: React.RefObject<THREE.Camera> | null) => {
      if (!cameraRef?.current) return;
      
      const { position, target } = CAMERA_PRESETS[preset];
      const camera = cameraRef.current;
      
      // Animate to new position
      const startPos = camera.position.clone();
      const endPos = new THREE.Vector3(...position);
      const duration = 1000;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const easeT = 1 - Math.pow(1 - t, 3); // ease out cubic
        
        camera.position.lerpVectors(startPos, endPos, easeT);
        camera.lookAt(...target);
        
        if (t < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    },
    []
  );

  return { applyPreset, CAMERA_PRESETS };
}
