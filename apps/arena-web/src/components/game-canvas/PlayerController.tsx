import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { usePlayerController } from '../../engine/systems/usePlayerController';
import { useIsometricCamera } from '../../engine/systems/cameras/useIsometricCamera';
import { useThirdPersonCamera } from '../../engine/systems/cameras/useThirdPersonCamera';
import { PlayerModel } from '../../engine/entities/PlayerModel';
import { getMap } from '../../engine/world/maps';
import { useGame } from '../../context/GameContext';
import {
  PLAYER_SCALE,
  COLLIDER_RADIUS,
  COLLIDER_HALF_HEIGHT,
} from '../../engine/constants';
import type { CameraMode } from '../../engine/systems/cameras/types';
import { useItems } from '../../context/ItemContext';
import { useItemInteraction } from '../../engine/systems/useItemInteraction';

interface PlayerControllerProps {
  /** Which camera mode to use. Defaults to 'isometric'. */
  cameraMode?: CameraMode;
}

/**
 * PlayerController — R3F component composing the player model
 * with the movement, camera, and physics systems.
 * Reads the map's spawnHeight for initial player position.
 */
export function PlayerController({ cameraMode = 'isometric' }: PlayerControllerProps) {
  return <CameraSwitch mode={cameraMode} />;
}

function CameraSwitch({ mode }: { mode: CameraMode }) {
  if (mode === 'third-person') {
    return <ThirdPersonPlayer />;
  }
  return <IsometricPlayer />;
}

/**
 * Shared player body that both camera modes render.
 */
function PlayerBody({
  rigidBodyRef,
  modelRef,
}: {
  rigidBodyRef: React.RefObject<RapierRigidBody | null>;
  modelRef: React.RefObject<THREE.Group | null>;
}) {
  const { state } = useGame();
  const { state: itemState } = useItems();
  const mapConfig = useMemo(() => getMap(state.mapId), [state.mapId]);

  // Read cosmetic preferences — saved to localStorage during customization
  const tone = useMemo(() => localStorage.getItem('arena_bodyType') || '#ffccaa', []);
  const hairStyle = useMemo(() => localStorage.getItem('arena_hairStyle') || 'bald', []);

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      lockRotations
      colliders={false}
      position={[0, mapConfig.spawnHeight, 0]}
    >
      <CapsuleCollider args={[COLLIDER_HALF_HEIGHT, COLLIDER_RADIUS]} />
      <group ref={modelRef}>
        <group scale={[PLAYER_SCALE, PLAYER_SCALE, PLAYER_SCALE]}>
          <PlayerModel
            equipment={itemState.equippedItems}
            tone={tone}
            hairStyle={hairStyle}
          />
        </group>
      </group>
    </RigidBody>
  );
}

function IsometricPlayer() {
  const rigidBodyRef = React.useRef<RapierRigidBody>(null);
  const cameraTargetRef = React.useRef<THREE.Group>(null);
  const modelRef = React.useRef<THREE.Group>(null);
  const { state } = useGame();

  const cameraResult = useIsometricCamera(cameraTargetRef);

  usePlayerController({
    rigidBody: rigidBodyRef,
    cameraTarget: cameraTargetRef,
    model: modelRef,
    camera: cameraResult,
    room: state.room,
  });

  useItemInteraction({ rigidBody: rigidBodyRef, room: state.room });

  return (
    <>
      <group ref={cameraTargetRef} />
      <PlayerBody rigidBodyRef={rigidBodyRef} modelRef={modelRef} />
    </>
  );
}

function ThirdPersonPlayer() {
  const rigidBodyRef = React.useRef<RapierRigidBody>(null);
  const cameraTargetRef = React.useRef<THREE.Group>(null);
  const modelRef = React.useRef<THREE.Group>(null);
  const { state } = useGame();

  const cameraResult = useThirdPersonCamera(cameraTargetRef);

  usePlayerController({
    rigidBody: rigidBodyRef,
    cameraTarget: cameraTargetRef,
    model: modelRef,
    camera: cameraResult,
    room: state.room,
  });

  useItemInteraction({ rigidBody: rigidBodyRef, room: state.room });

  return (
    <>
      <group ref={cameraTargetRef} />
      <PlayerBody rigidBodyRef={rigidBodyRef} modelRef={modelRef} />
    </>
  );
}
