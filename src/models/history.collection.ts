export class HistoryCollection<T> {
  private _items: T[] = [];

  add(item: T): void {
    this._items.push(item);
  }
  hasItem(item: T): boolean {
    return this._items.includes(item);
  }
  has(predicate: (i: T) => boolean): boolean {
    return this._items.some(predicate);
  }
  get last(): T | null {
    return this._items[this._items.length - 1] ?? null;
  }
  get first(): T | null {
    return this._items[0] ?? null;
  }
  get all(): T[] {
    return [...this._items];
  }
  get length(): number {
    return this._items.length;
  }

  clear(): void {
    this._items = [];
  }
}
