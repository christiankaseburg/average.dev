import { clamp } from './math';
import type { InputCommand, Facing } from '@average.dev/arena-shared';

export type { InputCommand };

export function sanitizeInput(data: unknown): InputCommand {
  const d = data as Record<string, unknown>;
  const facing = typeof d['facing'] === 'string' && ['up', 'down', 'left', 'right'].includes(d['facing'] as string)
    ? (d['facing'] as Facing)
    : undefined;

  return {
    seq: typeof d['seq'] === 'number' ? d['seq'] : 0,
    dx: clamp(typeof d['dx'] === 'number' ? d['dx'] : 0, -1, 1),
    dy: clamp(typeof d['dy'] === 'number' ? d['dy'] : 0, -1, 1),
    attack: Boolean(d['attack']),
    interact: Boolean(d['interact']),
    weaponSlot: typeof d['weaponSlot'] === 'number' ? clamp(d['weaponSlot'], 0, 3) : null,
    facing,
  };
}
