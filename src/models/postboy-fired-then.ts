import { PostboyThenService } from '../services/postboy-then.service';
import { MessageHistory } from '../services/message-history';
import { MessageType, PostboyMessage } from '@artstesh/postboy';

export class PostboyFiredThen<T extends PostboyMessage> {
  constructor(
    private _then: PostboyThenService,
    private _history: MessageHistory,
    private _type: MessageType<T>,
  ) {}

  once(): PostboyFiredThen<T> {
    return this.times(1);
  }

  times(count: number): PostboyFiredThen<T> {
    const actual = this._history.messages(this._type).length;

    if (actual !== count) {
      throw new Error(
        `Expected ${this._getTypeName()} to be fired ${count} time(s), but it was fired ${actual} time(s).`,
      );
    }

    return this;
  }

  atLeast(count: number): PostboyFiredThen<T> {
    const actual = this._history.messages(this._type).length;

    if (actual < count) {
      throw new Error(
        `Expected ${this._getTypeName()} to be fired at least ${count} time(s), but it was fired ${actual} time(s).`,
      );
    }

    return this;
  }

  with(predicate: (message: T) => boolean): PostboyFiredThen<T> {
    const messages = this._history.messages(this._type).all;

    if (!messages.some(predicate)) {
      throw new Error(
        `Expected ${this._getTypeName()} to be fired with matching payload, but no matching message was found.`,
      );
    }

    return this;
  }

  last(predicate: (message: T) => boolean): PostboyFiredThen<T> {
    const message = this._history.messages(this._type).last;

    if (!message) {
      throw new Error(`Expected ${this._getTypeName()} to be fired, but it was not fired.`);
    }

    if (!predicate(message)) {
      throw new Error(`Expected last ${this._getTypeName()} to match predicate, but it did not.`);
    }

    return this;
  }

  first(predicate: (message: T) => boolean): PostboyFiredThen<T> {
    const message = this._history.messages(this._type).first;

    if (!message) {
      throw new Error(`Expected ${this._getTypeName()} to be fired, but it was not fired.`);
    }

    if (!predicate(message)) {
      throw new Error(`Expected first ${this._getTypeName()} to match predicate, but it did not.`);
    }

    return this;
  }

  get value(): T {
    const message = this._history.messages(this._type).last;

    if (!message) {
      throw new Error(`Expected ${this._getTypeName()} to be fired, but it was not fired.`);
    }

    return message;
  }

  and(): PostboyThenService {
    return this._then;
  }

  private _getTypeName(): string {
    return this._type.name;
  }
}
