import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { PlayerController } from './PlayerController';
import { RemotePlayers } from './RemotePlayers';
import { WorldItems } from '../../engine/entities/WorldItems';
import { MapLoader } from '../../engine/world/MapLoader';
import { getMap } from '../../engine/world/maps';
import { WORLD_GRAVITY } from '../../engine/constants';
import { useGame } from '../../context/GameContext';
import styles from './GameCanvas.module.scss';

/**
 * GameCanvas — React Three Fiber canvas wrapper with Rapier physics.
 * Reads the active mapId from GameContext, looks up the map config,
 * and applies per-map scene settings (fog, background, lighting).
 */
export function GameCanvas() {
  const { state } = useGame();
  const mapConfig = useMemo(() => getMap(state.mapId), [state.mapId]);
  const worldSize = (state.room?.state as { worldSize?: number })?.worldSize;

  return (
    <div className={styles.canvasContainer}>
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ fov: 60, near: 0.01, far: 1000, position: [0, 5, 8] }}
        gl={{ antialias: true }}
      >
        <Physics gravity={WORLD_GRAVITY} interpolate={true} timeStep={1/60}>
          {/* Lighting — intensity from map config */}
          <ambientLight intensity={mapConfig.ambientIntensity} />
          <directionalLight
            castShadow
            position={[50, 80, 50]}
            intensity={1.2}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={200}
            shadow-camera-left={-100}
            shadow-camera-right={100}
            shadow-camera-top={100}
            shadow-camera-bottom={-100}
          />
          <hemisphereLight
            args={['#87ceeb', '#2d4c1e', 0.3]}
          />

          {/* Per-map fog and background */}
          <fog attach="fog" args={[mapConfig.backgroundColor, mapConfig.fogNear, mapConfig.fogFar]} />
          <color attach="background" args={[mapConfig.backgroundColor]} />

          {/* Dynamic map loader */}
          <MapLoader mapId={state.mapId} worldSize={worldSize} />

          {/* Local player */}
          <PlayerController />

          {/* Remote players from Colyseus */}
          <RemotePlayers />

          <WorldItems />
        </Physics>
      </Canvas>
    </div>
  );
}
