/**
 * NpcDefinition — Registry of all NPC types.
 *
 * This file is pure metadata — no asset imports, no Vite bundling.
 * Asset files live in public/npc/<folder>/ and are fetched on demand
 * by BootScene using Phaser's standard file loader.
 *
 * TO ADD A NEW NPC:
 *  1. Export from Aseprite: File → Export Sprite Sheet
 *       Layout: packed / rows+columns, "Trim Sprite" + "Trim Cells" on
 *       Output: JSON Hash format, Tags checked
 *       Item Filename: {title} {frame}.aseprite  (gives "Demon_A 0.aseprite" keys)
 *  2. Create public/npc/<folder>/ and place <Name>.png, <Name>.json, <Name>.aseprite there
 *  3. Add an entry to NPC_REGISTRY below with the URL paths and animation tag names
 *  BootScene and NpcSprite need no other changes.
 *
 * SELECTIVE LOADING (future):
 *  When the server sends which NPC types are in the current zone, pass that list
 *  to BootScene (or a per-zone loader) and filter NPC_REGISTRY to only load those.
 *  The registry acts as the master catalogue; actual loading is opt-in.
 */

/** Logical animation states an NPC can be in. */
export type NpcAnimState = 'idle' | 'walk' | 'attack1' | 'attack2' | 'hurt' | 'death';

/** Full definition for one NPC type. All fields are pure data — no imports. */
export interface NpcDefinition {
  /** Unique identifier, used as the key in NPC_REGISTRY */
  type: string;
  /** Display name shown above the NPC in game */
  displayName: string;
  /**
   * Atlas key used with Phaser's TextureManager and AnimationManager.
   * Animations are namespaced as `${atlasKey}_${state}`, e.g. "npc_demon_a_idle".
   */
  atlasKey: string;
  /**
   * URL to the sprite sheet PNG, relative to the Vite dev server / deployment root.
   * File must be in public/ so it is served statically.
   * e.g. '/npc/demon/Demon_A.png'
   */
  pngPath: string;
  /**
   * URL to the Aseprite JSON Hash export, relative to root.
   * Must be in the same folder as the PNG.
   * e.g. '/npc/demon/Demon_A.json'
   */
  jsonPath: string;
  /**
   * Maps logical states → Aseprite tag names (case-sensitive, exactly as in the export).
   * Omit states the NPC doesn't have — the state machine will skip them.
   */
  animations: Partial<Record<NpcAnimState, string>>;
  /** Uniform scale applied to the sprite (default: 1). */
  scale?: number;
}

/**
 * All registered NPC types.
 *
 * Aseprite tag names for Demon_A (verify in Aseprite Tags panel):
 *   Idle, Walk, Attack01, Attack02, Hurt, Death
 */
export const NPC_REGISTRY: Record<string, NpcDefinition> = {
  demon_a: {
    type:        'demon_a',
    displayName: 'Demon',
    atlasKey:    'npc_demon_a',
    pngPath:     '/npc/demon/Demon_A.png',
    jsonPath:    '/npc/demon/Demon_A.json',
    animations: {
      idle:    'Idle',
      walk:    'Walk',
      attack1: 'Attack01',
      attack2: 'Attack02',
      hurt:    'Hurt',
      death:   'Death',
    },
    scale: 1.5,
  },
};

/** Ordered showcase loop for the demo state cycle in NpcEntity. */
export const NPC_STATE_CYCLE: NpcAnimState[] = [
  'idle',
  'walk',
  'attack1',
  'attack2',
  'hurt',
  'death',
];
