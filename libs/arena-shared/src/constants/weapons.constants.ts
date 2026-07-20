/**
 * Weapon definitions shared between arena-api (for damage/range logic)
 * and arena-web (for display names, visual feedback, and range indicators).
 */

export interface WeaponConfig {
  /** Display name shown in HUD */
  name: string;
  /** Damage dealt per hit */
  damage: number;
  /** Attack range in pixels (used for hitbox calculation on server) */
  range: number;
  /** Cooldown between attacks in milliseconds */
  attackSpeed: number;
  /** Knockback force applied to hit target in pixels */
  knockback: number;
}

/**
 * All available weapons keyed by their identifier string.
 * This key is stored in PlayerState.weapon and used to look up config on both client and server.
 */
export const WEAPONS: Record<string, WeaponConfig> = {
  fists: {
    name: 'Fists',
    damage: 5,
    range: 40,
    attackSpeed: 500,
    knockback: 10,
  },
  sword: {
    name: 'Sword',
    damage: 15,
    range: 64,
    attackSpeed: 800,
    knockback: 20,
  },
  dagger: {
    name: 'Dagger',
    damage: 10,
    range: 32,
    attackSpeed: 400,
    knockback: 5,
  },
  spear: {
    name: 'Spear',
    damage: 12,
    range: 64,
    attackSpeed: 1000,
    knockback: 30,
  },
  bow: {
    name: 'Bow',
    damage: 20,
    range: 200,
    attackSpeed: 1200,
    knockback: 10,
  },
} as const;
