import React, { Suspense, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import { useItems, type WorldItem as WorldItemData } from '../../context/ItemContext';
import { getItemEntry, RARITY_COLORS } from '../items/item-registry';

function PlaceholderItem({ color }: { color: string }) {
  return (
    <mesh castShadow>
      <boxGeometry args={[0.4, 0.4, 0.4]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
    </mesh>
  );
}

function WorldItemModel({ modelPath }: { modelPath: string }) {
  const { scene } = useGLTF(modelPath);
  const clone = useMemo(() => scene.clone(), [scene]);

  return <primitive object={clone} castShadow receiveShadow />;
}

function WorldItemEntity({ id, item }: { id: string; item: WorldItemData }) {
  const ref = useRef<THREE.Group>(null);
  const entry = getItemEntry(item.itemType);
  const rarityColor = entry ? RARITY_COLORS[entry.rarity as keyof typeof RARITY_COLORS] || '#ffffff' : '#ffffff';
  const placeholderColor = entry?.placeholderColor || rarityColor;

  useFrame((state) => {
    if (ref.current) {
      // Gentle floating bob animation
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 2.0) * 0.15 + 0.3;
      ref.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={[item.x, 0, item.z]}>
      <group ref={ref}>
        <Suspense fallback={<PlaceholderItem color={placeholderColor} />}>
          {entry?.modelPath ? (
            <WorldItemModel modelPath={entry.modelPath} />
          ) : (
            <PlaceholderItem color={placeholderColor} />
          )}
        </Suspense>
        
        <Html position={[0, 0.8, 0]} center>
          <div style={{
            background: 'rgba(0, 0, 0, 0.7)',
            color: rarityColor,
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            border: `1px solid ${rarityColor}`
          }}>
            {entry?.name || item.itemType}
          </div>
        </Html>
      </group>
    </group>
  );
}

export function WorldItems() {
  const { state } = useItems();
  
  return (
    <group>
      {Array.from(state.worldItems.entries()).map(([id, item]) => (
        <WorldItemEntity key={id} id={id} item={item} />
      ))}
    </group>
  );
}
