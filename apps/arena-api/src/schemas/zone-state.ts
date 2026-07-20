import { Schema, type } from "@colyseus/schema";

export class ZoneState extends Schema {
  @type("float32") currentCenterX!: number;
  @type("float32") currentCenterY!: number;
  @type("float32") currentRadius!: number;
  
  @type("float32") targetCenterX!: number;
  @type("float32") targetCenterY!: number;
  @type("float32") targetRadius!: number;
  
  @type("uint32") shrinkStartTime!: number;
  @type("uint32") shrinkDuration!: number; // ms
  
  @type("uint8") damagePerSecond!: number;
  @type("uint8") phase!: number;
}
