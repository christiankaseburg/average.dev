import type { MapConfig } from './types';

/**
 * Central map registry.
 * Maps register themselves by calling registerMap() at module scope.
 * The registry is consumed by MapLoader to resolve a mapId to a component.
 */

const MAP_REGISTRY = new Map<string, MapConfig>();

/** Register a map configuration. Throws if the id is already taken. */
export function registerMap(config: MapConfig): void {
  if (MAP_REGISTRY.has(config.id)) {
    console.warn(`Map '${config.id}' is already registered. Skipping.`);
    return;
  }
  MAP_REGISTRY.set(config.id, config);
}

/** Get a map config by id. Throws if not found. */
export function getMap(id: string): MapConfig {
  const config = MAP_REGISTRY.get(id);
  if (!config) {
    throw new Error(`Map '${id}' is not registered. Available: ${Array.from(MAP_REGISTRY.keys()).join(', ')}`);
  }
  return config;
}

/** Get all registered maps as an array (for lobby display). */
export function getAllMaps(): MapConfig[] {
  return Array.from(MAP_REGISTRY.values());
}

/** Get the default map id. */
export function getDefaultMapId(): string {
  return 'test-grid';
}
