import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { RapierRigidBody } from '@react-three/rapier';
import type { Room } from '@colyseus/sdk';
import { useItems } from '../../context/ItemContext';

const INTERACT_RANGE = 2.0;
const INTERACT_RANGE_SQ = INTERACT_RANGE * INTERACT_RANGE;

interface UseItemInteractionOptions {
  rigidBody: React.RefObject<RapierRigidBody | null>;
  room: Room | null;
}

export function useItemInteraction({ rigidBody, room }: UseItemInteractionOptions) {
  const { state, setNearbyItem, requestPickup } = useItems();
  const interactPressedRef = useRef(false);

  // Listen for E key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E') {
        interactPressedRef.current = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E') {
        interactPressedRef.current = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Per-frame proximity check
  useFrame(() => {
    const rb = rigidBody.current;
    if (!rb) return;

    const pos = rb.translation();
    let nearestId: string | null = null;
    let nearestDistSq = Infinity;

    for (const [id, item] of state.worldItems) {
      const dx = pos.x - item.x;
      const dz = pos.z - item.z;
      const distSq = dx * dx + dz * dz;
      if (distSq <= INTERACT_RANGE_SQ && distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearestId = id;
      }
    }

    setNearbyItem(nearestId);

    // Handle pickup on E press
    if (interactPressedRef.current && nearestId) {
      interactPressedRef.current = false; // Consume the press
      requestPickup(room);
    }
  });
}
