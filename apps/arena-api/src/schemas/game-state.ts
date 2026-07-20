import { Schema, MapSchema, type } from "@colyseus/schema";
import { PlayerState } from "./player-state";
import { ZoneState } from "./zone-state";
import { ItemState } from "./item-state";
import { NpcState } from "./npc-state";

export class GameState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: ItemState }) items = new MapSchema<ItemState>();
  @type({ map: NpcState }) npcs = new MapSchema<NpcState>();
  @type(ZoneState) zone: ZoneState = new ZoneState();
  
  @type("string") phase!: string; // "waiting", "countdown", "playing", "ended"
  @type("uint8") aliveCount!: number;
  @type("uint32") gameTime!: number;
  @type("string") winnerId!: string;
}

