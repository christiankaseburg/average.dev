import { Room, Client } from 'colyseus';
import { MapSchema } from '@colyseus/schema';
import { GameState } from '../schemas/game-state';
import { PlayerState } from '../schemas/player-state';
import { ZoneState } from '../schemas/zone-state';
import { ItemState } from '../schemas/item-state';
import { NpcState } from '../schemas/npc-state';
import { GameLoop } from '../systems/game-loop';
import { spawnChests } from '../systems/loot';
import { spawnNpcs } from '../systems/npc-spawner';
import { getSpawnPoint, respawnPlayer } from '../systems/spawn';
import { generateCollisionGrid, CollisionGrid } from '../config/map';
import { sanitizeInput, InputCommand } from '../utils/validation';
import { ArenaRoomOptions } from './types';

export class ArenaRoom extends Room<{ state: GameState }> {
  private gameLoop!: GameLoop;
  private collisionGrid!: CollisionGrid;
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
      winnerId: ""
    });
    
    state.zone.assign({
      currentCenterX: 1024,
      currentCenterY: 1024,
      currentRadius: 2000,
      targetCenterX: 1024,
      targetCenterY: 1024,
      targetRadius: 2000,
      shrinkStartTime: 0,
      shrinkDuration: 0,
      damagePerSecond: 0,
      phase: 0
    });

    this.setState(state);
    // Init Game
    this.collisionGrid = generateCollisionGrid();
    this.gameLoop = new GameLoop(this.collisionGrid, true, (eventName, data) => {
       this.broadcast(eventName, data);
    });
    
    spawnChests(this.state);
    spawnNpcs(this.state.npcs);
    
    this.state.phase = 'waiting';


    // Handle Input
    this.onMessage("input", (client, data) => {
      const sanitized = sanitizeInput(data);
      const existing = this.playerInputs.get(client.sessionId);
      if (existing) {
        sanitized.attack = sanitized.attack || existing.attack;
        sanitized.interact = sanitized.interact || existing.interact;
      }
      this.playerInputs.set(client.sessionId, sanitized);
    });

    // 20 Hz tick
    this.setSimulationInterval((deltaTime) => {
      this.gameLoop.tick(this.state, deltaTime, this.playerInputs);
      // Clear one-time actions
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
      facing: "down",
      health: 100,
      maxHealth: 100,
      weapon: "fists",
      armor: "none",
      kills: 0,
      isAlive: true,
      lastProcessedInputSeq: 0,
      bodyType: options.bodyType || "human_light",
      hairStyle: options.hairStyle || "short_brown"
    });
    
    respawnPlayer(player, this.usedSpawns);
    
    this.state.players.set(client.sessionId, player);

    // Auto-start if enough players
    if (this.state.phase === 'waiting' && this.state.players.size >= 2) {
      this.state.phase = 'countdown';
      this.state.gameTime = 0; // reset to 0 for countdown
      // Lock room if we want to prevent late joiners
      // this.lock();
    }
  }

  onLeave(client: Client, code?: number) {
    console.log(client.sessionId, "left!");
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.isAlive = false; // They die if they disconnect
    }
    this.playerInputs.delete(client.sessionId);
    
    // Optional: allow reconnect
    // this.allowReconnection(client, 20);
  }

  onDispose() {
    console.log("Room", this.roomId, "disposing...");
  }
}
