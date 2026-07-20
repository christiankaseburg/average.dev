import { ZoneState } from '../schemas/zone-state';
import { PlayerState } from '../schemas/player-state';
import { lerp, randomInCircle } from '../utils/math';

export const ZONE_PHASES = [
  { radiusPercent: 1.0, duration: 30000, dps: 0 },   // Warmup
  { radiusPercent: 0.75, duration: 60000, dps: 5 },  // Phase 1
  { radiusPercent: 0.50, duration: 45000, dps: 10 }, // Phase 2
  { radiusPercent: 0.25, duration: 30000, dps: 20 }, // Phase 3
  { radiusPercent: 0.05, duration: 20000, dps: 40 }  // Final
];

export function advanceZonePhase(zone: ZoneState, gameTime: number, mapWidth: number) {
  zone.phase++;
  if (zone.phase >= ZONE_PHASES.length) return;

  const phaseConfig = ZONE_PHASES[zone.phase];
  
  // Set current to previous targets
  zone.currentCenterX = zone.targetCenterX;
  zone.currentCenterY = zone.targetCenterY;
  zone.currentRadius = zone.targetRadius;

  // Set new targets
  zone.targetRadius = (mapWidth / 2) * phaseConfig.radiusPercent;
  const newCenter = randomInCircle(
    { x: zone.currentCenterX, y: zone.currentCenterY }, 
    zone.currentRadius - zone.targetRadius // Center must be inside current circle
  );
  
  zone.targetCenterX = newCenter.x;
  zone.targetCenterY = newCenter.y;
  
  zone.shrinkStartTime = gameTime;
  zone.shrinkDuration = phaseConfig.duration;
  zone.damagePerSecond = phaseConfig.dps;
}

export function updateZone(zone: ZoneState, gameTime: number, mapWidth: number) {
  if (zone.phase >= ZONE_PHASES.length) return;
  
  const elapsed = gameTime - zone.shrinkStartTime;
  
  if (elapsed >= zone.shrinkDuration) {
    // We finished shrinking, wait for next phase or do something
    // For simplicity, auto-advance
    advanceZonePhase(zone, gameTime, mapWidth);
  } else {
    // Lerp radius and center
    const t = elapsed / zone.shrinkDuration;
    zone.currentRadius = lerp(zone.currentRadius, zone.targetRadius, t);
    zone.currentCenterX = lerp(zone.currentCenterX, zone.targetCenterX, t);
    zone.currentCenterY = lerp(zone.currentCenterY, zone.targetCenterY, t);
  }
}

export function applyZoneDamage(players: Map<string, PlayerState>, zone: ZoneState, deltaTime: number) {
  if (zone.damagePerSecond === 0) return;
  
  const damagePerTick = zone.damagePerSecond * (deltaTime / 1000);
  const radiusSq = zone.currentRadius * zone.currentRadius;

  for (const player of Array.from(players.values())) {
    if (!player.isAlive) continue;

    const dx = player.x - zone.currentCenterX;
    const dy = player.y - zone.currentCenterY;
    
    if (dx * dx + dy * dy > radiusSq) {
      player.health = Math.max(0, player.health - damagePerTick);
      if (player.health === 0) {
        player.isAlive = false;
      }
    }
  }
}
