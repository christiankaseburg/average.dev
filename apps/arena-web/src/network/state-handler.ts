import { Room } from '@colyseus/sdk';
import Phaser from 'phaser';
import type {
  PlayerSnapshot,
  ItemSnapshot,
  ZoneSnapshot,
  NpcSnapshot,
  PlayerAttackedEvent,
  PlayerHitEvent,
  GamePhase,
} from '@average.dev/arena-shared';

/**
 * Loose interface for the Colyseus-decoded plain state object.
 * The Colyseus 0.17 client SDK decodes state as plain JS Maps/objects
 * (not typed MapSchema instances) when no rootSchema is provided to joinOrCreate.
 */
interface RawGameState {
  players?: Map<string, PlayerSnapshot>;
  items?: Map<string, ItemSnapshot>;
  npcs?: Map<string, NpcSnapshot>;
  zone?: ZoneSnapshot;
  phase?: GamePhase;
  aliveCount?: number;
  gameTime?: number;
  winnerId?: string;
}

/**
 * StateHandler bridges the Colyseus server state to the Phaser game scene.
 *
 * ## Why onStateChange instead of onAdd/onChange/onRemove?
 *
 * The Colyseus 0.17 *client* SDK decodes state as plain JavaScript Maps when no
 * server-side schema class is registered on the client. Plain Maps do not expose
 * the `onAdd`/`onChange`/`onRemove` delta-patch callbacks — those only exist on
 * `MapSchema` instances (server side). So we use `room.onStateChange`, which fires
 * on every patch, and manually diff the state to emit the correct events.
 *
 * Extends Phaser.Events.EventEmitter so game scenes can subscribe with .on()/.off().
 */
export class StateHandler extends Phaser.Events.EventEmitter {
  private readonly room: Room;

  // Track which entities we know about so we can detect adds and removes.
  private readonly knownPlayers = new Set<string>();
  private readonly knownItems   = new Set<string>();
  private readonly knownNpcs    = new Set<string>();

  constructor(room: Room) {
    super();
    this.room = room;
    this.setupListeners();
  }

  private setupListeners() {
    this.room.onStateChange((state: RawGameState) => {
      // ── Players ────────────────────────────────────────────────────────────
      if (state.players) {
        const currentPlayers = new Set<string>();

        state.players.forEach((player: PlayerSnapshot, sessionId: string) => {
          currentPlayers.add(sessionId);

          if (!this.knownPlayers.has(sessionId)) {
            this.knownPlayers.add(sessionId);
            this.emit('playerJoin', sessionId, player);
          } else {
            this.emit('playerUpdate', sessionId, player);
          }
        });

        for (const sessionId of this.knownPlayers) {
          if (!currentPlayers.has(sessionId)) {
            this.knownPlayers.delete(sessionId);
            this.emit('playerLeave', sessionId);
          }
        }
      }

      // ── Items ──────────────────────────────────────────────────────────────
      if (state.items) {
        const currentItems = new Set<string>();

        state.items.forEach((item: ItemSnapshot, id: string) => {
          currentItems.add(id);

          if (!this.knownItems.has(id)) {
            this.knownItems.add(id);
            this.emit('itemUpdate', id, item);
          } else {
            this.emit('itemUpdate', id, item);
          }
        });

        for (const id of this.knownItems) {
          if (!currentItems.has(id)) {
            this.knownItems.delete(id);
            this.emit('itemRemove', id);
          }
        }
      }

      // ── NPCs ───────────────────────────────────────────────────────────────
      if (state.npcs) {
        const currentNpcs = new Set<string>();

        state.npcs.forEach((npc: NpcSnapshot, id: string) => {
          currentNpcs.add(id);

          if (!this.knownNpcs.has(id)) {
            // NPC spawned (or first state patch after joining)
            this.knownNpcs.add(id);
            this.emit('npcAdd', id, npc);
          } else {
            // NPC state updated (position, action, health changed)
            this.emit('npcUpdate', id, npc);
          }
        });

        // Detect despawned NPCs (killed, removed by server)
        for (const id of this.knownNpcs) {
          if (!currentNpcs.has(id)) {
            this.knownNpcs.delete(id);
            this.emit('npcRemove', id);
          }
        }
      }

      // ── Zone ───────────────────────────────────────────────────────────────
      if (state.zone) {
        this.emit('zoneUpdate', state.zone as ZoneSnapshot);
      }

      // ── Game-level scalars ─────────────────────────────────────────────────
      if (state.phase !== undefined) {
        this.emit('gamePhaseChange', state.phase as GamePhase);
      }
      if (state.aliveCount !== undefined) {
        this.emit('aliveCountChange', state.aliveCount as number);
      }
    });

    // ── Combat broadcast messages ──────────────────────────────────────────
    // These use the WebSocket message bus (not schema state), so they are safe
    // to register immediately without waiting for any state patch.
    this.room.onMessage('player_attacked', (data: PlayerAttackedEvent) => {
      this.emit('playerAttacked', data);
    });

    this.room.onMessage('player_hit', (data: PlayerHitEvent) => {
      this.emit('playerHit', data);
    });
  }

  public getRoom(): Room {
    return this.room;
  }
}
