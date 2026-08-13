import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CameraHookResult } from './types';

/** Third-person camera configuration. */
export interface ThirdPersonCameraConfig {
  distance: number;
  height: number;
  lookAtHeight: number;
  lerpFactor: number;
  mouseSensitivity: number;
}

export const DEFAULT_THIRD_PERSON_CONFIG: ThirdPersonCameraConfig = {
  distance: 10,
  height: 6,
  lookAtHeight: 1.5,
  lerpFactor: 0.1,
  mouseSensitivity: 0.003,
};

/**
 * Third-person camera system that follows a target group.
 * Uses mouse movement (with pointer lock) to orbit horizontally and
 * clamp vertical angle. Smoothly interpolates to the desired position.
 */
export function useThirdPersonCamera(
  targetRef: React.RefObject<THREE.Group | null>,
  config: ThirdPersonCameraConfig = DEFAULT_THIRD_PERSON_CONFIG
): CameraHookResult {
  const { camera, gl } = useThree();
  const yaw = useRef(0);
  const pitch = useRef(0.3);
  const isLocked = useRef(false);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isLocked.current) return;
      yaw.current -= e.movementX * config.mouseSensitivity;
      pitch.current = Math.max(
        -0.5,
        Math.min(1.2, pitch.current - e.movementY * config.mouseSensitivity)
      );
    },
    [config.mouseSensitivity]
  );

  const handleClick = useCallback(() => {
    gl.domElement.requestPointerLock();
  }, [gl.domElement]);

  const handlePointerLockChange = useCallback(() => {
    isLocked.current = document.pointerLockElement === gl.domElement;
  }, [gl.domElement]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    gl.domElement.addEventListener('click', handleClick);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      gl.domElement.removeEventListener('click', handleClick);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [handleMouseMove, handleClick, handlePointerLockChange, gl.domElement]);

  useFrame(() => {
    if (!targetRef.current) return;

    const targetPos = targetRef.current.position;

    const horizontalDist = config.distance * Math.cos(pitch.current);
    const verticalDist = config.distance * Math.sin(pitch.current);

    const desiredX = targetPos.x + horizontalDist * Math.sin(yaw.current);
    const desiredY = targetPos.y + config.height + verticalDist;
    const desiredZ = targetPos.z + horizontalDist * Math.cos(yaw.current);

    camera.position.lerp(
      new THREE.Vector3(desiredX, desiredY, desiredZ),
      config.lerpFactor
    );

    const lookTarget = new THREE.Vector3(
      targetPos.x,
      targetPos.y + config.lookAtHeight,
      targetPos.z
    );
    camera.lookAt(lookTarget);
  });

  return { yaw };
}
