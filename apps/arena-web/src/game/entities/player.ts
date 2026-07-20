import type { PlayerSnapshot } from '@average.dev/arena-shared';
import { MAP_HEIGHT, MAP_WIDTH, PLAYER_SPEED, WEAPONS } from '@average.dev/arena-shared';
import Phaser from 'phaser';

export class PlayerEntity extends Phaser.GameObjects.Container {
  private bodyLayer: Phaser.GameObjects.Sprite;
  private hairLayer: Phaser.GameObjects.Sprite;
  private armorLayer: Phaser.GameObjects.Sprite;
  private weaponLayer: Phaser.GameObjects.Sprite;

  private nameText!: Phaser.GameObjects.Text;
  private healthBarBg!: Phaser.GameObjects.Rectangle;
  private healthBarFill!: Phaser.GameObjects.Rectangle;
  private spriteContainer!: Phaser.GameObjects.Container;

  public serverX = 0;
  public serverY = 0;

  private maxHealth = 100;
  private currentHealth = 100;

  constructor(scene: Phaser.Scene, playerState: PlayerSnapshot) {
    super(scene, playerState.x, playerState.y);

    // Layers
    this.bodyLayer = scene.add.sprite(0, 0, `body_${playerState.bodyType || 'human_light'}`);
    this.hairLayer = scene.add.sprite(0, 0, `hair_${playerState.hairStyle || 'bald'}`);
    this.armorLayer = scene.add.sprite(0, 0, `armor_${playerState.armor || 'none'}`);

    // Weapon (offset slightly)
    this.weaponLayer = scene.add.sprite(10, 0, `weapon_${playerState.weapon || 'fists'}`);

    // Name tag
    this.nameText = scene.add
      .text(0, -30, playerState.name, {
        fontFamily: 'Inter',
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Health bar
    this.healthBarBg = scene.add.rectangle(0, -45, 40, 6, 0x000000).setOrigin(0.5);
    this.healthBarFill = scene.add.rectangle(-20, -45, 40, 6, 0x4caf50).setOrigin(0, 0.5);
    // Group sprites so we can rotate them together without rotating health/name
    this.spriteContainer = scene.add.container(0, 0, [
      this.bodyLayer,
      this.hairLayer,
      this.armorLayer,
      this.weaponLayer,
    ]);

    this.add([this.spriteContainer, this.nameText, this.healthBarBg, this.healthBarFill]);

    this.serverX = playerState.x;
    this.serverY = playerState.y;

    scene.add.existing(this);
    this.setDepth(10);
  }

  private positionHistory = new Map<number, { x: number; y: number }>();

  private lastDx = 0;
  private lastDy = 0;
  private facing = 'down';
  private isAttacking = false;
  private lastClientAttackTime = 0;
  private currentWeapon = 'fists';

  public setFacing(facing: string) {
    this.facing = facing;
    this.updateVisualFacing();
  }

  private updateVisualFacing() {
    if (this.isAttacking) return;
    if (this.facing === 'right') {
      this.hairLayer.scaleX = 1;
      this.weaponLayer.x = 10;
      this.weaponLayer.y = 0;
      this.weaponLayer.angle = 0;
    } else if (this.facing === 'left') {
      this.hairLayer.scaleX = -1;
      this.weaponLayer.x = -10;
      this.weaponLayer.y = 0;
      this.weaponLayer.angle = 0;
    } else if (this.facing === 'up') {
      this.weaponLayer.x = 0;
      this.weaponLayer.y = -10;
      this.weaponLayer.angle = -90;
    } else if (this.facing === 'down') {
      this.weaponLayer.x = 0;
      this.weaponLayer.y = 10;
      this.weaponLayer.angle = 90;
    }
  }

  public applyClientPrediction(dx: number, dy: number, dt: number) {
    this.lastDx = dx;
    this.lastDy = dy;

    if (!this.isAttacking) {
      if (Math.abs(dx) > Math.abs(dy)) {
        this.facing = dx > 0 ? 'right' : 'left';
      } else if (dy !== 0) {
        this.facing = dy > 0 ? 'down' : 'up';
      }
      // Update visual representation (keep character upright, move weapon)
      this.updateVisualFacing();
    }

    this.spriteContainer.rotation = 0; // Never rotate the whole body!

    const dtSeconds = dt / 1000;
    let nextX = this.x + dx * PLAYER_SPEED * dtSeconds;
    let nextY = this.y + dy * PLAYER_SPEED * dtSeconds;

    // Match server border bounds
    if (nextX < 0) nextX = 0;
    if (nextX > MAP_WIDTH) nextX = MAP_WIDTH;
    if (nextY < 0) nextY = 0;
    if (nextY > MAP_HEIGHT) nextY = MAP_HEIGHT;

    this.x = nextX;
    this.y = nextY;
  }

  public recordPosition(seq: number) {
    this.positionHistory.set(seq, { x: this.x, y: this.y });
  }

  public reconcile(serverX: number, serverY: number, lastProcessedSeq: number) {
    this.serverX = serverX;
    this.serverY = serverY;

    // Clean up old history
    for (const seq of this.positionHistory.keys()) {
      if (seq < lastProcessedSeq) {
        this.positionHistory.delete(seq);
      }
    }

    // Find where the client thought it was at the time the server processed this input
    const historicalPos = this.positionHistory.get(lastProcessedSeq);

    if (historicalPos) {
      // The server processed our input. Compare server position with our historical prediction.
      const errorX = serverX - historicalPos.x;
      const errorY = serverY - historicalPos.y;

      const distSq = errorX * errorX + errorY * errorY;

      if (distSq > 0.1) {
        if (distSq > 150 * 150) {
          // Massive desync (e.g. teleport or lag spike) -> snap completely
          this.x = serverX;
          this.y = serverY;
          this.positionHistory.clear();
        } else {
          // Apply the error to our CURRENT position to smoothly correct the drift!
          // We use 0.1 to keep it buttery smooth during movement.
          let correctionX = errorX * 0.1;
          let correctionY = errorY * 0.1;

          // If the player has stopped moving and the error is small, snap to stop sliding
          if (this.lastDx === 0 && this.lastDy === 0 && distSq < 25) {
            correctionX = errorX;
            correctionY = errorY;
          }

          this.x += correctionX;
          this.y += correctionY;

          // Update history to reflect the shift, preventing over-correction on next frame
          historicalPos.x += correctionX;
          historicalPos.y += correctionY;
        }
      }
    } else {
      // No history (or we just joined). Just snap or lerp to server.
      const distSq = (this.x - serverX) ** 2 + (this.y - serverY) ** 2;
      if (distSq > 150 * 150) {
        this.x = serverX;
        this.y = serverY;
      } else {
        this.x += (serverX - this.x) * 0.1;
        this.y += (serverY - this.y) * 0.1;
      }
    }
  }

  public updateState(health: number, weapon: string, armor: string) {
    if (this.currentHealth !== health) {
      this.currentHealth = health;
      const pct = Math.max(0, health / this.maxHealth);
      this.healthBarFill.width = 40 * pct;
      if (pct < 0.3) this.healthBarFill.fillColor = 0xe06c5c;
      else if (pct < 0.6) this.healthBarFill.fillColor = 0xffd700;
      else this.healthBarFill.fillColor = 0x4caf50;
    }

    // Track weapon for client-side cooldown enforcement
    this.currentWeapon = weapon;

    // Dynamically update equipment textures
    if (this.weaponLayer.texture.key !== `weapon_${weapon}`) {
      this.weaponLayer.setTexture(`weapon_${weapon}`);
    }
    if (this.armorLayer.texture.key !== `armor_${armor}`) {
      this.armorLayer.setTexture(`armor_${armor}`);
    }
  }

  /**
   * Attempts to play the attack animation.
   * Enforces the weapon's attackSpeed cooldown client-side to match server logic.
   * @param now - current game time in ms (from Phaser's update time parameter)
   * @returns true if the animation was started, false if still on cooldown
   */
  public tryPlayAttackAnim(now: number): boolean {
    if (this.isAttacking) return false;

    const weapon = WEAPONS[this.currentWeapon] ?? WEAPONS['fists'];
    if (now - this.lastClientAttackTime < weapon.attackSpeed) return false;

    this.lastClientAttackTime = now;
    this.isAttacking = true;

    // A more pronounced slash based on facing
    let angleTo = 90;
    let xOffset = 15;
    let yOffset = 15;

    if (this.facing === 'left') {
      angleTo = -90;
      xOffset = -15;
    } else if (this.facing === 'up') {
      angleTo = 0;
      xOffset = 15;
      yOffset = -15;
    } else if (this.facing === 'down') {
      angleTo = 180;
      xOffset = -15;
      yOffset = 15;
    }

    this.scene.tweens.add({
      targets: this.weaponLayer,
      angle: { from: this.weaponLayer.angle, to: angleTo },
      x: { from: this.weaponLayer.x, to: this.weaponLayer.x + xOffset },
      y: { from: this.weaponLayer.y, to: this.weaponLayer.y + yOffset },
      duration: 80,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        this.isAttacking = false;
      },
    });

    return true;
  }

  public playHitAnim() {
    // Flash red
    this.scene.tweens.add({
      targets: [this.bodyLayer, this.hairLayer, this.armorLayer],
      tint: 0xff0000,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        this.bodyLayer.clearTint();
        this.hairLayer.clearTint();
        this.armorLayer.clearTint();
      },
    });
  }
}
