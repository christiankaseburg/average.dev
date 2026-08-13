export type GamePhase = 'waiting' | 'countdown' | 'playing' | 'ended';

/** Equipment slot identifiers for the character equipment system. */
export type EquipmentSlot =
  | 'weapon'
  | 'shield'
  | 'helm'
  | 'top'
  | 'legs'
  | 'belt'
  | 'boots'
  | 'cape'
  | 'accessory';

export interface PlayerSnapshot {
  sessionId: string;
  name: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  health: number;
  maxHealth: number;
  weapon: string;
  shield: string;
  helm: string;
  top: string;
  legs: string;
  belt: string;
  boots: string;
  cape: string;
  accessory: string;
  kills: number;
  isAlive: boolean;
  lastProcessedInputSeq: number;
  bodyType: string;
  hairStyle: string;
  deviceType: string;
}

/** Zone snapshot for rendering. Operates on the XZ ground plane. */
export interface ZoneSnapshot {
  currentCenterX: number;
  currentCenterZ: number;
  currentRadius: number;
  targetCenterX: number;
  targetCenterZ: number;
  targetRadius: number;
  damagePerSecond: number;
  phase: number;
}

export interface ItemSnapshot {
  id: string;
  itemType: string;
  x: number;
  y: number;
  z: number;
  isPickedUp: boolean;
}

export interface PlayerAttackedEvent {
  sessionId: string;
  weapon: string;
}

export interface PlayerHitEvent {
  targetId: string;
  attackerId: string;
  damage: number;
  killed: boolean;
}

export interface ArenaRoomMetadata {
  roomCode: string;
  matchMode: string;
  isPrivate: boolean;
}

export type GameEventCallback = (event: string, data: PlayerAttackedEvent | PlayerHitEvent) => void;
