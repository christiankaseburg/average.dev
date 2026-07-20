import { Schema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
  @type("string") sessionId!: string;
  @type("string") name!: string;
  
  @type("float32") x!: number;
  @type("float32") y!: number;
  @type("string") facing!: string;
  
  @type("uint8") health!: number;
  @type("uint8") maxHealth!: number;
  
  @type("string") weapon!: string;
  @type("string") armor!: string;
  
  @type("uint8") kills!: number;
  @type("boolean") isAlive!: boolean;
  @type("uint32") lastProcessedInputSeq!: number;
  
  @type("string") bodyType!: string;
  @type("string") hairStyle!: string;
  @type("string") deviceType!: string;

  // Server-only (NOT synced)
  lastAttackTime = 0;
}
