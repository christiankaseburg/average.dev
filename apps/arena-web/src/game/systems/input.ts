import Phaser from 'phaser';
import type { PlayerInput } from '@average.dev/arena-shared';

export type { PlayerInput };

export class InputSystem {
  private scene: Phaser.Scene;
  private keys: Record<string, Phaser.Input.Keyboard.Key>;
  private isMobile: boolean;

  // Virtual joystick state
  private joystickThumb: Phaser.GameObjects.Arc | null = null;
  private joystickBase: Phaser.GameObjects.Arc | null = null;
  private joystickDx = 0;
  private joystickDy = 0;

  // Virtual buttons
  private attackButton: Phaser.GameObjects.Arc | null = null;
  private interactButton: Phaser.GameObjects.Arc | null = null;
  private attackPressed = false;
  private interactPressed = false;

  constructor(scene: Phaser.Scene, isMobile: boolean) {
    this.scene = scene;
    this.isMobile = isMobile;
    this.keys = (this.scene.input.keyboard?.addKeys(
      'W,A,S,D,UP,DOWN,LEFT,RIGHT,E,ONE,TWO,THREE,FOUR',
    ) ?? {}) as Record<string, Phaser.Input.Keyboard.Key>;

    // Mouse click attack for desktop
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isMobile && pointer.primaryDown) {
        this.attackPressed = true;
      }
    });

    if (this.isMobile) {
      this.setupVirtualControls();
    }
  }

  private setupVirtualControls() {
    const { width, height } = this.scene.cameras.main;

    this.joystickBase = this.scene.add
      .circle(100, height - 100, 50, 0x888888, 0.5)
      .setScrollFactor(0)
      .setDepth(1000);

    this.joystickThumb = this.scene.add
      .circle(100, height - 100, 25, 0xcccccc, 0.8)
      .setScrollFactor(0)
      .setDepth(1001)
      .setInteractive({ draggable: true });

    this.scene.input.setDraggable(this.joystickThumb);

    this.joystickThumb.on(
      'drag',
      (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        if (!this.joystickThumb) return;
        const baseX = 100;
        const baseY = height - 100;
        const dx = dragX - baseX;
        const dy = dragY - baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 50;

        if (distance > maxDist) {
          const ratio = maxDist / distance;
          this.joystickThumb.x = baseX + dx * ratio;
          this.joystickThumb.y = baseY + dy * ratio;
          this.joystickDx = (dx * ratio) / maxDist;
          this.joystickDy = (dy * ratio) / maxDist;
        } else {
          this.joystickThumb.x = dragX;
          this.joystickThumb.y = dragY;
          this.joystickDx = dx / maxDist;
          this.joystickDy = dy / maxDist;
        }
      },
    );

    this.joystickThumb.on('dragend', () => {
      if (this.joystickThumb) {
        this.joystickThumb.x = 100;
        this.joystickThumb.y = height - 100;
      }
      this.joystickDx = 0;
      this.joystickDy = 0;
    });

    this.attackButton = this.scene.add
      .circle(width - 100, height - 100, 40, 0xe06c5c, 0.6)
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive();
    this.attackButton.on('pointerdown', () => (this.attackPressed = true));

    this.interactButton = this.scene.add
      .circle(width - 80, height - 200, 30, 0x7c5ce0, 0.6)
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive();
    this.interactButton.on('pointerdown', () => (this.interactPressed = true));
  }

  public getCommand(): PlayerInput {
    let dx = 0;
    let dy = 0;
    let attack = false;
    let interact = false;
    let weaponSlot: number | null = null;

    if (this.isMobile) {
      dx = this.joystickDx;
      dy = this.joystickDy;
      if (this.attackPressed) { attack = true; this.attackPressed = false; }
      if (this.interactPressed) { interact = true; this.interactPressed = false; }
    } else {
      if (this.keys['W']?.isDown || this.keys['UP']?.isDown) dy = -1;
      if (this.keys['S']?.isDown || this.keys['DOWN']?.isDown) dy = 1;
      if (this.keys['A']?.isDown || this.keys['LEFT']?.isDown) dx = -1;
      if (this.keys['D']?.isDown || this.keys['RIGHT']?.isDown) dx = 1;

      if (this.attackPressed) { attack = true; this.attackPressed = false; }
      if (Phaser.Input.Keyboard.JustDown(this.keys['E'])) interact = true;
      if (Phaser.Input.Keyboard.JustDown(this.keys['ONE'])) weaponSlot = 0;
      if (Phaser.Input.Keyboard.JustDown(this.keys['TWO'])) weaponSlot = 1;
      if (Phaser.Input.Keyboard.JustDown(this.keys['THREE'])) weaponSlot = 2;
      if (Phaser.Input.Keyboard.JustDown(this.keys['FOUR'])) weaponSlot = 3;
    }

    // Normalize diagonal movement
    if (!this.isMobile && dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
    }

    return { dx, dy, attack, interact, weaponSlot };
  }
}
