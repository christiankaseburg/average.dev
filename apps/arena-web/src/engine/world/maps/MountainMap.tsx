import React, { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { registerMap } from './registry';
import type { MapConfig } from './types';

/**
 * Mountain Map — loads the Mountain.glb terrain model.
 *
 * NOTE: The trimesh collider is generated from ALL child meshes of the GLB.
 * For production, export a simplified collision mesh (low-poly) as a separate
 * GLB and load that for the collider instead.
 */

function MountainMapInner() {
  const { scene } = useGLTF('/map/Mountain.glb');

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <primitive
        object={scene}
        position={[0, 0, 0]}
        receiveShadow
        castShadow
      />
    </RigidBody>
  );
}

useGLTF.preload('/map/Mountain.glb');

/** Simple green ground plane shown while the mountain loads. */
function FallbackGround() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#2d4c1e" roughness={0.9} />
      </mesh>
    </RigidBody>
  );
}

export function MountainMap() {
  return (
    <Suspense fallback={<FallbackGround />}>
      <MountainMapInner />
    </Suspense>
  );
}

// Self-register on import
const MOUNTAIN_CONFIG: MapConfig = {
  id: 'mountain',
  name: 'Mountain',
  description: 'Rocky mountain terrain with elevation',
  component: MountainMap,
  spawnHeight: 10,
  fogNear: 100,
  fogFar: 400,
  backgroundColor: '#1a1a2e',
  ambientIntensity: 0.4,
};

registerMap(MOUNTAIN_CONFIG);
