import React, { createContext, useContext, useEffect } from 'react';
import type { EquipmentSlot, PlayerSnapshot } from '@average.dev/arena-shared';
import type { Room } from '@colyseus/sdk';
import { StateHandler } from '../network/state-handler';
import {
  useItemState,
  type ItemSystemState,
  type WorldItem,
  type EquippedItems,
} from './useItemState';

// ── Context value ────────────────────────────────────────────────────────────

interface ItemContextValue {
  /** Current world items and equipment state. */
  state: ItemSystemState;
  /** Request the server to spawn an item in front of the player. */
  requestSpawn: (room: Room | null, itemType: string) => void;
  /** Request the server to pick up the nearest item. */
  requestPickup: (room: Room | null) => void;
  /** Request the server to unequip an item from a slot. */
  requestUnequip: (room: Room | null, slot: EquipmentSlot) => void;
  /** Update which item is nearest to the player (for pickup prompt). */
  setNearbyItem: (id: string | null) => void;
}

const ItemContext = createContext<ItemContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

interface ItemProviderProps {
  /** Colyseus StateHandler for subscribing to server state changes. */
  stateHandler: StateHandler | null;
  children: React.ReactNode;
}

/**
 * ItemProvider — wires item/equipment state management to Colyseus events.
 *
 * Subscribes to `itemUpdate`, `itemRemove`, and `playerUpdate` events from
 * the StateHandler to keep the local item/equipment state in sync with
 * the authoritative server state.
 */
export function ItemProvider({ stateHandler, children }: ItemProviderProps) {
  const {
    state,
    handleItemUpdate,
    handleItemRemoved,
    syncEquipment,
    requestSpawn,
    requestPickup,
    requestUnequip,
    setNearbyItem,
  } = useItemState();

  // Subscribe to Colyseus state events
  useEffect(() => {
    if (!stateHandler) return;

    const room = stateHandler.getRoom();
    const myId = room.sessionId;

    // Sync world items from server
    stateHandler.on('itemUpdate', handleItemUpdate);
    stateHandler.on('itemRemove', handleItemRemoved);

    // Sync local player equipment from server
    const onPlayerUpdate = (id: string, player: PlayerSnapshot) => {
      if (id === myId) {
        syncEquipment(player as unknown as Record<string, unknown>);
      }
    };
    stateHandler.on('playerUpdate', onPlayerUpdate);

    return () => {
      stateHandler.off('itemUpdate', handleItemUpdate);
      stateHandler.off('itemRemove', handleItemRemoved);
      stateHandler.off('playerUpdate', onPlayerUpdate);
    };
  }, [stateHandler, handleItemUpdate, handleItemRemoved, syncEquipment]);

  const value: ItemContextValue = {
    state,
    requestSpawn,
    requestPickup,
    requestUnequip,
    setNearbyItem,
  };

  return <ItemContext.Provider value={value}>{children}</ItemContext.Provider>;
}

// ── Consumer hook ────────────────────────────────────────────────────────────

/**
 * Access the item/equipment context. Must be used within an ItemProvider.
 */
export function useItems(): ItemContextValue {
  const ctx = useContext(ItemContext);
  if (!ctx) {
    throw new Error('useItems must be used within an <ItemProvider>');
  }
  return ctx;
}

// Re-export types for convenience
export type { WorldItem, EquippedItems, ItemSystemState };
