import { Schema, type } from "@colyseus/schema";

export class NpcState extends Schema {
  @type("string") id!: string;
  @type("string") type!: string;
  @type("float32") x!: number;
  @type("float32") y!: number;
  @type("float32") z!: number;
  @type("uint8") health!: number;
  @type("uint8") maxHealth!: number;
  @type("string") action!: string;
}
