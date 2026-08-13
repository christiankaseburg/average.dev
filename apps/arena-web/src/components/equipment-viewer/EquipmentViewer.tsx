import React, { Suspense, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { EquipmentPiece } from '../../engine/entities/EquipmentPiece';
import {
  useEquipmentViewer,
  VIEWER_SLOTS,
  SLOT_LABELS,
} from './useEquipmentViewer';
import type { EquipmentSlot } from '@average.dev/arena-shared';
import styles from './EquipmentViewer.module.scss';

const CHARACTER_MODEL_PATH = '/character_v2/base_character.glb';
const HAIR_MODEL_PATH = '/character_v2/hair.glb';

// ── 3D Scene ─────────────────────────────────────────────────────────────────

function CharacterPreview({ tone }: { tone: string }) {
  const { scene } = useGLTF(CHARACTER_MODEL_PATH);

  useEffect(() => {
    const color = new THREE.Color(tone);
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat?.color) {
          mat.color.copy(color);
          mat.needsUpdate = true;
        }
      }
    });
  }, [scene, tone]);

  return <primitive object={scene} castShadow receiveShadow />;
}

function HairOverlay() {
  const { scene } = useGLTF(HAIR_MODEL_PATH);
  const clone = useMemo(() => scene.clone(), [scene]);
  return <primitive object={clone} castShadow receiveShadow />;
}

function PreviewScene({
  tone,
  hairStyle,
  equipmentRecord,
}: {
  tone: string;
  hairStyle: string;
  equipmentRecord: Record<string, string>;
}) {
  const showHair = hairStyle && hairStyle !== 'bald';

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, 4, -2]} intensity={0.4} />
      <hemisphereLight args={['#b0c4de', '#4a3728', 0.5]} />

      <group>
        <CharacterPreview tone={tone} />
        {showHair && (
          <Suspense fallback={null}>
            <HairOverlay />
          </Suspense>
        )}
        {VIEWER_SLOTS.map(slot => {
          const itemType = equipmentRecord[slot];
          if (!itemType || itemType === 'none') return null;
          return (
            <Suspense key={slot} fallback={null}>
              <EquipmentPiece itemType={itemType} />
            </Suspense>
          );
        })}
      </group>

      <mesh position={[0, -0.01, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2, 64]} />
        <meshStandardMaterial color="#2a2a3e" roughness={0.6} metalness={0.3} />
      </mesh>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        target={[0, 1.5, 0]}
      />
    </>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export interface EquipmentViewerProps {
  onClose: () => void;
}

export function EquipmentViewer({ onClose }: EquipmentViewerProps) {
  const {
    cycleSlot,
    getSelectedLabel,
    hasItems,
    equipmentRecord,
  } = useEquipmentViewer();

  // Read cosmetic preferences from localStorage
  const tone = useMemo(() => localStorage.getItem('arena_bodyType') || '#ffccaa', []);
  const hairStyle = useMemo(() => localStorage.getItem('arena_hairStyle') || 'bald', []);

  return (
    <div className={styles.container}>
      {/* Left: 3D Preview */}
      <div className={styles.canvasSection}>
        <Canvas
          shadows={{ type: THREE.PCFShadowMap }}
          camera={{ fov: 45, near: 0.01, far: 100, position: [0, 2, 5] }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={['#1a1a2e']} />
          <fog attach="fog" args={['#1a1a2e', 8, 20]} />
          <Suspense fallback={null}>
            <PreviewScene
              tone={tone}
              hairStyle={hairStyle}
              equipmentRecord={equipmentRecord}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Right: Slot Browser */}
      <div className={styles.controlsSection}>
        <h1 className={styles.title}>EQUIPMENT</h1>
        <p className={styles.subtitle}>Browse Available Items</p>

        <div className={styles.slotsContainer}>
          {VIEWER_SLOTS.map(slot => (
            <SlotRow
              key={slot}
              slot={slot}
              label={SLOT_LABELS[slot]}
              itemLabel={getSelectedLabel(slot)}
              disabled={!hasItems(slot)}
              onCycle={cycleSlot}
            />
          ))}
        </div>

        <button className={styles.backButton} onClick={onClose}>
          ← Back
        </button>
      </div>
    </div>
  );
}

// ── SlotRow ──────────────────────────────────────────────────────────────────

function SlotRow({
  slot,
  label,
  itemLabel,
  disabled,
  onCycle,
}: {
  slot: EquipmentSlot;
  label: string;
  itemLabel: string;
  disabled: boolean;
  onCycle: (slot: EquipmentSlot, dir: -1 | 1) => void;
}) {
  return (
    <div className={styles.slotRow}>
      <span className={styles.slotLabel}>{label}</span>
      <div className={styles.slotControls}>
        <button
          className={`${styles.arrowBtn} ${disabled ? styles.disabled : ''}`}
          onClick={() => onCycle(slot, -1)}
          disabled={disabled}
          aria-label={`Previous ${label}`}
        >
          ◀
        </button>
        <span className={styles.itemLabel}>
          {disabled ? 'No items' : itemLabel}
        </span>
        <button
          className={`${styles.arrowBtn} ${disabled ? styles.disabled : ''}`}
          onClick={() => onCycle(slot, 1)}
          disabled={disabled}
          aria-label={`Next ${label}`}
        >
          ▶
        </button>
      </div>
    </div>
  );
}
