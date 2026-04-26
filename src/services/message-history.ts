
import { checkId, MessageType, PostboyMessage } from '@artstesh/postboy';
import { HistoryCollection } from '../models/history.collection';

export class MessageHistory {
  private _messages = new Map<string, HistoryCollection<PostboyMessage>>();
  private _subscriptions = new Map<string, number>();

  messages<T extends PostboyMessage>(type: MessageType<T>): HistoryCollection<T> {
    return (this._messages.get(checkId(type)) ?? new HistoryCollection<T>()) as HistoryCollection<T>;
  }

  subs<T extends PostboyMessage>(type: MessageType<T>): number {
    return this._subscriptions.get(checkId(type)) ?? 0;
  }

  addMessage(message: PostboyMessage): void {
    if (!this._messages.get(message.id)?.add(message)) {
      const collection = new HistoryCollection<PostboyMessage>();
      collection.add(message);
      this._messages.set(message.id, collection);
    }
  }

  addSubscription(id: string, count: number= 1): void {
    if (!this._subscriptions.get(id)) {
      this._subscriptions.set(id, count);
    } else {
      this._subscriptions.set(id, this._subscriptions.get(id)! + count);
    }
  }

  reset(): void {
    this._messages.clear();
    this._subscriptions.clear();
  }
}
