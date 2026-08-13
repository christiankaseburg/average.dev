import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

const CHARACTER_MODEL_PATH = '/character_v2/base_character.glb';
const HAIR_MODEL_PATH = '/character_v2/hair.glb';

/**
 * Skin tone palette — hex values sent to the server as `bodyType`.
 */
export const TONE_OPTIONS = [
  { id: 'light', hex: '#ffccaa', label: 'Light' },
  { id: 'medium', hex: '#d4a373', label: 'Medium' },
  { id: 'tan', hex: '#c68642', label: 'Tan' },
  { id: 'brown', hex: '#8b5a2b', label: 'Brown' },
  { id: 'dark', hex: '#5c3a1e', label: 'Dark' },
  { id: 'deep', hex: '#3b2212', label: 'Deep' },
] as const;

/**
 * Hair style options. Each entry has a key (stored as `hairStyle`)
 * and a display label. 'bald' means no hair overlay.
 */
export const HAIR_OPTIONS = [
  { key: 'bald', label: 'No Hair' },
  { key: 'hair_default', label: 'Hair Style 1' },
] as const;

interface UseCharacterPreviewOptions {
  /** Hex color for the skin tone tint (e.g. '#ffccaa') */
  tone: string;
  /** Hair style key — 'bald' means no hair overlay */
  hairStyle: string;
}

/**
 * useCharacterPreview — manages the 3D character preview for the
 * customization screen. Loads the base character and optionally the
 * hair model, applying the tone tint to all mesh materials.
 *
 * Returns cloned scenes so the preview doesn't interfere with
 * the in-game character model cache.
 */
export function useCharacterPreview({ tone, hairStyle }: UseCharacterPreviewOptions) {
  const { scene: baseScene } = useGLTF(CHARACTER_MODEL_PATH);
  const characterScene = useMemo(() => baseScene.clone(true), [baseScene]);

  // Apply tone tint to all mesh materials
  useEffect(() => {
    const color = new THREE.Color(tone);
    characterScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        // Handle both single material and material arrays
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of materials) {
          const stdMat = mat as THREE.MeshStandardMaterial;
          if (stdMat.color) {
            stdMat.color.copy(color);
            stdMat.needsUpdate = true;
          }
        }
      }
    });
  }, [characterScene, tone]);

  const showHair = hairStyle !== 'bald';

  return {
    characterScene,
    showHair,
    hairModelPath: HAIR_MODEL_PATH,
  };
}
