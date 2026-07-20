import { PlayerState } from '../schemas/player-state';
import { WEAPONS } from '../config/weapons';
import { distanceSquared } from '../utils/math';

export interface CombatResult {
  attackerId: string;
  targetId: string;
  damage: number;
  killed: boolean;
}

export function processAttack(
  attacker: PlayerState, 
  allPlayers: Map<string, PlayerState>, 
  currentTime: number
): CombatResult[] {
  if (!attacker.isAlive) return [];

  const weapon = WEAPONS[attacker.weapon];
  if (!weapon) return [];

  // Check cooldown
  if (currentTime - attacker.lastAttackTime < weapon.attackSpeed) {
    return [];
  }

  attacker.lastAttackTime = currentTime;
  const results: CombatResult[] = [];
  const rangeSq = weapon.range * weapon.range;

  for (const [id, target] of allPlayers.entries()) {
    if (id === attacker.sessionId || !target.isAlive) continue;

    // Distance check
    if (distanceSquared(attacker, target) <= rangeSq) {
      // Facing check (simple: must be in 180 deg arc)
      let isFacing = false;
      const dx = target.x - attacker.x;
      const dy = target.y - attacker.y;
      
      switch (attacker.facing) {
        case "up": isFacing = dy < 0; break;
        case "down": isFacing = dy > 0; break;
        case "left": isFacing = dx < 0; break;
        case "right": isFacing = dx > 0; break;
      }

      if (isFacing) {
        target.health = Math.max(0, target.health - weapon.damage);
        const killed = target.health === 0;
        if (killed) {
          target.isAlive = false;
          attacker.kills++;
        }
        results.push({
          attackerId: attacker.sessionId,
          targetId: id,
          damage: weapon.damage,
          killed
        });
      }
    }
  }

  return results;
}
