'use client'

import { type CameraControlEvent, emitter, sceneRegistry, useScene } from '@pascal-app/core'
import { useViewer, ZONE_LAYER } from '@pascal-app/viewer'
import { CameraControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Box3, Vector3 } from 'three'
import { EDITOR_LAYER } from '../../lib/constants'
import useEditor from '../../store/use-editor'

const currentTarget = new Vector3()
const tempBox = new Box3()
const tempCenter = new Vector3()
const tempDelta = new Vector3()
const tempPosition = new Vector3()
const tempSize = new Vector3()
const tempTarget = new Vector3()

const DEFAULT_MAX_POLAR_ANGLE = Math.PI / 2 - 0.1
const DEBUG_MAX_POLAR_ANGLE = Math.PI - 0.05

// ACTION constants from camera-controls
const ACTION = {
  NONE: 0,
  ROTATE: 1,
  TRUCK: 2,
  DOLLY: 3,
  ZOOM: 4,
} as const

export const CustomCameraControls = () => {
  const controls = useRef<any>(null!)
  const isPreviewMode = useEditor((s) => s.isPreviewMode)
  const isFirstPersonMode = useEditor((s) => s.isFirstPersonMode)
  const maxPolarAngle = DEFAULT_MAX_POLAR_ANGLE

  const scene = useScene()
  const { invalidate } = useThree()

  // Focus on selected node - disabled for now
  // useEffect(() => {
  //   if (!isPreviewMode) return
  //   if (isFirstPersonMode) return
  //   if (!controls.current) return
  //   // Focus logic would go here
  // }, [scene])

  const onRest = useCallback(() => {
    if (!controls.current) return
    controls.current.getTarget(currentTarget)
    emitter.emit('camera:rest' as any, { target: currentTarget.clone() })
  }, [])

  const onTransitionStart = useCallback(() => {
    emitter.emit('camera:transition-start' as any)
  }, [])

  // Configure mouse buttons based on control mode and camera mode
  const cameraMode = useViewer((state) => state.cameraMode)
  const mouseButtons = useMemo(() => {
    const wheelAction = cameraMode === 'orthographic' ? ACTION.ZOOM : ACTION.DOLLY
    return {
      left: isPreviewMode ? ACTION.TRUCK : ACTION.NONE,
      middle: ACTION.TRUCK,
      right: ACTION.ROTATE,
      wheel: wheelAction,
    } as any
  }, [cameraMode, isPreviewMode])

  useEffect(() => {
    if (isFirstPersonMode) return

    const keyState = {
      shiftRight: false,
      shiftLeft: false,
      controlRight: false,
      controlLeft: false,
      space: false,
    }

    const updateConfig = () => {
      if (!controls.current) return

      const shift = keyState.shiftRight || keyState.shiftLeft
      const control = keyState.controlRight || keyState.controlLeft
      const space = keyState.space

      const wheelAction = cameraMode === 'orthographic' ? ACTION.ZOOM : ACTION.DOLLY
      controls.current.mouseButtons.wheel = wheelAction
      controls.current.mouseButtons.middle = ACTION.TRUCK
      controls.current.mouseButtons.right = ACTION.ROTATE

      if (isPreviewMode) {
        controls.current.mouseButtons.left = ACTION.TRUCK
      } else if (space) {
        controls.current.mouseButtons.left = ACTION.TRUCK
      } else {
        controls.current.mouseButtons.left = ACTION.NONE
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        keyState.space = true
        document.body.style.cursor = 'grab'
      }
      if (event.code === 'ShiftRight') keyState.shiftRight = true
      if (event.code === 'ShiftLeft') keyState.shiftLeft = true
      if (event.code === 'ControlRight') keyState.controlRight = true
      if (event.code === 'ControlLeft') keyState.controlLeft = true
      updateConfig()
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        keyState.space = false
        document.body.style.cursor = ''
      }
      if (event.code === 'ShiftRight') keyState.shiftRight = false
      if (event.code === 'ShiftLeft') keyState.shiftLeft = false
      if (event.code === 'ControlRight') keyState.controlRight = false
      if (event.code === 'ControlLeft') keyState.controlLeft = false
      updateConfig()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    updateConfig()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [cameraMode, isPreviewMode, isFirstPersonMode])

  if (isFirstPersonMode) return null

  return (
    <CameraControls
      makeDefault
      maxDistance={100}
      maxPolarAngle={maxPolarAngle}
      minDistance={10}
      minPolarAngle={0}
      mouseButtons={mouseButtons}
      ref={controls}
      restThreshold={0.01}
    />
  )
}
