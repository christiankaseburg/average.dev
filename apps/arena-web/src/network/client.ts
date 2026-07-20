import { Client } from '@colyseus/sdk';
import type { ArenaRoomMetadata } from '@average.dev/arena-shared';

export interface RoomJoinOptions {
  name: string;
  deviceType: 'desktop' | 'mobile';
  matchMode?: string;
  bodyType?: string;
  hairStyle?: string;
  isPrivate?: boolean;
  roomCode?: string;
}

export interface RoomListing {
  roomId: string;
  clients: number;
  maxClients: number;
  metadata: ArenaRoomMetadata;
}

let clientInstance: Client | null = null;

export function getClient(): Client {
  if (!clientInstance) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.DEV
      ? `${window.location.hostname}:2567`
      : window.location.host;
    const url = import.meta.env.DEV
      ? `${protocol}//${host}`
      : `${protocol}//${host}/ws`;
    clientInstance = new Client(url);
  }
  return clientInstance;
}

export function detectDeviceType(): 'desktop' | 'mobile' {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return hasTouch && window.innerWidth <= 1024 ? 'mobile' : 'desktop';
}

export async function joinOrCreateRoom(roomName: string, options: RoomJoinOptions) {
  return getClient().joinOrCreate(roomName, options);
}

export async function joinRoomById(roomId: string, options: RoomJoinOptions) {
  return getClient().joinById(roomId, options);
}

/**
 * Fetch available rooms using the Colyseus 0.17 HTTP API.
 * Colyseus 0.17's ColyseusSDK class does not expose a getAvailableRooms method;
 * room listing is done via the matchmake REST endpoint.
 */
export async function getAvailableRooms(roomName: string): Promise<RoomListing[]> {
  try {
    const httpProtocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const host = import.meta.env.DEV
      ? `${window.location.hostname}:2567`
      : window.location.host;
    const res = await fetch(`${httpProtocol}//${host}/matchmake/${roomName}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { rooms?: RoomListing[] };
    return data.rooms ?? [];
  } catch {
    return [];
  }
}
