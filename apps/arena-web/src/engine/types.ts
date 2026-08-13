import type * as THREE from 'three';

/** 3D position and rotation for entities in the game world. */
export interface Transform {
  position: THREE.Vector3Tuple;
  rotation: THREE.Vector3Tuple;
}

/** Player state managed by the player controller. */
export interface PlayerState {
  position: THREE.Vector3Tuple;
  rotation: number; // Y-axis rotation in radians
  velocity: THREE.Vector3Tuple;
  isMoving: boolean;
}

/** Input state tracked by the player controller. */
export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}
