import Phaser from 'phaser';
import { NPC_REGISTRY, type NpcAnimState } from '../sprites/NpcDefinition';

// ─── Aseprite JSON types ──────────────────────────────────────────────────────
// Only BootScene needs these — they describe the shape of the exported JSON files.

interface AsepriteFrame {
  frame: { x: number; y: number; w: number; h: number };
  rotated: boolean;
  trimmed: boolean;
  duration: number;
}

interface AsepriteFrameTag {
  name: string;
  from: number;   // index into the ordered frame list
  to: number;
  direction: 'forward' | 'reverse' | 'pingpong';
}

interface AsepriteJson {
  frames: Record<string, AsepriteFrame>;
  meta: {
    frameTags: AsepriteFrameTag[];
  };
}
// ─────────────────────────────────────────────────────────────────────────────

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // ── NPC Sprite Assets ─────────────────────────────────────────────────────
    // Load PNG (sprite sheet) and JSON (Aseprite export) for every registered NPC.
    // Both files live in public/npc/<folder>/ and are fetched by Phaser's loader.
    //
    // FUTURE — selective loading:
    //   When the server tells the client which NPC types are in the current zone,
    //   filter NPC_REGISTRY here and only load those types:
    //
    //     const neededTypes = ['demon_a', 'skeleton']; // from server/zone config
    //     Object.values(NPC_REGISTRY)
    //       .filter(def => neededTypes.includes(def.type))
    //       .forEach(def => { ... });
    //
    Object.values(NPC_REGISTRY).forEach((def) => {
      // PNG loaded as a plain image; promoted to an atlas in create() below.
      this.load.image(`${def.atlasKey}_src`, def.pngPath);
      // JSON fetched and placed in the Phaser JSON cache under this key.
      this.load.json(`${def.atlasKey}_json`, def.jsonPath);
    });
    // ─────────────────────────────────────────────────────────────────────────


    // Generate placeholder graphics instead of loading external images

    // Function to generate body
    const generateBody = (key: string, color: number) => {
      const g = this.add.graphics();
      g.fillStyle(color);
      g.fillCircle(12, 12, 12);
      g.generateTexture(key, 24, 24);
      g.destroy();
    };

    generateBody('body_human_light', 0xffccaa);
    generateBody('body_human_dark', 0x8b5a2b);
    generateBody('body_orc', 0x4caf50);
    generateBody('body_elf', 0xffeebb);

    // Function to generate hair
    const generateHair = (key: string, renderFunc: (g: Phaser.GameObjects.Graphics) => void) => {
      const g = this.add.graphics();
      renderFunc(g);
      g.generateTexture(key, 24, 24);
      g.destroy();
    };

    generateHair('hair_bald', (_g) => { /* intentionally empty — bald has no hair to draw */ });

    generateHair('hair_short_brown', (g) => {
      g.fillStyle(0x5c4033);
      g.fillEllipse(12, 6, 20, 10);
    });
    generateHair('hair_long_blonde', (g) => {
      g.fillStyle(0xffd700);
      g.fillEllipse(12, 6, 20, 10);
      g.fillRect(4, 6, 4, 14);
      g.fillRect(16, 6, 4, 14);
    });
    generateHair('hair_mohawk', (g) => {
      g.fillStyle(0xe06c5c);
      g.fillRect(10, 0, 4, 12);
    });

    // Armors
    const generateArmor = (key: string, color: number) => {
      const g = this.add.graphics();
      g.lineStyle(4, color);
      g.strokeCircle(12, 12, 10);
      g.generateTexture(key, 24, 24);
      g.destroy();
    };
    generateArmor('armor_none', 0x000000); // empty but we won't use the texture if none
    generateArmor('armor_leather', 0x8b4513);
    generateArmor('armor_iron', 0xaaaaaa);

    // Weapons
    const generateWeapon = (key: string, width: number, height: number, color: number) => {
      const g = this.add.graphics();
      g.fillStyle(color);
      g.fillRect(0, 0, width, height);
      g.generateTexture(key, width, height);
      g.destroy();
    };

    // Create an empty texture for fists
    const emptyG = this.add.graphics();
    emptyG.generateTexture('weapon_fists', 1, 1);
    emptyG.destroy();

    generateWeapon('weapon_sword', 12, 36, 0xcccccc);
    generateWeapon('weapon_dagger', 8, 20, 0xaaaaaa);
    generateWeapon('weapon_spear', 8, 48, 0x8b4513); // simple stick
    generateWeapon('weapon_bow', 12, 32, 0x8b4513); // simple block for now

    // Chest
    const chestGraphics = this.add.graphics();
    chestGraphics.fillStyle(0xffd700); // Gold
    chestGraphics.fillRect(0, 0, 20, 16);
    chestGraphics.generateTexture('chest', 20, 16);
    chestGraphics.destroy();

    // Grass tile
    const grassGraphics = this.add.graphics();
    grassGraphics.fillStyle(0x2d4c1e); // Dark green
    grassGraphics.fillRect(0, 0, 32, 32);
    grassGraphics.generateTexture('grass-tile', 32, 32);
    grassGraphics.destroy();

    // Wall tile
    const wallGraphics = this.add.graphics();
    wallGraphics.fillStyle(0x555555); // Dark gray
    wallGraphics.fillRect(0, 0, 32, 32);
    wallGraphics.generateTexture('wall-tile', 32, 32);
    wallGraphics.destroy();
  }

  create() {
    // ── Build NPC Atlas Textures and Register Animations ──────────────────────
    //
    // By the time create() is called, every this.load.image() and this.load.json()
    // from preload() has finished. We now:
    //   1. Retrieve the loaded PNG element and build a real atlas texture
    //      (this registers all frame names e.g. "Demon_A 0.aseprite")
    //   2. Read frameTags from the cached JSON to create named Phaser animations
    //      (e.g. "npc_demon_a_idle", "npc_demon_a_walk", ...)
    //
    // Animations are registered on the GLOBAL AnimationManager (this.anims) and
    // are therefore available in every scene — NpcSprite just calls this.play().
    //
    Object.values(NPC_REGISTRY).forEach((def) => {
      const { atlasKey, animations } = def;

      // ── 1. Build the atlas texture ─────────────────────────────────────────
      const json = this.cache.json.get(`${atlasKey}_json`) as AsepriteJson | null;
      const srcTex = this.textures.get(`${atlasKey}_src`);

      if (!json) {
        console.error(`[BootScene] JSON not in cache for "${atlasKey}" — check pngPath/jsonPath in NPC_REGISTRY`);
        return;
      }
      if (!srcTex || srcTex.key === '__MISSING') {
        console.error(`[BootScene] PNG failed to load for "${atlasKey}" — check pngPath in NPC_REGISTRY`);
        return;
      }

      const imgEl  = srcTex.source[0].image as HTMLImageElement;
      const atlasTex = this.textures.addAtlas(atlasKey, imgEl, json as unknown as object);
      this.textures.remove(`${atlasKey}_src`); // remove the temporary plain-image entry

      if (!atlasTex) {
        console.error(`[BootScene] textures.addAtlas() returned null for "${atlasKey}" — key conflict?`);
        return;
      }

      // ── 2. Register animations ─────────────────────────────────────────────
      // Frame names are in insertion order from the JSON, matching Aseprite's
      // frame index positions (e.g. index 0 = "Demon_A 0.aseprite").
      const frameTags        = json.meta?.frameTags ?? [];
      const orderedFrameNames = Object.keys(json.frames);

      (Object.entries(animations) as [NpcAnimState, string][]).forEach(([state, tagName]) => {
        const animKey = `${atlasKey}_${state}`;
        if (this.anims.exists(animKey)) return; // idempotent

        const tag = frameTags.find((t) => t.name === tagName);
        if (!tag) {
          console.warn(`[BootScene] Aseprite tag "${tagName}" not found for "${atlasKey}". ` +
            `Available: ${frameTags.map((t) => t.name).join(', ')}`);
          return;
        }

        const animFrames: Phaser.Types.Animations.AnimationFrame[] = [];
        let totalDuration = 0;

        for (let i = tag.from; i <= tag.to; i++) {
          const frameName = orderedFrameNames[i];
          if (!frameName) continue;
          const duration = json.frames[frameName]?.duration ?? 100;
          animFrames.push({ key: atlasKey, frame: frameName, duration });
          totalDuration += duration;
        }

        if (animFrames.length === 0) return;

        if (tag.direction === 'reverse') animFrames.reverse();

        // idle and walk loop; all other states play once and fire ANIMATION_COMPLETE
        const loops = state === 'idle' || state === 'walk';

        this.anims.create({
          key:      animKey,
          frames:   animFrames,
          duration: totalDuration,
          repeat:   loops ? -1 : 0,
          yoyo:     tag.direction === 'pingpong',
        });
      });
    });
    // ─────────────────────────────────────────────────────────────────────────

    // All assets and animations are ready. Signal game-canvas.tsx so it can
    // safely start GameScene. Do NOT use Phaser's 'ready' event — that fires
    // when the engine boots (before our assets are loaded).
    this.game.events.emit('boot-complete');
  }
}
