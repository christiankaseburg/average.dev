import React, { Suspense, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { EQUIPMENT_SLOTS } from '@average.dev/arena-shared';
import type { PlayerSnapshot } from '@average.dev/arena-shared';
import { PLAYER_SCALE, PLAYER_HEIGHT } from '../../engine/constants';
import { useGame } from '../../context/GameContext';
import { PlayerModel } from '../../engine/entities/PlayerModel';

interface RemotePlayerTarget {
  position: THREE.Vector3;
  rotationY: number;
  name: string;
  isAlive: boolean;
  equipment: Record<string, string>;
  hairStyle: string;
  bodyType: string;
}

/**
 * RemotePlayers — subscribes to the existing StateHandler events
 * (playerJoin, playerUpdate, playerLeave) which are already proven
 * to fire on every Colyseus state patch.
 *
 * Positions and equipment are stored in a ref and read by useFrame each
 * render frame. React state only tracks the ID list for mount/unmount
 * of entities. Equipment changes trigger a React re-render via a
 * version counter so the PlayerModel picks up new equipment.
 */
export function RemotePlayers() {
  const { state } = useGame();
  const { stateHandler, room } = state;
  const localSessionId = room?.sessionId ?? null;

  const targetsRef = useRef<Map<string, RemotePlayerTarget>>(new Map());
  const [playerIds, setPlayerIds] = useState<string[]>([]);
  // Bump this to force re-render when equipment changes
  const [, setVersion] = useState(0);

  const syncIds = useRef(() => {
    setPlayerIds(Array.from(targetsRef.current.keys()));
  });

  useEffect(() => {
    if (!stateHandler || !room) return;

    const extractEquipment = (snapshot: PlayerSnapshot): Record<string, string> => {
      const eq: Record<string, string> = {};
      for (const slot of EQUIPMENT_SLOTS) {
        eq[slot] = (snapshot as Record<string, unknown>)[slot] as string ?? 'none';
      }
      return eq;
    };

    const addOrUpdate = (sessionId: string, snapshot: PlayerSnapshot) => {
      if (sessionId === localSessionId) return;

      const sx = snapshot.x ?? 0;
      const sy = snapshot.y ?? 0;
      const sz = (snapshot as { z?: number }).z ?? 0;
      const sRotY = (snapshot as { rotationY?: number }).rotationY ?? 0;
      const equipment = extractEquipment(snapshot);

      const existing = targetsRef.current.get(sessionId);
      if (existing) {
        existing.position.set(sx, sy, sz);
        existing.rotationY = sRotY;
        existing.name = snapshot.name ?? '';
        existing.isAlive = snapshot.isAlive ?? true;
        existing.hairStyle = snapshot.hairStyle ?? 'bald';
        existing.bodyType = snapshot.bodyType ?? '#ffccaa';

        // Check if equipment changed and trigger re-render
        let equipChanged = false;
        for (const slot of EQUIPMENT_SLOTS) {
          if (existing.equipment[slot] !== equipment[slot]) {
            equipChanged = true;
            break;
          }
        }
        if (equipChanged) {
          existing.equipment = equipment;
          setVersion(v => v + 1);
        }
      } else {
        targetsRef.current.set(sessionId, {
          position: new THREE.Vector3(sx, sy, sz),
          rotationY: sRotY,
          name: snapshot.name ?? '',
          isAlive: snapshot.isAlive ?? true,
          equipment,
          hairStyle: snapshot.hairStyle ?? 'bald',
          bodyType: snapshot.bodyType ?? '#ffccaa',
        });
        syncIds.current();
      }
    };

    const handleLeave = (sessionId: string) => {
      targetsRef.current.delete(sessionId);
      syncIds.current();
    };

    // Subscribe to StateHandler events (fires on every server tick)
    stateHandler.on('playerJoin', addOrUpdate);
    stateHandler.on('playerUpdate', addOrUpdate);
    stateHandler.on('playerLeave', handleLeave);

    // Initial scan: pick up players already in the room state
    // This solves the timing issue where playerJoin fires before mount
    try {
      const rawState = room.state as { players?: unknown };
      if (rawState?.players) {
        const players = rawState.players as {
          forEach: (cb: (p: PlayerSnapshot, id: string) => void) => void;
        };
        if (typeof players.forEach === 'function') {
          players.forEach((player: PlayerSnapshot, sessionId: string) => {
            addOrUpdate(sessionId, player);
          });
        }
      }
    } catch {
      // Silently skip if state structure is unexpected
    }

    return () => {
      stateHandler.off('playerJoin', addOrUpdate);
      stateHandler.off('playerUpdate', addOrUpdate);
      stateHandler.off('playerLeave', handleLeave);
      targetsRef.current.clear();
      setPlayerIds([]);
    };
  }, [stateHandler, room, localSessionId]);

  return (
    <>
      {playerIds.map((sessionId) => (
        <RemotePlayerEntity
          key={sessionId}
          sessionId={sessionId}
          targetsRef={targetsRef}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// RemotePlayerEntity — reads position + equipment from targetsRef each frame
// ---------------------------------------------------------------------------

interface RemotePlayerEntityProps {
  sessionId: string;
  targetsRef: React.RefObject<Map<string, RemotePlayerTarget>>;
}

function RemotePlayerEntity({ sessionId, targetsRef }: RemotePlayerEntityProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const target = targetsRef.current?.get(sessionId);
    if (!target || !groupRef.current) return;

    groupRef.current.position.lerp(target.position, 0.2);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      target.rotationY,
      0.2
    );
    groupRef.current.visible = target.isAlive;
  });

  const initial = targetsRef.current?.get(sessionId);

  return (
    <group
      ref={groupRef}
      position={
        initial
          ? [initial.position.x, initial.position.y, initial.position.z]
          : [0, 0, 0]
      }
    >
      <group scale={[PLAYER_SCALE, PLAYER_SCALE, PLAYER_SCALE]}>
        <Suspense fallback={<CapsuleFallback />}>
          <PlayerModel
            equipment={initial?.equipment}
            tone={initial?.bodyType}
            hairStyle={initial?.hairStyle}
          />
        </Suspense>
      </group>

      <Html
        position={[0, PLAYER_HEIGHT * PLAYER_SCALE + 0.3, 0]}
        center
        distanceFactor={8}
        style={{
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
          textShadow: '0 0 4px rgba(0,0,0,0.8)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {initial?.name ?? ''}
      </Html>
    </group>
  );
}

function CapsuleFallback() {
  return (
    <group>
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.4, 1.0, 8, 16]} />
        <meshStandardMaterial color="#7c5ce0" roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color="#ffccaa" roughness={0.6} />
      </mesh>
    </group>
  );
}
