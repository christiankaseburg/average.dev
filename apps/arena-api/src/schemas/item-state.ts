import { Schema, type } from "@colyseus/schema";

export class ItemState extends Schema {
  @type("string") id!: string;
  @type("string") itemType!: string; // "chest", "health_potion", "sword" etc
  @type("float32") x!: number;
  @type("float32") y!: number;
  @type("boolean") isPickedUp!: boolean;
}
