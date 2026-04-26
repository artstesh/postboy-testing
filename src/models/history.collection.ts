export class HistoryCollection<T> {
  private _items: T[] = [];

  add(item: T) {
    this._items.push(item);
  }
  hasItem(item: T) {
    return this._items.includes(item);
  }
  has(predicate: (i: T) => boolean) {
    return this._items.some(predicate);
  }
  get last() {
    return this._items[this._items.length - 1];
  }
  get first() {
    return this._items[0];
  }
  get all() {
    return [...this._items];
  }
  get length() {
    return this._items.length;
  }

  clear() {
    this._items = [];
  }
}
