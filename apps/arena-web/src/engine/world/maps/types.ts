import type React from 'react';

/**
 * Configuration for a game map.
 * Each map registers itself with these properties so the engine
 * can load it dynamically and apply the correct scene settings.
 */
export interface MapConfig {
  /** Unique identifier (e.g., 'mountain', 'test-grid'). */
  id: string;
  /** Display name shown in the lobby. */
  name: string;
  /** Short description shown in the lobby. */
  description: string;
  /** R3F component that renders the map geometry + colliders. */
  component: React.ComponentType<{ worldSize?: number }>;
  /** Y position to spawn the player above the map. */
  spawnHeight: number;
  /** Fog start distance. */
  fogNear: number;
  /** Fog end distance. */
  fogFar: number;
  /** Scene background color (CSS color string). */
  backgroundColor: string;
  /** Ambient light intensity for this map. */
  ambientIntensity: number;
}
