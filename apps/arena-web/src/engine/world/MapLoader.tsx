import React, { Suspense, useMemo } from 'react';
import { getMap } from './maps';

interface MapLoaderProps {
  /** The map id to load from the registry. */
  mapId: string;
  worldSize?: number;
}

/**
 * MapLoader — resolves a mapId from the registry and renders
 * the map's component. Wrapped in Suspense for async-loading maps.
 */
export function MapLoader({ mapId, worldSize }: MapLoaderProps) {
  const config = useMemo(() => getMap(mapId), [mapId]);
  const MapComponent = config.component;

  return (
    <Suspense fallback={null}>
      <MapComponent worldSize={worldSize} />
    </Suspense>
  );
}
