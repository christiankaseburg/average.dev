import Phaser from 'phaser';
import type { NpcDefinition, NpcAnimState } from './NpcDefinition';

/**
 * NpcSprite — Phaser.GameObjects.Sprite that drives animations for one NPC.
 *
 * This class is a pure PRESENTATION layer:
 *   - It does not load assets (BootScene owns that)
 *   - It does not register animations (BootScene registers them globally in create())
 *   - It plays pre-registered animations by namespaced key (e.g. "npc_demon_a_idle")
 *   - It exposes a simple playState() API that NpcEntity calls to drive state transitions
 *
 * Animation key convention: `${atlasKey}_${state}`
 *   e.g. "npc_demon_a_idle", "npc_demon_a_walk", "npc_demon_a_attack1"
 *
 * SPINE 2D MIGRATION PATH:
 *   Replace playState() internals with Spine runtime calls.
 *   NpcEntity only calls playState() — the public API stays the same.
 *
 * NOTE: Never call scene.add.existing(this) here.
 *   NpcSprite is always owned by an NpcEntity container.
 */
export class NpcSprite extends Phaser.GameObjects.Sprite {
  private readonly definition: NpcDefinition;
  private currentState: NpcAnimState | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, definition: NpcDefinition) {
    // Initialise with the atlas key. The texture was registered by BootScene.create().
    super(scene, x, y, definition.atlasKey);

    this.definition = definition;

    if (definition.scale) {
      this.setScale(definition.scale);
    }

    // Show the first frame of the idle animation immediately so the sprite
    // displays something correct before NpcEntity calls playState().
    this.setInitialFrame(scene);
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  /**
   * Sets the sprite to the first frame of the idle animation.
   * Falls back to the first registered animation if idle isn't available.
   */
  private setInitialFrame(scene: Phaser.Scene): void {
    const { atlasKey, animations } = this.definition;

    // Try idle first, then fall back to whichever state appears first in the definition
    const preferredState: NpcAnimState = 'idle';
    const fallbackState = Object.keys(animations)[0] as NpcAnimState | undefined;
    const state = (preferredState in animations ? preferredState : fallbackState);
    if (!state) return;

    const anim = scene.anims.get(`${atlasKey}_${state}`);
    if (anim?.frames[0]) {
      this.setFrame(anim.frames[0].textureFrame as string);
    }
  }

  /** Namespaced Phaser animation key, e.g. "npc_demon_a_idle" */
  private animKey(state: NpcAnimState): string {
    return `${this.definition.atlasKey}_${state}`;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Play a logical animation state.
   *
   * @param state      Logical state (e.g. 'idle', 'attack1')
   * @param onComplete Called when a non-looping animation finishes (not fired for looping states)
   * @returns          true if the animation started, false if it is not registered
   */
  public playState(state: NpcAnimState, onComplete?: () => void): boolean {
    const key = this.animKey(state);

    if (!this.scene.anims.exists(key)) {
      console.warn(`[NpcSprite] Animation "${key}" is not registered.`);
      return false;
    }

    // Don't restart a looping animation already playing the same state
    if (this.currentState === state && this.anims.isPlaying) {
      return true;
    }

    this.currentState = state;
    this.off(Phaser.Animations.Events.ANIMATION_COMPLETE);
    this.play(key);

    if (onComplete) {
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, onComplete);
    }

    return true;
  }

  /** Returns true if the animation for `state` is registered and ready to play. */
  public hasState(state: NpcAnimState): boolean {
    return this.scene.anims.exists(this.animKey(state));
  }

  /** Currently active logical state, or null before the first playState() call. */
  public getState(): NpcAnimState | null {
    return this.currentState;
  }

}
