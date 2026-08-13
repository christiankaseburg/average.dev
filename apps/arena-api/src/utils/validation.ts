import type { InputCommand } from '@average.dev/arena-shared';

export type { InputCommand };

export function sanitizeInput(data: unknown): InputCommand {
  const d = data as Record<string, unknown>;

  return {
    seq: typeof d['seq'] === 'number' ? d['seq'] : 0,
    attack: Boolean(d['attack']),
    interact: Boolean(d['interact']),
    weaponSlot: typeof d['weaponSlot'] === 'number' ? Math.max(0, Math.min(3, d['weaponSlot'])) : null,
  };
}
