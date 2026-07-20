/**
 * Options passed to ArenaRoom and SandboxRoom onCreate/onJoin.
 * All fields are optional — sensible defaults are applied in the room.
 */
export interface ArenaRoomOptions {
  /** Player display name */
  name?: string;
  /** Device type for matchmaking filter */
  deviceType?: 'desktop' | 'mobile';
  /** Character appearance */
  bodyType?: string;
  hairStyle?: string;
  /** Room configuration (set on create) */
  maxPlayers?: number;
  roomCode?: string;
  matchMode?: string;
  isPrivate?: boolean;
}
