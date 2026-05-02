import { MessageType, PostboyMessage } from '@artstesh/postboy';
import { MessageHistory } from './message-history';
import { PostboySubscribedThen } from '../models/postboy-subscribed-then';
import { PostboyFiredThen } from '../models/postboy-fired-then';

export class PostboyThenService {
  constructor(private _history: MessageHistory) {}

  fired<T extends PostboyMessage>(type: MessageType<T>): PostboyFiredThen<T> {
    return new PostboyFiredThen<T>(this, this._history, type);
  }

  notFired<T extends PostboyMessage>(type: MessageType<T>): PostboyThenService {
    const count = this._history.messages(type).length;

    if (count !== 0) {
      throw new Error(`Expected ${this._getTypeName(type)} not to be fired, but it was fired ${count} time(s).`);
    }

    return this;
  }

  subscribed<T extends PostboyMessage>(type: MessageType<T>): PostboySubscribedThen<T> {
    return new PostboySubscribedThen<T>(this, this._history, type);
  }

  private _getTypeName<T extends PostboyMessage>(type: MessageType<T>): string {
    return type.name;
  }
}

