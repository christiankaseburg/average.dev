import React, { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import { getItemEntry } from '../items/item-registry';

interface EquipmentPieceProps {
  itemType: string;
}

/**
 * Renders an equipment GLB model overlaid on the character.
 * Falls back to nothing (invisible) if the GLB file is not available.
 * Equipment models are exported from Blender at the same origin/scale
 * as the base character, so no positioning adjustment is needed.
 */
function EquipmentModel({ modelPath }: { modelPath: string }) {
  const { scene } = useGLTF(modelPath);
  return <primitive object={scene.clone()} castShadow receiveShadow />;
}

export function EquipmentPiece({ itemType }: EquipmentPieceProps) {
  const entry = getItemEntry(itemType);
  if (!entry || !entry.modelPath) return null;

  return (
    <Suspense fallback={null}>
      <EquipmentModel modelPath={entry.modelPath} />
    </Suspense>
  );
}
