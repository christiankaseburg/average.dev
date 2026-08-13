/**
 * Weapon definitions shared between arena-api (for damage/range logic)
 * and arena-web (for display names, visual feedback, and range indicators).
 *
 * All spatial values (range, knockback) are in 3D world units.
 */

export interface WeaponConfig {
  /** Display name shown in HUD */
  name: string;
  /** Damage dealt per hit */
  damage: number;
  /** Attack range in world units */
  range: number;
  /** Cooldown between attacks in milliseconds */
  attackSpeed: number;
  /** Knockback force applied to hit target in world units */
  knockback: number;
}

export const WEAPONS: Record<string, WeaponConfig> = {
  fists: {
    name: 'Fists',
    damage: 5,
    range: 1.2,
    attackSpeed: 500,
    knockback: 0.3,
  },
  sword: {
    name: 'Sword',
    damage: 15,
    range: 2.0,
    attackSpeed: 800,
    knockback: 0.6,
  },
  dagger: {
    name: 'Dagger',
    damage: 10,
    range: 1.0,
    attackSpeed: 400,
    knockback: 0.15,
  },
  spear: {
    name: 'Spear',
    damage: 12,
    range: 2.0,
    attackSpeed: 1000,
    knockback: 1.0,
  },
  bow: {
    name: 'Bow',
    damage: 20,
    range: 6.0,
    attackSpeed: 1200,
    knockback: 0.3,
  },
} as const;
