import { Schema, type } from "@colyseus/schema";

export class ItemState extends Schema {
  @type("string") id!: string;
  @type("string") itemType!: string;
  @type("float32") x!: number;
  @type("float32") y!: number;
  @type("float32") z!: number;
  @type("boolean") isPickedUp!: boolean;
}
