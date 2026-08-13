import { ZoneState } from '../schemas/zone-state';
import { PlayerState } from '../schemas/player-state';
import { lerp, randomInCircleXZ } from '../utils/math';

export const ZONE_PHASES = [
  { radiusPercent: 1.0, duration: 30000, dps: 0 },
  { radiusPercent: 0.75, duration: 60000, dps: 5 },
  { radiusPercent: 0.50, duration: 45000, dps: 10 },
  { radiusPercent: 0.25, duration: 30000, dps: 20 },
  { radiusPercent: 0.05, duration: 20000, dps: 40 }
];

export function advanceZonePhase(zone: ZoneState, gameTime: number, worldSize: number) {
  zone.phase++;
  if (zone.phase >= ZONE_PHASES.length) return;

  const phaseConfig = ZONE_PHASES[zone.phase];
  
  zone.currentCenterX = zone.targetCenterX;
  zone.currentCenterZ = zone.targetCenterZ;
  zone.currentRadius = zone.targetRadius;

  zone.targetRadius = (worldSize / 2) * phaseConfig.radiusPercent;
  const newCenter = randomInCircleXZ(
    { x: zone.currentCenterX, z: zone.currentCenterZ },
    zone.currentRadius - zone.targetRadius
  );
  
  zone.targetCenterX = newCenter.x;
  zone.targetCenterZ = newCenter.z;
  
  zone.shrinkStartTime = gameTime;
  zone.shrinkDuration = phaseConfig.duration;
  zone.damagePerSecond = phaseConfig.dps;
}

export function updateZone(zone: ZoneState, gameTime: number, worldSize: number) {
  if (zone.phase >= ZONE_PHASES.length) return;
  
  const elapsed = gameTime - zone.shrinkStartTime;
  
  if (elapsed >= zone.shrinkDuration) {
    advanceZonePhase(zone, gameTime, worldSize);
  } else {
    const t = elapsed / zone.shrinkDuration;
    zone.currentRadius = lerp(zone.currentRadius, zone.targetRadius, t);
    zone.currentCenterX = lerp(zone.currentCenterX, zone.targetCenterX, t);
    zone.currentCenterZ = lerp(zone.currentCenterZ, zone.targetCenterZ, t);
  }
}

export function applyZoneDamage(players: Map<string, PlayerState>, zone: ZoneState, deltaTime: number) {
  if (zone.damagePerSecond === 0) return;
  
  const damagePerTick = zone.damagePerSecond * (deltaTime / 1000);
  const radiusSq = zone.currentRadius * zone.currentRadius;

  for (const player of Array.from(players.values())) {
    if (!player.isAlive) continue;

    const dx = player.x - zone.currentCenterX;
    const dz = player.z - zone.currentCenterZ;
    
    if (dx * dx + dz * dz > radiusSq) {
      player.health = Math.max(0, player.health - damagePerTick);
      if (player.health === 0) {
        player.isAlive = false;
      }
    }
  }
}
