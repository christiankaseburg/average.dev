import React from 'react';
import { RigidBody } from '@react-three/rapier';
import { registerMap } from './registry';
import type { MapConfig } from './types';

export function TestGridMap({ worldSize = 20 }: { worldSize?: number }) {
  const divisions = worldSize;

  return (
    <group>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[worldSize, worldSize]} />
          <meshStandardMaterial color="#f5f5f5" roughness={0.8} metalness={0.0} />
        </mesh>
      </RigidBody>

      <gridHelper
        args={[worldSize, divisions, '#cccccc', '#e0e0e0']}
        position={[0, 0.01, 0]}
      />

      <gridHelper
        args={[worldSize, 4, '#999999', '#dddddd']}
        position={[0, 0.02, 0]}
      />
    </group>
  );
}

const TEST_GRID_CONFIG: MapConfig = {
  id: 'test-grid',
  name: 'Test Grid',
  description: 'Flat grid for development and testing',
  component: TestGridMap,
  spawnHeight: 3,
  fogNear: 15,
  fogFar: 40,
  backgroundColor: '#e8e8e8',
  ambientIntensity: 0.8,
};

registerMap(TEST_GRID_CONFIG);
