/**
 * Lightweight typed event emitter that replaces Phaser.Events.EventEmitter.
 * Provides the same on/off/emit API surface that StateHandler and other
 * consumers rely on, without any framework dependency.
 */

type Listener = (...args: unknown[]) => void;

export class TypedEventEmitter {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, fn: Listener): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(fn);
    return this;
  }

  off(event: string, fn: Listener): this {
    this.listeners.get(event)?.delete(fn);
    return this;
  }

  emit(event: string, ...args: unknown[]): this {
    this.listeners.get(event)?.forEach((fn) => fn(...args));
    return this;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }
}
