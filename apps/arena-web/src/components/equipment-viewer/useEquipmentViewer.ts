import { useState, useCallback, useMemo } from 'react';
import type { EquipmentSlot } from '@average.dev/arena-shared';
import { SLOT_LABELS } from '@average.dev/arena-shared';
import { getItemsForSlot } from '../../engine/items/item-registry';

// Re-export for EquipmentViewer component consumption
export { SLOT_LABELS };

/**
 * Viewer-specific display order (head-to-toe).
 * Uses the same slots as EQUIPMENT_SLOTS but in a UI-friendly order.
 */
export const VIEWER_SLOTS: EquipmentSlot[] = [
  'helm',
  'top',
  'cape',
  'legs',
  'belt',
  'boots',
  'weapon',
  'shield',
  'accessory',
];

interface SlotOptions {
  /** Ordered list of item keys for cycling. First entry is always 'none'. */
  keys: string[];
  /** Display labels matching the keys array. */
  labels: string[];
}

/**
 * useEquipmentViewer — manages the selected item per slot for
 * the Equipment Viewer preview. Each slot can cycle through
 * 'none' + all registered items for that slot.
 */
export function useEquipmentViewer() {
  // Build the available options for each slot (memoized once)
  const slotOptions = useMemo(() => {
    const map: Record<string, SlotOptions> = {};
    for (const slot of VIEWER_SLOTS) {
      const items = getItemsForSlot(slot);
      map[slot] = {
        keys: ['none', ...items.map(i => i.itemType)],
        labels: ['None', ...items.map(i => i.name)],
      };
    }
    return map;
  }, []);

  // Track selected index per slot
  const [selectedIndices, setSelectedIndices] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const slot of VIEWER_SLOTS) {
      initial[slot] = 0; // 'none' by default
    }
    return initial;
  });

  /** Cycle a slot forward or backward. */
  const cycleSlot = useCallback(
    (slot: EquipmentSlot, direction: -1 | 1) => {
      const options = slotOptions[slot];
      if (!options || options.keys.length <= 1) return; // No items to cycle

      setSelectedIndices(prev => {
        const current = prev[slot] ?? 0;
        const next = (current + direction + options.keys.length) % options.keys.length;
        return { ...prev, [slot]: next };
      });
    },
    [slotOptions],
  );

  /** Get the currently selected item key for a slot. */
  const getSelectedItem = useCallback(
    (slot: EquipmentSlot): string => {
      const options = slotOptions[slot];
      const index = selectedIndices[slot] ?? 0;
      return options?.keys[index] ?? 'none';
    },
    [slotOptions, selectedIndices],
  );

  /** Get the display label for the currently selected item. */
  const getSelectedLabel = useCallback(
    (slot: EquipmentSlot): string => {
      const options = slotOptions[slot];
      const index = selectedIndices[slot] ?? 0;
      return options?.labels[index] ?? 'None';
    },
    [slotOptions, selectedIndices],
  );

  /** Check if a slot has any registered items to cycle through. */
  const hasItems = useCallback(
    (slot: EquipmentSlot): boolean => {
      const options = slotOptions[slot];
      return (options?.keys.length ?? 0) > 1;
    },
    [slotOptions],
  );

  /** Build the full equipment record for passing to PlayerModel. */
  const equipmentRecord = useMemo(() => {
    const record: Record<string, string> = {};
    for (const slot of VIEWER_SLOTS) {
      record[slot] = getSelectedItem(slot);
    }
    return record;
  }, [selectedIndices, getSelectedItem]);

  return {
    slotOptions,
    cycleSlot,
    getSelectedItem,
    getSelectedLabel,
    hasItems,
    equipmentRecord,
  };
}
