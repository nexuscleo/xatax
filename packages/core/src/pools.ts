/**
 * High-performance object pool with zero allocations in the hot loop.
 */
export class EntityPool<T> {
  readonly items: T[];
  activeCount = 0;
  readonly capacity: number;

  constructor(capacity: number, factory: () => T) {
    this.capacity = capacity;
    this.items = new Array(capacity);
    for (let i = 0; i < capacity; i++) {
      this.items[i] = factory();
    }
  }

  /**
   * Acquires an idle item from the pool. Returns undefined if pool capacity is exhausted.
   */
  acquire(): T | undefined {
    if (this.activeCount >= this.capacity) {
      return undefined;
    }
    const item = this.items[this.activeCount];
    this.activeCount++;
    return item;
  }

  /**
   * Fast O(1) removal by swapping the removed item with the last active item.
   */
  swapRemove(index: number): void {
    if (index < 0 || index >= this.activeCount) {
      return;
    }
    this.activeCount--;
    const current = this.items[index];
    const last = this.items[this.activeCount];
    if (current && last) {
      this.items[index] = last;
      this.items[this.activeCount] = current;
    }
  }

  /**
   * Resets all items to idle state without garbage collection.
   */
  reset(): void {
    this.activeCount = 0;
  }
}
