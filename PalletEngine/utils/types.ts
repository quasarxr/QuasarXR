class FixedLengthQueue<T> {
  private queue: T[];
  private capacity: number;

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error("Capacity must be greater than 0.");
    }
    this.capacity = capacity;
    this.queue = [];
  }

  /**
   * Adds an item to the queue. If the queue exceeds its capacity,
   * the oldest item (at the front) is removed.
   * @param item The item to add.
   */
  push(item: T): T {
    if (this.queue.length >= this.capacity) {
      return this.queue.shift(); // Remove the oldest item
    }
    this.queue.push(item);

    return null;
  }

  /**
   * Retrieves the current state of the queue.
   * @returns An array of the items in the queue.
   */
  getItems(): T[] {
    return [...this.queue]; // Return a shallow copy of the queue
  }

  /**
   * Gets the current length of the queue.
   * @returns The number of items in the queue.
   */
  getLength(): number {
    return this.queue.length;
  }

  getCapacity(): number {
    return this.capacity;
  }

  /**
   * Clears all items from the queue.
   */
  clear(): void {
    this.queue = [];
  }
}

export { FixedLengthQueue };