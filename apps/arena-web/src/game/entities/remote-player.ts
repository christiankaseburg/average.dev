import Phaser from 'phaser';
import { lerpPosition } from '../utils/interpolation';
import type { PlayerSnapshot } from '@average.dev/arena-shared';

export class RemotePlayerEntity extends Phaser.GameObjects.Container {
  private bodyLayer: Phaser.GameObjects.Sprite;
  private hairLayer: Phaser.GameObjects.Sprite;
  private armorLayer: Phaser.GameObjects.Sprite;
  private weaponLayer: Phaser.GameObjects.Sprite;
  
  private healthBarFill: Phaser.GameObjects.Rectangle;
  private spriteContainer: Phaser.GameObjects.Container;
  
  private targetX = 0;
  private targetY = 0;
  private facing = 'down';
  private isAttacking = false;
  
  private maxHealth = 100;
  private currentHealth = 100;
  
  private nameText: Phaser.GameObjects.Text;
  private healthBarBg: Phaser.GameObjects.Rectangle;
  
  constructor(scene: Phaser.Scene, playerState: PlayerSnapshot) {
    super(scene, playerState.x, playerState.y);
    
    // Layers
    this.bodyLayer = scene.add.sprite(0, 0, `body_${playerState.bodyType || 'human_light'}`);
    this.hairLayer = scene.add.sprite(0, 0, `hair_${playerState.hairStyle || 'bald'}`);
    this.armorLayer = scene.add.sprite(0, 0, `armor_${playerState.armor || 'none'}`);
    
    // Weapon (offset slightly)
    this.weaponLayer = scene.add.sprite(10, 0, `weapon_${playerState.weapon || 'fists'}`);
    
    this.nameText = scene.add.text(0, -30, playerState.name, {
      fontFamily: 'Inter',
      fontSize: '12px',
      color: '#ffcccc',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    this.healthBarBg = scene.add.rectangle(0, -45, 40, 6, 0x000000).setOrigin(0.5);
    this.healthBarFill = scene.add.rectangle(-20, -45, 40, 6, 0xe06c5c).setOrigin(0, 0.5);
    this.spriteContainer = scene.add.container(0, 0, [this.bodyLayer, this.hairLayer, this.armorLayer, this.weaponLayer]);
    
    this.add([this.spriteContainer, this.nameText, this.healthBarBg, this.healthBarFill]);
    
    this.targetX = playerState.x;
    this.targetY = playerState.y;
    
    scene.add.existing(this);
    this.setDepth(10);
  }
  
  public setTargetPosition(x: number, y: number) {
    this.targetX = x;
    this.targetY = y;
  }
  
  public interpolate(delta: number) {
    // Framerate independent lerp (smoothRate ~15 per second)
    const lerpFactor = 1.0 - Math.exp(-15 * (delta / 1000));
    const newPos = lerpPosition(this, { x: this.targetX, y: this.targetY }, lerpFactor);
    this.x = newPos.x;
    this.y = newPos.y;
  }
  
  public updateState(health: number, weapon: string, armor: string, facing: string) {
    this.facing = facing; // Save for attack anim
    this.spriteContainer.rotation = 0; // Never rotate whole body
    
    if (!this.isAttacking) {
        if (facing === 'right') {
           this.hairLayer.scaleX = 1;
           this.weaponLayer.x = 10;
           this.weaponLayer.y = 0;
           this.weaponLayer.angle = 0;
        } else if (facing === 'left') {
           this.hairLayer.scaleX = -1;
           this.weaponLayer.x = -10;
           this.weaponLayer.y = 0;
           this.weaponLayer.angle = 0;
        } else if (facing === 'up') {
           this.weaponLayer.x = 0;
           this.weaponLayer.y = -10;
           this.weaponLayer.angle = -90;
        } else if (facing === 'down') {
           this.weaponLayer.x = 0;
           this.weaponLayer.y = 10;
           this.weaponLayer.angle = 90;
        }
    }

    if (this.currentHealth !== health) {
      this.currentHealth = health;
      const pct = Math.max(0, health / this.maxHealth);
      this.healthBarFill.width = 40 * pct;
    }
    
    // Dynamically update equipment textures
    if (this.weaponLayer.texture.key !== `weapon_${weapon}`) {
       this.weaponLayer.setTexture(`weapon_${weapon}`);
    }
    if (this.armorLayer.texture.key !== `armor_${armor}`) {
       this.armorLayer.setTexture(`armor_${armor}`);
    }
  }
  
  public playAttackAnim() {
    if (this.isAttacking) return;
    this.isAttacking = true;

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
      }
    });
  }
  
  public playHitAnim() {
    this.scene.tweens.add({
      targets: [this.bodyLayer, this.hairLayer, this.armorLayer],
      tint: 0xff0000,
      duration: 100,
      yoyo: true,
      onComplete: () => {
         this.bodyLayer.clearTint();
         this.hairLayer.clearTint();
         this.armorLayer.clearTint();
      }
    });
  }
}
