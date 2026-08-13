import React, { Suspense, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, useGLTF } from '@react-three/drei';
import {
  useCharacterPreview,
  TONE_OPTIONS,
  HAIR_OPTIONS,
} from './useCharacterPreview';
import styles from './CharacterCustomization.module.scss';

// ── 3D Scene Components ──────────────────────────────────────────────────────

/**
 * Hair overlay loaded inside the R3F canvas.
 */
function HairOverlay({ modelPath }: { modelPath: string }) {
  const { scene } = useGLTF(modelPath);
  const clone = useMemo(() => scene.clone(), [scene]);
  return <primitive object={clone} castShadow receiveShadow />;
}

/**
 * 3D preview scene — renders the base character with optional hair overlay
 * on a circular pedestal with orbiting camera controls.
 */
function PreviewScene({ tone, hairStyle }: { tone: string; hairStyle: string }) {
  const { characterScene, showHair, hairModelPath } = useCharacterPreview({
    tone,
    hairStyle,
  });

  return (
    <>
      {/* Lighting — brighter for better contrast */}
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

      {/* Character + hair in the same group so they share origin */}
      <group>
        <primitive object={characterScene} castShadow receiveShadow />
        {showHair && (
          <Suspense fallback={null}>
            <HairOverlay modelPath={hairModelPath} />
          </Suspense>
        )}
      </group>

      {/* Pedestal */}
      <mesh position={[0, -0.01, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2, 64]} />
        <meshStandardMaterial
          color="#2a2a3e"
          roughness={0.6}
          metalness={0.3}
        />
      </mesh>

      {/* Orbit controls — target at character's mid-body */}
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

export interface CharacterCustomizationProps {
  bodyType: string;
  hairStyle: string;
  onBodyTypeChange: (value: string) => void;
  onHairStyleChange: (value: string) => void;
  onSave: () => void;
}

/**
 * CharacterCustomization — full-viewport 3D character editor.
 * Left side: R3F canvas with the base character + optional hair overlay.
 * Right side: Glassmorphism controls for skin tone and hair style.
 *
 * Presentational — state is managed by the parent (HomePage via useHomeState).
 */
export function CharacterCustomization({
  bodyType,
  hairStyle,
  onBodyTypeChange,
  onHairStyleChange,
  onSave,
}: CharacterCustomizationProps) {
  // Find current hair index for cycling
  const currentHairIndex = useMemo(
    () => Math.max(0, HAIR_OPTIONS.findIndex(h => h.key === hairStyle)),
    [hairStyle],
  );

  const cycleHair = useCallback(
    (direction: -1 | 1) => {
      const nextIndex =
        (currentHairIndex + direction + HAIR_OPTIONS.length) % HAIR_OPTIONS.length;
      onHairStyleChange(HAIR_OPTIONS[nextIndex].key);
    },
    [currentHairIndex, onHairStyleChange],
  );

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
            <PreviewScene tone={bodyType} hairStyle={hairStyle} />
          </Suspense>
        </Canvas>
      </div>

      {/* Right: Controls */}
      <div className={styles.controlsSection}>
        <h1 className={styles.title}>CUSTOMIZE</h1>
        <p className={styles.subtitle}>Create Your Character</p>

        {/* Skin Tone */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Skin Tone</div>
          <div className={styles.toneRow}>
            {TONE_OPTIONS.map(tone => (
              <button
                key={tone.id}
                className={`${styles.toneSwatch} ${bodyType === tone.hex ? styles.active : ''}`}
                style={{ backgroundColor: tone.hex }}
                onClick={() => onBodyTypeChange(tone.hex)}
                title={tone.label}
                aria-label={`Select ${tone.label} skin tone`}
              />
            ))}
          </div>
        </div>

        {/* Hair Style */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Hair Style</div>
          <div className={styles.hairSelector}>
            <button
              className={styles.arrowBtn}
              onClick={() => cycleHair(-1)}
              aria-label="Previous hair style"
            >
              ◀
            </button>
            <span className={styles.hairLabel}>
              {HAIR_OPTIONS[currentHairIndex].label}
            </span>
            <button
              className={styles.arrowBtn}
              onClick={() => cycleHair(1)}
              aria-label="Next hair style"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Save */}
        <button className={styles.saveButton} onClick={onSave}>
          Save &amp; Return
        </button>
      </div>
    </div>
  );
}
