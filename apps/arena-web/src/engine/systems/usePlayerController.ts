import { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RapierRigidBody } from '@react-three/rapier';
import type { Room } from '@colyseus/sdk';
import { PLAYER_SPEED, WORLD_HALF_SIZE } from '@average.dev/arena-shared';
import {
  JUMP_IMPULSE,
  GROUNDED_THRESHOLD,
} from '../constants';
import type { CameraHookResult } from './cameras/types';
import { touchInput } from '../../components/mobile-controls/MobileControls';

/** Input state tracked by the player controller. */
interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

export interface PlayerControllerConfig {
  rigidBody: React.RefObject<RapierRigidBody | null>;
  cameraTarget: React.RefObject<THREE.Group | null>;
  model: React.RefObject<THREE.Group | null>;
  camera: CameraHookResult;
  /** Colyseus room — used to send input to the server. */
  room: Room | null;
}

/**
 * Custom hook that manages WASD/arrow key input, touch joystick input,
 * and jumping, applying forces to a Rapier RigidBody.
 */
export function usePlayerController({
  rigidBody,
  cameraTarget,
  model,
  camera,
  room,
}: PlayerControllerConfig): void {
  const input = useRef<InputState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });
  const jumpPressed = useRef(false);
  const lastPositionSend = useRef(0);
  // Pre-allocate reusable vectors
  const _moveDir = useRef(new THREE.Vector3());
  const _targetPos = useRef(new THREE.Vector3());

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    input.current.forward = true; break;
      case 'KeyS': case 'ArrowDown':  input.current.backward = true; break;
      case 'KeyA': case 'ArrowLeft':  input.current.left = true; break;
      case 'KeyD': case 'ArrowRight': input.current.right = true; break;
      case 'Space':                   jumpPressed.current = true; break;
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    input.current.forward = false; break;
      case 'KeyS': case 'ArrowDown':  input.current.backward = false; break;
      case 'KeyA': case 'ArrowLeft':  input.current.left = false; break;
      case 'KeyD': case 'ArrowRight': input.current.right = false; break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useFrame((_, delta) => {
    const rb = rigidBody.current;
    const ct = cameraTarget.current;
    if (!rb) return;

    // ── Sync camera target with rigid body translation (smoothed)
    const translation = rb.translation();
    if (ct) {
      const smoothFactor = 1 - Math.pow(0.0001, delta);
      ct.position.lerp(
        _targetPos.current.set(translation.x, translation.y, translation.z),
        smoothFactor
      );
    }

    // ── Read current velocity from physics engine
    const linvel = rb.linvel();
    const isGrounded = Math.abs(linvel.y) < GROUNDED_THRESHOLD;

    // ── Merge keyboard + touch input
    const { forward, backward, left, right } = input.current;

    let moveX = (left ? -1 : 0) + (right ? 1 : 0);
    let moveZ = (forward ? -1 : 0) + (backward ? 1 : 0);

    if (Math.abs(touchInput.moveX) > 0.1 || Math.abs(touchInput.moveZ) > 0.1) {
      moveX = touchInput.moveX;
      moveZ = touchInput.moveZ;
    }

    let desiredVelX = 0;
    let desiredVelZ = 0;

    if (moveX !== 0 || moveZ !== 0) {
      const angle = camera.yaw.current;
      _moveDir.current.set(moveX, 0, moveZ).normalize();

      const rotatedX = _moveDir.current.x * Math.cos(angle) + _moveDir.current.z * Math.sin(angle);
      const rotatedZ = _moveDir.current.x * -Math.sin(angle) + _moveDir.current.z * Math.cos(angle);

      desiredVelX = rotatedX * PLAYER_SPEED;
      desiredVelZ = rotatedZ * PLAYER_SPEED;

      // Rotate visual model to face movement direction (delta-time smoothed)
      if (model.current) {
        const targetAngle = Math.atan2(rotatedX, rotatedZ);
        const currentAngle = model.current.rotation.y;
        let angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        const rotSmooth = 1 - Math.pow(0.001, delta);
        model.current.rotation.y += angleDiff * rotSmooth;
      }
    }

    // ── Jump (keyboard Space or touch button)
    let newVelY = linvel.y;
    const wantsJump = jumpPressed.current || touchInput.jump;
    if (wantsJump && isGrounded) {
      newVelY = JUMP_IMPULSE;
      jumpPressed.current = false;
      touchInput.jump = false;
    } else {
      jumpPressed.current = false;
      touchInput.jump = false;
    }

    // ── Apply velocity to rigid body
    rb.setLinvel({ x: desiredVelX, y: newVelY, z: desiredVelZ }, true);

    // ── Send actual 3D position to server (throttled by network tick rate)
    if (room) {
      const now = Date.now();
      if (now - lastPositionSend.current >= 50) { // 20Hz
        room.send('position', {
          x: translation.x,
          y: translation.y,
          z: translation.z,
          rotationY: model.current?.rotation.y ?? 0,
        });
        lastPositionSend.current = now;
      }
    }

    // ── World bounds clamp
    const worldHalfSize = ((room?.state as { worldSize?: number })?.worldSize ?? WORLD_HALF_SIZE * 2) / 2;
    if (
      Math.abs(translation.x) > worldHalfSize ||
      Math.abs(translation.z) > worldHalfSize
    ) {
      const clampedX = Math.max(-worldHalfSize, Math.min(worldHalfSize, translation.x));
      const clampedZ = Math.max(-worldHalfSize, Math.min(worldHalfSize, translation.z));
      rb.setTranslation({ x: clampedX, y: translation.y, z: clampedZ }, true);
    }

    // ── Respawn if fallen off map
    if (translation.y < -50) {
      rb.setTranslation({ x: 0, y: 10, z: 0 }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  });
}
