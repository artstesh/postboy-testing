import { PostboyThenService } from '../services/postboy-then.service';
import { MessageType, PostboyMessage } from '@artstesh/postboy';
import { MessageHistory } from '../services/message-history';

export class PostboySubscribedThen<T extends PostboyMessage> {
  constructor(
    private _then: PostboyThenService,
    private _history: MessageHistory,
    private _type: MessageType<T>,
  ) {}

  once(): PostboySubscribedThen<T> {
    return this.times(1);
  }

  times(count: number): PostboySubscribedThen<T> {
    const actual = this._history.subs(this._type);

    if (actual !== count) {
      throw new Error(
        `Expected ${this._getTypeName()} to be subscribed ${count} time(s), but it was subscribed ${actual} time(s).`,
      );
    }

    return this;
  }

  atLeast(count: number): PostboySubscribedThen<T> {
    const actual = this._history.subs(this._type);

    if (actual < count) {
      throw new Error(
        `Expected ${this._getTypeName()} to be subscribed at least ${count} time(s), but it was subscribed ${actual} time(s).`,
      );
    }

    return this;
  }

  and(): PostboyThenService {
    return this._then;
  }

  private _getTypeName(): string {
    return this._type.name;
  }
}
