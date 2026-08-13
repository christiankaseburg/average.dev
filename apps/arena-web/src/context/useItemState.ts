import { useReducer, useCallback } from 'react';
import type { EquipmentSlot, ItemSnapshot } from '@average.dev/arena-shared';
import { EQUIPMENT_SLOTS, SLOT_DEFAULTS } from '@average.dev/arena-shared';
import type { Room } from '@colyseus/sdk';

// ── State shape ──────────────────────────────────────────────────────────────

export interface WorldItem {
  id: string;
  itemType: string;
  x: number;
  y: number;
  z: number;
}

export type EquippedItems = Record<EquipmentSlot, string>;

export interface ItemSystemState {
  /** Items currently on the ground in the 3D world. */
  worldItems: Map<string, WorldItem>;
  /** Items currently equipped on the local player. */
  equippedItems: EquippedItems;
  /** ID of the nearest item within pickup range (for UI prompt). */
  nearbyItemId: string | null;
}

/** Derive initial equipped state from the shared SLOT_DEFAULTS. */
const INITIAL_EQUIPPED: EquippedItems = { ...SLOT_DEFAULTS } as EquippedItems;

const INITIAL_STATE: ItemSystemState = {
  worldItems: new Map(),
  equippedItems: { ...INITIAL_EQUIPPED },
  nearbyItemId: null,
};

// ── Actions ──────────────────────────────────────────────────────────────────

type ItemAction =
  | { type: 'ITEM_ADDED'; id: string; item: WorldItem }
  | { type: 'ITEM_REMOVED'; id: string }
  | { type: 'ITEMS_SYNCED'; items: Map<string, WorldItem> }
  | { type: 'EQUIPMENT_UPDATED'; equippedItems: Partial<EquippedItems> }
  | { type: 'NEARBY_ITEM_CHANGED'; id: string | null };

// ── Reducer ──────────────────────────────────────────────────────────────────

function itemReducer(state: ItemSystemState, action: ItemAction): ItemSystemState {
  switch (action.type) {
    case 'ITEM_ADDED': {
      const next = new Map(state.worldItems);
      next.set(action.id, action.item);
      return { ...state, worldItems: next };
    }

    case 'ITEM_REMOVED': {
      const next = new Map(state.worldItems);
      next.delete(action.id);
      const nearbyItemId =
        state.nearbyItemId === action.id ? null : state.nearbyItemId;
      return { ...state, worldItems: next, nearbyItemId };
    }

    case 'ITEMS_SYNCED': {
      return { ...state, worldItems: action.items };
    }

    case 'EQUIPMENT_UPDATED': {
      return {
        ...state,
        equippedItems: { ...state.equippedItems, ...action.equippedItems },
      };
    }

    case 'NEARBY_ITEM_CHANGED': {
      if (state.nearbyItemId === action.id) return state;
      return { ...state, nearbyItemId: action.id };
    }

    default:
      return state;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useItemState() {
  const [state, dispatch] = useReducer(itemReducer, INITIAL_STATE);

  /** Handle an item update from the server (new or moved). */
  const handleItemUpdate = useCallback((id: string, item: ItemSnapshot) => {
    dispatch({
      type: 'ITEM_ADDED',
      id,
      item: {
        id: item.id ?? id,
        itemType: item.itemType,
        x: item.x,
        y: item.y,
        z: item.z,
      },
    });
  }, []);

  /** Handle item removal from the server (picked up or destroyed). */
  const handleItemRemoved = useCallback((id: string) => {
    dispatch({ type: 'ITEM_REMOVED', id });
  }, []);

  /**
   * Sync equipped items from Colyseus player state.
   * Iterates EQUIPMENT_SLOTS from shared to avoid hardcoding slot names.
   */
  const syncEquipment = useCallback(
    (playerData: Record<string, unknown>) => {
      const equippedItems: Partial<EquippedItems> = {};
      for (const slot of EQUIPMENT_SLOTS) {
        equippedItems[slot] = (playerData[slot] as string) ?? SLOT_DEFAULTS[slot];
      }
      dispatch({ type: 'EQUIPMENT_UPDATED', equippedItems });
    },
    [],
  );

  /** Request the server to spawn an item in front of the player. */
  const requestSpawn = useCallback((room: Room | null, itemType: string) => {
    if (!room) return;
    room.send('admin_spawn', { itemType });
  }, []);

  /**
   * Request the server to pick up the nearest item.
   * Sends the existing "input" message with interact flag.
   */
  const requestPickup = useCallback((room: Room | null) => {
    if (!room) return;
    room.send('input', { interact: true });
  }, []);

  /**
   * Request the server to unequip an item from a slot.
   * Slot name is sent directly — no mapping needed since names are 1:1.
   */
  const requestUnequip = useCallback(
    (room: Room | null, slot: EquipmentSlot) => {
      if (!room) return;
      room.send('unequip', { slot });
    },
    [],
  );

  /** Update which item is nearest to the player (for pickup prompt). */
  const setNearbyItem = useCallback((id: string | null) => {
    dispatch({ type: 'NEARBY_ITEM_CHANGED', id });
  }, []);

  return {
    state,
    handleItemUpdate,
    handleItemRemoved,
    syncEquipment,
    requestSpawn,
    requestPickup,
    requestUnequip,
    setNearbyItem,
  };
}
