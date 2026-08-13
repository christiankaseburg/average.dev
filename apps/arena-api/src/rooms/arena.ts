import { Room, Client } from 'colyseus';
import { MapSchema } from '@colyseus/schema';
import { GameState } from '../schemas/game-state';
import { PlayerState } from '../schemas/player-state';
import { ZoneState } from '../schemas/zone-state';
import { ItemState } from '../schemas/item-state';
import { NpcState } from '../schemas/npc-state';
import { GameLoop } from '../systems/game-loop';
import { respawnPlayer } from '../systems/spawn';
import { WORLD_SIZE } from '@average.dev/arena-shared';
import { sanitizeInput, InputCommand } from '../utils/validation';
import { ArenaRoomOptions } from './types';
import { handleAdminSpawn, handleUnequip } from '../systems/loot';

export class ArenaRoom extends Room<{ state: GameState }> {
  private gameLoop!: GameLoop;
  private usedSpawns = new Set<number>();
  private playerInputs = new Map<string, InputCommand>();

  onCreate(options: ArenaRoomOptions) {
    this.maxClients = options.maxPlayers || 20;
    void this.setMetadata({
      roomCode: options.roomCode || "",
      matchMode: options.matchMode || "mixed",
      isPrivate: !!options.isPrivate
    });

    const state = new GameState();
    state.players = new MapSchema<PlayerState>();
    state.items = new MapSchema<ItemState>();
    state.npcs = new MapSchema<NpcState>();
    state.zone = new ZoneState();
    
    state.assign({
      phase: "waiting",
      aliveCount: 0,
      gameTime: 0,
      winnerId: "",
      worldSize: WORLD_SIZE,
    });
    
    state.zone.assign({
      currentCenterX: 0,
      currentCenterZ: 0,
      currentRadius: WORLD_SIZE,
      targetCenterX: 0,
      targetCenterZ: 0,
      targetRadius: WORLD_SIZE,
      shrinkStartTime: 0,
      shrinkDuration: 0,
      damagePerSecond: 0,
      phase: 0
    });

    this.setState(state);

    this.gameLoop = new GameLoop(true, (eventName, data) => {
       this.broadcast(eventName, data);
    });
    
    
    this.state.phase = 'waiting';

    // Handle combat input (attack, interact)
    this.onMessage("input", (client, data) => {
      const sanitized = sanitizeInput(data);
      const existing = this.playerInputs.get(client.sessionId);
      if (existing) {
        sanitized.attack = sanitized.attack || existing.attack;
        sanitized.interact = sanitized.interact || existing.interact;
      }
      this.playerInputs.set(client.sessionId, sanitized);
    });

    // Handle 3D position updates from clients (Rapier physics)
    this.onMessage("position", (client, data: { x: number; y: number; z: number; rotationY?: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !player.isAlive) return;
      if (typeof data.x === 'number') player.x = data.x;
      if (typeof data.y === 'number') player.y = data.y;
      if (typeof data.z === 'number') player.z = data.z;
      if (typeof data.rotationY === 'number') player.rotationY = data.rotationY;
    });

    // Handle admin item spawning
    this.onMessage("admin_spawn", (client, data: { itemType: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      handleAdminSpawn(player, data.itemType, this.state);
    });

    // Handle item unequip/drop
    this.onMessage("unequip", (client, data: { slot: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      handleUnequip(player, data.slot, this.state);
    });

    // 20 Hz tick
    this.setSimulationInterval((deltaTime) => {
      this.gameLoop.tick(this.state, deltaTime, this.playerInputs);
      for (const input of this.playerInputs.values()) {
        input.attack = false;
        input.interact = false;
      }
    }, 50);
  }

  onJoin(client: Client, options: ArenaRoomOptions) {
    console.log(client.sessionId, "joined!");
    const player = new PlayerState();
    player.assign({
      sessionId: client.sessionId,
      name: options.name || "Anonymous",
      deviceType: options.deviceType || "desktop",
      x: 0,
      y: 0,
      z: 0,
      health: 100,
      maxHealth: 100,
      weapon: "fists",
      armor: "none",
      legs: "none",
      equippedHair: "none",
      kills: 0,
      isAlive: true,
      lastProcessedInputSeq: 0,
      bodyType: options.bodyType || "human_light",
      hairStyle: options.hairStyle || "short_brown"
    });
    
    respawnPlayer(player, this.usedSpawns);
    
    this.state.players.set(client.sessionId, player);

    if (this.state.phase === 'waiting' && this.state.players.size >= 2) {
      this.state.phase = 'countdown';
      this.state.gameTime = 0;
    }
  }

  onLeave(client: Client, code?: number) {
    console.log(client.sessionId, "left!");
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.isAlive = false;
    }
    this.playerInputs.delete(client.sessionId);
  }

  onDispose() {
    console.log("Room", this.roomId, "disposing...");
  }
}
