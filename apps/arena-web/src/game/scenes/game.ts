import Phaser from 'phaser';
import { PlayerEntity } from '../entities/player';
import { RemotePlayerEntity } from '../entities/remote-player';
import { NpcEntity } from '../entities/NpcEntity';
import { InputSystem } from '../systems/input';
import { setupCamera } from '../systems/camera';
import { ZoneRenderer } from '../systems/zone-renderer';
import { StateHandler } from '../../network/state-handler';
import { InputSender } from '../../network/input-sender';
import { detectDeviceType } from '../../network/client';
import { MAP_WIDTH, MAP_HEIGHT } from '@average.dev/arena-shared';
import type {
  PlayerSnapshot,
  ItemSnapshot,
  ZoneSnapshot,
  NpcSnapshot,
  PlayerAttackedEvent,
  PlayerHitEvent,
} from '@average.dev/arena-shared';

export class GameScene extends Phaser.Scene {
  private localPlayer!: PlayerEntity;
  private remotePlayers = new Map<string, RemotePlayerEntity>();
  private items = new Map<string, Phaser.GameObjects.Sprite>();
  private npcs = new Map<string, NpcEntity>();

  
  private inputSystem!: InputSystem;
  private inputSender!: InputSender;
  private stateHandler!: StateHandler;
  
  private zoneRenderer!: ZoneRenderer;
  
  private isMobile = false;

  // Map dimensions from shared constants
  private readonly mapWidth = MAP_WIDTH;
  private readonly mapHeight = MAP_HEIGHT;

  constructor() {
    super('GameScene');
  }

  init(data: { stateHandler: StateHandler }) {
    // Data passed from React when starting the scene
    this.stateHandler = data.stateHandler;
    this.inputSender = new InputSender(this.stateHandler.getRoom());
  }

  create() {
    const room = this.stateHandler.getRoom();
    const isSandbox = room.name === 'sandbox';

    if (isSandbox) {
      // Draw structural grid for sandbox
      this.add.grid(
        0, 0, 
        this.mapWidth * 2, this.mapHeight * 2, 
        32, 32, 
        0x16162a, 1, // cell color
        0x333344, 0.5 // line color
      ).setOrigin(0, 0).setDepth(-10);
    } else {
      // Draw simple map background
      this.add.tileSprite(0, 0, this.mapWidth, this.mapHeight, 'grass-tile').setOrigin(0, 0).setDepth(-10);
    }

    const isMobile = detectDeviceType() === 'mobile';
    this.isMobile = isMobile;
    this.inputSystem = new InputSystem(this, isMobile);
    
    // Only render zone if we are not in sandbox
    if (!isSandbox) {
      this.zoneRenderer = new ZoneRenderer(this, this.mapWidth, this.mapHeight);
    }

    this.setupNetworkListeners();
    
    // Bounds for everything
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
  }

  private addPlayer(sessionId: string, playerState: PlayerSnapshot) {

    const room = this.stateHandler.getRoom();
    if (sessionId === room.sessionId) {
      if (!this.localPlayer) {
        this.localPlayer = new PlayerEntity(this, playerState);
        setupCamera(this, this.localPlayer, this.mapWidth, this.mapHeight);
      }
    } else {
      if (!this.remotePlayers.has(sessionId)) {
        const remote = new RemotePlayerEntity(this, playerState);
        this.remotePlayers.set(sessionId, remote);
      }
    }
  }

