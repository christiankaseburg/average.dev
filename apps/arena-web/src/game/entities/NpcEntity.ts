import Phaser from 'phaser';
import type { NpcSnapshot, NpcAction } from '@average.dev/arena-shared';
import { NpcSprite } from '../sprites/NpcSprite';
import { NPC_REGISTRY } from '../sprites/NpcDefinition';
import type { NpcAnimState } from '../sprites/NpcDefinition';

/**
 * NpcEntity — Phaser.GameObjects.Container composing:
 *   - NpcSprite (the animated character sprite)
 *   - Name tag text (NPC display name in red above the sprite)
 *   - Action label text (current server action, shown for debug clarity)
 *
 * ## Server-driven animation (Option B)
 *
 * The server sends a high-level `action` string ('idle', 'walking', 'attacking',
 * 'hurt', 'dead'). The client maps this to the specific animation to play:
 *
 *   idle      → idle loop
 *   walking   → walk loop
 *   attacking → attack1 OR attack2 (chosen randomly when action first changes to
 *               'attacking'; held until the action changes again, for visual variety)
 *   hurt      → hurt (plays once)
 *   dead      → death (plays once, entity freezes)
 *
 * Call updateFromServer(snapshot) on every 'npcUpdate' event from StateHandler.
 *
 * When AI is wired up, the server will change `action` as the NPC's state machine
 * transitions, and this class will react automatically.
 */
export class NpcEntity extends Phaser.GameObjects.Container {
  private readonly sprite: NpcSprite;
  private readonly stateLabel: Phaser.GameObjects.Text;
  private readonly nameTag:    Phaser.GameObjects.Text;

  private currentAction: NpcAction | null = null;
  /** Which attack animation this NPC will use (chosen randomly, fixed per 'attacking' phase) */
  private attackChoice: NpcAnimState = 'attack1';
  private isDead = false;

  constructor(scene: Phaser.Scene, x: number, y: number, npcType: string) {
    super(scene, x, y);

    const definition = NPC_REGISTRY[npcType];
    if (!definition) {
      throw new Error(
        `[NpcEntity] Unknown NPC type: "${npcType}". ` +
        `Registered: ${Object.keys(NPC_REGISTRY).join(', ')}`
      );
    }

    // ── Sprite ──────────────────────────────────────────────────────────────
    this.sprite = new NpcSprite(scene, 0, 0, definition);
    this.sprite.setOrigin(0.5, 0.5);

    // ── Name tag ────────────────────────────────────────────────────────────
    this.nameTag = scene.add
      .text(0, -80, definition.displayName, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        color: '#ff6666',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1);

    // ── Action label (debug) ─────────────────────────────────────────────────
    this.stateLabel = scene.add
      .text(0, -62, '💤 idle', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
        backgroundColor: '#00000099',
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5, 1);

    // ── Assemble container ──────────────────────────────────────────────────
    this.add([this.sprite, this.nameTag, this.stateLabel]);
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    this.setDepth(10);

    // Start idle immediately — server will override via updateFromServer()
    this.applyAction('idle');
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Called by GameScene on every 'npcUpdate' event from StateHandler.
   * Updates position and plays the appropriate animation for the server's action.
   *
   * Position is snapped directly (no client-side prediction for NPCs).
   * TODO: add lerp interpolation here once NPCs have movement AI.
   */
  public updateFromServer(snapshot: NpcSnapshot): void {
    if (this.isDead) return;

    // Snap to server position
    this.x = snapshot.x;
    this.y = snapshot.y;

    // Only update animation when the action actually changes
    const newAction = snapshot.action as NpcAction;
    if (newAction !== this.currentAction) {
      this.applyAction(newAction);
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Maps server NpcAction → NpcAnimState and plays it on the sprite.
   * For 'attacking', randomly picks attack1 or attack2 (if the NPC has both).
   */
  private applyAction(action: NpcAction): void {
    this.currentAction = action;
    this.updateLabel(action);

    switch (action) {
      case 'idle':
        this.sprite.playState('idle');
        break;

      case 'walking':
        this.sprite.playState('walk');
        break;

      case 'attacking': {
        // Pick attack variation randomly — stays fixed for this attack phase
        // so the animation doesn't reset on every tick.
        const hasAttack2 = this.sprite.hasState('attack2');
        this.attackChoice = (hasAttack2 && Math.random() < 0.5) ? 'attack2' : 'attack1';
        this.sprite.playState(this.attackChoice);
        break;
      }

      case 'hurt':
        this.sprite.playState('hurt');
        break;

      case 'dead':
        this.isDead = true;
        this.sprite.playState('death', () => {
          // Freeze on the last death frame after animation completes
          this.sprite.anims.stop();
        });
        break;
    }
  }

  private updateLabel(action: NpcAction): void {
    const labels: Record<NpcAction, string> = {
      idle:      '💤 idle',
      walking:   '🚶 walking',
      attacking: '⚔️ attacking',
      hurt:      '💥 hurt',
      dead:      '💀 dead',
    };
    this.stateLabel.setText(labels[action] ?? action);
  }

  /** Prevent queued callbacks from firing after destruction. */
  public destroy(fromScene?: boolean): void {
    this.isDead = true;
    super.destroy(fromScene);
  }
}
