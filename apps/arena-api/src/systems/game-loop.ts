import { GameState } from '../schemas/game-state';
import type { InputCommand, GameEventCallback } from '@average.dev/arena-shared';
import { MAP_WIDTH } from '@average.dev/arena-shared';
import { processMovement } from './movement';
import { processAttack } from './combat';
import { updateZone, applyZoneDamage } from './zone';
import { handleInteract } from './loot';
import type { CollisionGrid } from '../config/map';

export class GameLoop {
  private collisionGrid: CollisionGrid;
  private hasZone: boolean;
  private onEvent?: GameEventCallback;
  
  constructor(collisionGrid: CollisionGrid, hasZone = true, onEvent?: GameEventCallback) {
    this.collisionGrid = collisionGrid;
    this.hasZone = hasZone;
    this.onEvent = onEvent;
  }

  public tick(
    state: GameState, 
    deltaTime: number, 
    inputs: Map<string, InputCommand>
  ) {
    state.gameTime += deltaTime;

    // Nothing runs after the game ends
    if (state.phase === 'ended') return;

    // Movement always runs in any active phase (waiting, countdown, playing).
    // Without this, the client predicts movement while the server ignores it,
    // causing reconciliation to snap the player back — producing the jitter bug.
    this.tickMovement(state, deltaTime, inputs);

    if (state.phase === 'playing') {
      this.tickCombatAndZone(state, deltaTime, inputs);
    } else if (state.phase === 'countdown') {
      if (state.gameTime > 5000) { // 5 s countdown
        state.phase = 'playing';
        state.zone.shrinkStartTime = state.gameTime;
      }
    }
  }

  /**
   * Processes movement for all alive players.
   * Intentionally runs in all active phases (waiting, countdown, playing) so
   * players can walk around while waiting for the match to begin.
   */
  private tickMovement(
    state: GameState,
    deltaTime: number,
    inputs: Map<string, InputCommand>
  ) {
    for (const [, player] of state.players.entries()) {
      const input = inputs.get(player.sessionId);
      if (input && player.isAlive) {
        processMovement(player, input, this.collisionGrid, deltaTime);
        player.lastProcessedInputSeq = input.seq;
      }
    }
  }

  /**
   * Processes combat (attacks, interactions), zone damage, and win condition.
   * Only runs during the 'playing' phase — combat cannot happen before the
   * match officially starts.
   */
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
          input.interact = false; // consume
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
          
          input.attack = false; // consume
        }
      }

      if (player.isAlive) {
        alive++;
        lastAliveId = player.sessionId;
      }
    }

    state.aliveCount = alive;

    // Zone shrink
    if (this.hasZone) {
      updateZone(state.zone, state.gameTime, MAP_WIDTH);
      applyZoneDamage(state.players, state.zone, deltaTime);
    }

    // Win condition
    if (alive <= 1 && state.players.size > 1) {
      state.phase = 'ended';
      state.winnerId = lastAliveId;
    } else if (alive === 0 && state.players.size > 0) {
      // Everyone died simultaneously
      state.phase = 'ended';
      state.winnerId = 'none';
    }
  }
}
