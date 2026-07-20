import { Room, Client } from 'colyseus';
import { ArenaRoomOptions } from './types';

export class LobbyRoom extends Room {
  onCreate(options: ArenaRoomOptions) {
    console.log("LobbyRoom created!", options);
  }

  onJoin(client: Client, options: ArenaRoomOptions) {
    console.log(client.sessionId, "joined lobby!");
  }

  onLeave(client: Client, code?: number) {
    console.log(client.sessionId, "left lobby!");
  }

  onDispose() {
    console.log("LobbyRoom disposing...");
  }
}
