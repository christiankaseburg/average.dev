import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CameraHookResult } from './types';
import { touchInput } from '../../../components/mobile-controls/MobileControls';

/** Isometric camera configuration. */
export interface IsometricCameraConfig {
  /** Distance from the target along the look direction. */
  distance: number;
  /** Height above the target. */
  height: number;
  /** Vertical look-at offset above the target origin. */
  lookAtHeight: number;
  /** Interpolation factor (0–1). Higher = snappier. */
  lerpFactor: number;
  /** Initial yaw angle in radians (default: Math.PI / 4 = 45°). */
  initialYaw: number;
  /** Rotation step in radians when Q/E is pressed (default: Math.PI / 4 = 45°). */
  rotationStep: number;
  /** Mouse rotation sensitivity when right-dragging. */
  mouseSensitivity: number;
  /** Allow scroll-wheel zoom. Min/max multiplied against distance. */
  zoomMin: number;
  zoomMax: number;
  zoomSpeed: number;
}

export const DEFAULT_ISOMETRIC_CONFIG: IsometricCameraConfig = {
  distance: 6,
  height: 5,
  lookAtHeight: 0.5,
  lerpFactor: 0.1,
  initialYaw: Math.PI / 4,
  rotationStep: Math.PI / 4,
  mouseSensitivity: 0.005,
  zoomMin: 3,
  zoomMax: 20,
  zoomSpeed: 1.5,
};

/**
 * Isometric top-down camera that follows a target group.
 *
 * Controls:
 * - Q / E keys rotate the view in 45° steps
 * - Right-click drag rotates smoothly
 * - Scroll wheel zooms in/out
 * - Smooth interpolation to desired position
 * - Cursor stays free (no pointer lock) for future UI interaction
 */
export function useIsometricCamera(
  targetRef: React.RefObject<THREE.Group | null>,
  config: IsometricCameraConfig = DEFAULT_ISOMETRIC_CONFIG
): CameraHookResult {
  const { camera, gl } = useThree();
  const yaw = useRef(config.initialYaw);
  const targetYaw = useRef(config.initialYaw);
  const rotating = useRef(false);
  const isDragging = useRef(false);
  const currentDistance = useRef(config.distance);

  // Pre-allocate reusable vectors to avoid GC pressure from per-frame allocations
  const _desiredPos = useRef(new THREE.Vector3());
  const _lookTarget = useRef(new THREE.Vector3());

  // ── Q / E discrete rotation ────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (rotating.current) return;
      if (e.code === 'KeyQ') {
        rotating.current = true;
        targetYaw.current += config.rotationStep;
      } else if (e.code === 'KeyE') {
        rotating.current = true;
        targetYaw.current -= config.rotationStep;
      }
    },
    [config.rotationStep]
  );

  // ── Right-click drag for smooth rotation ───────────────────────────
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 2) {
      isDragging.current = true;
      e.preventDefault();
    }
  }, []);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (e.button === 2) isDragging.current = false;
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;
      targetYaw.current -= e.movementX * config.mouseSensitivity;
    },
    [config.mouseSensitivity]
  );

  // Prevent context menu on right-click so drag works
  const handleContextMenu = useCallback((e: Event) => {
    e.preventDefault();
  }, []);

  // ── Scroll-wheel zoom ──────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? 1 : -1;
      currentDistance.current = Math.max(
        config.zoomMin,
        Math.min(config.zoomMax, currentDistance.current + direction * config.zoomSpeed)
      );
    },
    [config.zoomMin, config.zoomMax, config.zoomSpeed]
  );

  useEffect(() => {
    const canvas = gl.domElement;
    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleKeyDown, handleMouseDown, handleMouseUp, handleMouseMove, handleContextMenu, handleWheel, gl.domElement]);

  useFrame((_, delta) => {
    if (!targetRef.current) return;

    // Frame-rate independent smoothing factor
    const smoothFactor = 1 - Math.pow(1 - config.lerpFactor, delta * 60);

    // Smooth yaw rotation toward target (handles both Q/E and mouse drag)
    const yawDiff = targetYaw.current - yaw.current;
    if (Math.abs(yawDiff) > 0.001) {
      yaw.current += yawDiff * smoothFactor;
    } else {
      yaw.current = targetYaw.current;
      rotating.current = false;
    }

    const targetPos = targetRef.current.position;

    // Consume pinch-to-zoom delta (same direction as scroll wheel)
    if (Math.abs(touchInput.zoomDelta) > 0.001) {
      currentDistance.current = Math.max(
        config.zoomMin,
        Math.min(config.zoomMax, currentDistance.current + touchInput.zoomDelta)
      );
      touchInput.zoomDelta = 0;
    }

    const dist = currentDistance.current;
    // Scale height proportionally to distance
    const heightRatio = config.height / config.distance;

    // Calculate camera position using isometric offset (reuse vector)
    _desiredPos.current.set(
      targetPos.x + dist * Math.sin(yaw.current),
      targetPos.y + dist * heightRatio,
      targetPos.z + dist * Math.cos(yaw.current)
    );

    // Smooth interpolation using delta-time-corrected factor
    camera.position.lerp(_desiredPos.current, smoothFactor);

    // Look at player (reuse vector)
    _lookTarget.current.set(
      targetPos.x,
      targetPos.y + config.lookAtHeight,
      targetPos.z
    );
    camera.lookAt(_lookTarget.current);
  });

  return { yaw };
}
