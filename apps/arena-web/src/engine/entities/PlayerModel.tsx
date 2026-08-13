import React, { useRef, Suspense, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { EQUIPMENT_SLOTS } from '@average.dev/arena-shared';
import { PLAYER_RADIUS, PLAYER_HEIGHT } from '../constants';
import { EquipmentPiece } from './EquipmentPiece';

const CHARACTER_MODEL_PATH = '/character_v2/base_character.glb';
const HAIR_MODEL_PATH = '/character_v2/hair.glb';

/**
 * Character model loaded from the user's Blender export.
 * Applies skin tone tint to all mesh materials.
 * Falls back to the capsule placeholder if loading fails.
 */
function CharacterModel({ tone }: { tone?: string }) {
  const { scene } = useGLTF(CHARACTER_MODEL_PATH);
  const clone = useMemo(() => scene.clone(true), [scene]);

  // Apply tone tint to cloned mesh materials when tone changes
  useEffect(() => {
    if (!tone) return;
    const color = new THREE.Color(tone);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        // Clone material so tint doesn't bleed across instances
        if (!mesh.userData._materialCloned) {
          mesh.material = (mesh.material as THREE.MeshStandardMaterial).clone();
          mesh.userData._materialCloned = true;
        }
        const material = mesh.material as THREE.MeshStandardMaterial;
        if (material?.color) {
          material.color.copy(color);
        }
      }
    });
  }, [clone, tone]);

  return (
    <primitive
      object={clone}
      castShadow
      receiveShadow
    />
  );
}

/**
 * Hair overlay model — only rendered when hairStyle !== 'bald'.
 */
function HairModel() {
  const { scene } = useGLTF(HAIR_MODEL_PATH);
  const clone = useMemo(() => scene.clone(), [scene]);
  return <primitive object={clone} castShadow receiveShadow />;
}

// Pre-load the character model
try {
  useGLTF.preload(CHARACTER_MODEL_PATH);
} catch {
  // Silently skip preload if file doesn't exist
}

/**
 * Placeholder capsule model — used as fallback while the real model loads.
 */
function CapsuleFallback() {
  const meshRef = useRef<THREE.Mesh>(null);
  const capsuleY = PLAYER_HEIGHT / 2;

  return (
    <group>
      {/* Body capsule */}
      <mesh ref={meshRef} position={[0, capsuleY, 0]} castShadow>
        <capsuleGeometry args={[PLAYER_RADIUS, PLAYER_HEIGHT - PLAYER_RADIUS * 2, 8, 16]} />
        <meshStandardMaterial color="#7c5ce0" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Head sphere */}
      <mesh position={[0, PLAYER_HEIGHT - PLAYER_RADIUS * 0.5, 0]} castShadow>
        <sphereGeometry args={[PLAYER_RADIUS * 0.7, 16, 16]} />
        <meshStandardMaterial color="#ffccaa" roughness={0.6} metalness={0.0} />
      </mesh>

      {/* Direction indicator */}
      <mesh
        position={[0, capsuleY, PLAYER_RADIUS * 1.2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <coneGeometry args={[PLAYER_RADIUS * 0.3, PLAYER_RADIUS * 0.6, 8]} />
        <meshStandardMaterial color="#e06c5c" roughness={0.5} />
      </mesh>
    </group>
  );
}

/**
 * PlayerModel — renders the character GLB if available,
 * falls back to a capsule placeholder during loading or on error.
 * Conditionally overlays equipment pieces and cosmetic hair.
 *
 * Pure presentational — positioned by the parent group from PlayerController.
 */
interface PlayerModelProps {
  equipment?: {
    weapon?: string;
    shield?: string;
    helm?: string;
    top?: string;
    legs?: string;
    belt?: string;
    boots?: string;
    cape?: string;
    accessory?: string;
  };
  /** Skin tone hex color (e.g. '#ffccaa'). Applied as a tint to the model. */
  tone?: string;
  /** Hair style key. 'bald' or empty means no hair. 'hair_default' renders the hair overlay. */
  hairStyle?: string;
}

export function PlayerModel({ equipment = {}, tone, hairStyle }: PlayerModelProps) {
  const showHair = hairStyle && hairStyle !== 'bald';

  return (
    <Suspense fallback={<CapsuleFallback />}>
      <CharacterModel tone={tone} />
      {EQUIPMENT_SLOTS.map(slot => {
        const itemType = equipment[slot];
        if (!itemType || itemType === 'none' || itemType === 'fists') return null;
        return <EquipmentPiece key={slot} itemType={itemType} />;
      })}
      {showHair && (
        <Suspense fallback={null}>
          <HairModel />
        </Suspense>
      )}
    </Suspense>
  );
}