  private setupNetworkListeners() {
    const room = this.stateHandler.getRoom();
    
    // Process players that might have already been added to the Colyseus state
    // before Phaser had a chance to boot up and attach listeners.
    if (room.state.players) {
      room.state.players.forEach((playerState: PlayerSnapshot, sessionId: string) => {
        this.addPlayer(sessionId, playerState);
      });
    }
    
    // Process items that might have already been added
    if (room.state.items) {
      room.state.items.forEach((itemState: ItemSnapshot, id: string) => {
        if (!itemState.isPickedUp) {
           let spriteKey = itemState.itemType;
           if (itemState.itemType !== 'chest' && itemState.itemType !== 'health_potion') {
              spriteKey = itemState.itemType === 'iron_chest' ? 'armor_iron' : `weapon_${itemState.itemType}`;
           }
           const sprite = this.add.sprite(itemState.x, itemState.y, spriteKey);
           sprite.setDepth(5);
           this.items.set(id, sprite);
        }
      });
    }
    
    // ── Bootstrap: process NPCs already in state when we join ─────────────
    if (room.state.npcs) {
      room.state.npcs.forEach((npcState: NpcSnapshot, id: string) => {
        const npc = new NpcEntity(this, npcState.x, npcState.y, npcState.type);
        this.npcs.set(id, npc);
      });
    }

    const onPlayerJoin = (sessionId: string, playerState: PlayerSnapshot) => this.addPlayer(sessionId, playerState);

    const onPlayerLeave = (sessionId: string) => {
      const remote = this.remotePlayers.get(sessionId);
      if (remote) {
        remote.destroy();
        this.remotePlayers.delete(sessionId);
      }
    };
    
    this.stateHandler.on('playerJoin', onPlayerJoin);
    this.stateHandler.on('playerLeave', onPlayerLeave);

    const onPlayerUpdate = (sessionId: string, playerState: PlayerSnapshot) => {
      if (sessionId === room.sessionId) {
        if (this.localPlayer) {
           this.localPlayer.reconcile(playerState.x, playerState.y, playerState.lastProcessedInputSeq || 0);
           this.localPlayer.updateState(playerState.health, playerState.weapon, playerState.armor);
        }
      } else {
        const remote = this.remotePlayers.get(sessionId);
        if (remote) {
          remote.setTargetPosition(playerState.x, playerState.y);
          remote.updateState(playerState.health, playerState.weapon, playerState.armor, playerState.facing);
        }
      }
    };
    this.stateHandler.on('playerUpdate', onPlayerUpdate);

    const onZoneUpdate = (zoneState: ZoneSnapshot) => {
      // In a real app we'd lerp this in update(), but for now just snap to server's current
      if (this.zoneRenderer) {
        this.zoneRenderer.update(zoneState.currentCenterX, zoneState.currentCenterY, zoneState.currentRadius);
      }
    };
    this.stateHandler.on('zoneUpdate', onZoneUpdate);

    const onItemUpdate = (id: string, itemState: ItemSnapshot) => {
      if (itemState.isPickedUp) {
         this.removeItem(id);
      } else {
         if (!this.items.has(id)) {
            let spriteKey = itemState.itemType;
            if (itemState.itemType !== 'chest' && itemState.itemType !== 'health_potion') {
               // Armors and weapons have prefixes in our boot scene
               spriteKey = itemState.itemType === 'iron_chest' ? 'armor_iron' : `weapon_${itemState.itemType}`;
            }
            const sprite = this.add.sprite(itemState.x, itemState.y, spriteKey);
            sprite.setDepth(5); // Render above map, below player
            this.items.set(id, sprite);
         }
      }
    };
    this.stateHandler.on('itemUpdate', onItemUpdate);
    
    const onItemRemove = (id: string) => {
       this.removeItem(id);
    };
    this.stateHandler.on('itemRemove', onItemRemove);
    
    const onPlayerAttacked = (data: PlayerAttackedEvent) => {
       const sessionId = data.sessionId;
       // If it's the local player, we already played it optimistically
       if (sessionId !== room.sessionId) {
          const remote = this.remotePlayers.get(sessionId);
          if (remote) remote.playAttackAnim();
       }
    };
    this.stateHandler.on('playerAttacked', onPlayerAttacked);
    
    const onPlayerHit = (data: PlayerHitEvent) => {
       const targetId = data.targetId;
       
       if (targetId === room.sessionId && this.localPlayer) {
          this.localPlayer.playHitAnim();
       } else {
          const remote = this.remotePlayers.get(targetId);
          if (remote) remote.playHitAnim();
       }
       
       // Optional: Spawn floating damage text (can be added later)
    };
    this.stateHandler.on('playerHit', onPlayerHit);

    // ── NPC listeners ──────────────────────────────────────────────────────
    const onNpcAdd = (id: string, npcState: NpcSnapshot) => {
      if (!this.npcs.has(id)) {
        const npc = new NpcEntity(this, npcState.x, npcState.y, npcState.type);
        this.npcs.set(id, npc);
      }
    };

    const onNpcUpdate = (id: string, npcState: NpcSnapshot) => {
      const npc = this.npcs.get(id);
      if (npc) {
        npc.updateFromServer(npcState);
      }
    };

    const onNpcRemove = (id: string) => {
      const npc = this.npcs.get(id);
      if (npc) {
        npc.destroy();
        this.npcs.delete(id);
      }
    };

    this.stateHandler.on('npcAdd',    onNpcAdd);
    this.stateHandler.on('npcUpdate', onNpcUpdate);
    this.stateHandler.on('npcRemove', onNpcRemove);
    // ──────────────────────────────────────────────────────────────────────

    // Cleanup listeners on scene destruction (crucial for React StrictMode double-mounting)
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
       this.stateHandler.off('playerJoin', onPlayerJoin);
       this.stateHandler.off('playerLeave', onPlayerLeave);
       this.stateHandler.off('playerUpdate', onPlayerUpdate);
       this.stateHandler.off('zoneUpdate', onZoneUpdate);
       this.stateHandler.off('itemUpdate', onItemUpdate);
       this.stateHandler.off('itemRemove', onItemRemove);
       this.stateHandler.off('playerAttacked', onPlayerAttacked);
       this.stateHandler.off('playerHit', onPlayerHit);
       this.stateHandler.off('npcAdd',    onNpcAdd);
       this.stateHandler.off('npcUpdate', onNpcUpdate);
       this.stateHandler.off('npcRemove', onNpcRemove);
    });
  }
  
  private removeItem(id: string) {
     const sprite = this.items.get(id);
     if (sprite) {
        sprite.destroy();
        this.items.delete(id);
     }
  }

  update(time: number, delta: number) {
    if (this.localPlayer) {
      // Input
      const cmd = this.inputSystem.getCommand();
      
      // Calculate facing based on mouse if attacking
      if (cmd.attack && !this.isMobile) {
         const pointer = this.input.activePointer;
         // Convert screen pointer coordinates to world coordinates
         const worldX = this.cameras.main.scrollX + pointer.x;
         const worldY = this.cameras.main.scrollY + pointer.y;
         
         const dx = worldX - this.localPlayer.x;
         const dy = worldY - this.localPlayer.y;
         
         if (Math.abs(dx) > Math.abs(dy)) {
            cmd.facing = dx > 0 ? 'right' : 'left';
         } else {
            cmd.facing = dy > 0 ? 'down' : 'up';
         }
         
         // Immediately set facing for instant visual feedback on attack swing
         this.localPlayer.setFacing(cmd.facing);
      }
      
      // Enforce weapon cooldown client-side — only animate (and tell the server)
      // if the cooldown has actually expired. This keeps animation in sync with
      // what the server will accept.
      if (cmd.attack && !this.localPlayer.tryPlayAttackAnim(time)) {
        cmd.attack = false; // On cooldown — suppress the server message
      }
      
      // Client-side prediction
      this.localPlayer.applyClientPrediction(cmd.dx, cmd.dy, delta);
      
      // Send to server
      const sentSeq = this.inputSender.sendInput(cmd);
      if (sentSeq !== null) {
         this.localPlayer.recordPosition(sentSeq);
      }
    }

    // Interpolate remotes
    this.remotePlayers.forEach(remote => {
      remote.interpolate(delta);
    });
  }
}
