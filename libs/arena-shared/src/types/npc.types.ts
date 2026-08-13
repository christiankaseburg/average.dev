export type NpcAction = 'idle' | 'walking' | 'attacking' | 'hurt' | 'dead';

export interface NpcSnapshot {
  id: string;
  type: string;
  x: number;
  y: number;
  z: number;
  health: number;
  maxHealth: number;
  action: NpcAction;
}

export interface NpcHitEvent {
  npcId: string;
  attackerId: string;
  damage: number;
  killed: boolean;
}
