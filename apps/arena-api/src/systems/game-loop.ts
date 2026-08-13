import { GameState } from '../schemas/game-state';
import type { InputCommand, GameEventCallback } from '@average.dev/arena-shared';
import { clampPlayerPosition } from './movement';
import { processAttack } from './combat';
import { updateZone, applyZoneDamage } from './zone';
import { handleInteract } from './loot';

export class GameLoop {
  private hasZone: boolean;
  private onEvent?: GameEventCallback;
  
  constructor(hasZone = true, onEvent?: GameEventCallback) {
    this.hasZone = hasZone;
    this.onEvent = onEvent;
  }

  public tick(
    state: GameState, 
    deltaTime: number, 
    inputs: Map<string, InputCommand>
  ) {
    state.gameTime += deltaTime;

    if (state.phase === 'ended') return;

    // Clamp all player positions to world bounds
    this.tickMovement(state);

    if (state.phase === 'playing') {
      this.tickCombatAndZone(state, deltaTime, inputs);
    } else if (state.phase === 'countdown') {
      if (state.gameTime > 5000) {
        state.phase = 'playing';
        state.zone.shrinkStartTime = state.gameTime;
      }
    }
  }

  private tickMovement(state: GameState) {
    for (const [, player] of state.players.entries()) {
      if (player.isAlive) {
        clampPlayerPosition(player);
      }
    }
  }

  private tickCombatAndZone(
    state: GameState,
    deltaTime: number,
    inputs: Map<string, InputCommand>
  ) {
    let alive = 0;
    let lastAliveId = '';

    for (const [, player] of state.players.entries()) {
      const input = inputs.get(player.sessionId);
      if (input && player.isAlive) {
        if (input.interact) {
          handleInteract(player, state);
          input.interact = false;
        }
        
        if (input.attack) {
          const results = processAttack(player, state.players, state.gameTime);
          
          if (this.onEvent) {
            this.onEvent('player_attacked', {
              sessionId: player.sessionId,
              weapon: player.weapon,
            });
            
            for (const res of results) {
              this.onEvent('player_hit', { 
                targetId: res.targetId, 
                attackerId: res.attackerId,
                damage: res.damage,
                killed: res.killed,
              });
            }
          }
          
          input.attack = false;
        }
      }

      if (player.isAlive) {
        alive++;
        lastAliveId = player.sessionId;
      }
    }

    state.aliveCount = alive;

    if (this.hasZone) {
      updateZone(state.zone, state.gameTime, 20);
      applyZoneDamage(state.players, state.zone, deltaTime);
    }

    if (alive <= 1 && state.players.size > 1) {
      state.phase = 'ended';
      state.winnerId = lastAliveId;
    } else if (alive === 0 && state.players.size > 0) {
      state.phase = 'ended';
      state.winnerId = 'none';
    }
  }
}
