'use client'

import {
  CeilingSystem,
  DoorSystem,
  ItemSystem,
  RoofSystem,
  SlabSystem,
  WallSystem,
  WindowSystem,
} from '@pascal-app/core'
import { Bvh } from '@react-three/drei'
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three/webgpu'
import useViewer from '../../store/use-viewer'
import { ExportSystem } from '../../systems/export/export-system'
import { GuideSystem } from '../../systems/guide/guide-system'
import { ItemLightSystem } from '../../systems/item-light/item-light-system'
import { LevelSystem } from '../../systems/level/level-system'
import { ScanSystem } from '../../systems/scan/scan-system'
import { WallCutout } from '../../systems/wall/wall-cutout'
import { ZoneSystem } from '../../systems/zone/zone-system'
import { SceneRenderer } from '../renderers/scene-renderer'
import { Lights } from './lights'
import { PerfMonitor } from './perf-monitor'
import PostProcessing from './post-processing'
import { SelectionManager } from './selection-manager'
import { ViewerCamera } from './viewer-camera'

extend(THREE as any)

/**
 * Monitors the WebGPU device for loss events and logs them.
 * WebGPU device loss can happen when:
 * - Tab is backgrounded and OS reclaims GPU
 * - Driver crash or GPU reset
 * - Browser security policy kills the context
 */
function GPUDeviceWatcher() {
  const gl = useThree((s) => s.gl)

  useEffect(() => {
    const backend = (gl as any).backend
    const device: GPUDevice | undefined = backend?.device
    if (!device) return

    device.lost.then((info) => {
      console.error(
        `[viewer] WebGPU device lost: reason="${info.reason}", message="${info.message}". ` +
          'The page must be reloaded to recover the GPU context.',
      )
    })
  }, [gl])

  return null
}

interface ViewerProps {
  children?: React.ReactNode
  selectionManager?: 'default' | 'custom'
  perf?: boolean
}

const Viewer: React.FC<ViewerProps> = ({
  children,
  selectionManager = 'default',
  perf = false,
}) => {
  const theme = useViewer((state) => state.theme)

  return (
    <Canvas
      shadows
      gl={{ antialias: false }}
      style={{ background: theme === 'dark' ? '#1f2433' : '#ffffff' }}
    >
      <Bvh enabled />
      <Lights />
      <ViewerCamera />
      {selectionManager === 'default' && <SelectionManager />}
      <SceneRenderer />
      <WallCutout />
      <WallSystem />
      <DoorSystem />
      <WindowSystem />
      <ItemSystem />
      <SlabSystem />
      <CeilingSystem />
      <RoofSystem />
      <LevelSystem />
      <ZoneSystem />
      <GuideSystem />
      <ItemLightSystem />
      <ExportSystem />
      <ScanSystem />
      <GPUDeviceWatcher />
      <PostProcessing />
      {perf && <PerfMonitor />}
      {children}
    </Canvas>
  )
}

export { Viewer }
