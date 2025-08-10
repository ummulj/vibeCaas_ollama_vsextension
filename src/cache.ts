export class LruCache<V> {
  private maxEntries: number;
  private map: Map<string, V>;
  constructor(maxEntries: number = 50) {
    this.maxEntries = maxEntries;
    this.map = new Map();
  }
  get(key: string): V | undefined {
    const value = this.map.get(key);
    if (value !== undefined) {
      this.map.delete(key);
      this.map.set(key, value);
    }
    return value;
  }
  set(key: string, value: V) {
    if (this.map.has(key)) {
      this.map.delete(key);
    }
    this.map.set(key, value);
    if (this.map.size > this.maxEntries) {
      const oldestKey = this.map.keys().next().value as string | undefined;
      if (oldestKey) this.map.delete(oldestKey);
    }
  }
}

