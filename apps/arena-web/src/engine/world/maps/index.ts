// Import map modules to trigger self-registration via registerMap()
import './TestGridMap';
import './MountainMap';

// Re-export registry and types for external use
export { getMap, getAllMaps, getDefaultMapId, registerMap } from './registry';
export type { MapConfig } from './types';
