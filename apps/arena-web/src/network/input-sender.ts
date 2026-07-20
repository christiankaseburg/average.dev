import { Room } from '@colyseus/sdk';
import type { InputCommand, PlayerInput } from '@average.dev/arena-shared';
import { TICK_INTERVAL_MS } from '@average.dev/arena-shared';

export type { InputCommand, PlayerInput };

export class InputSender {
  private room: Room;
  private seq = 0;
  private lastSendTime = 0;

  constructor(room: Room) {
    this.room = room;
  }

  /**
   * Sends a player input command to the server.
   * Throttled to TICK_RATE Hz except when attack or interact is pressed
   * (those are always sent immediately to avoid dropped actions).
   * @returns The sequence number assigned to this input, or null if throttled.
   */
  public sendInput(command: PlayerInput): number | null {
    const now = Date.now();

    if (
      now - this.lastSendTime < TICK_INTERVAL_MS &&
      !command.attack &&
      !command.interact
    ) {
      return null;
    }

    this.seq++;
    const fullCommand: InputCommand = { ...command, seq: this.seq };
    this.room.send('input', fullCommand);
    this.lastSendTime = now;
    return this.seq;
  }
}
