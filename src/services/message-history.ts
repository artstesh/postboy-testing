import { checkId, MessageType, PostboyCallbackMessage, PostboyMessage } from '@artstesh/postboy';
import { Observable, Subject } from 'rxjs';
import { CallbackResultHistoryItem } from '../models/callback-result-history-item';
import { HistoryCollection } from '../models/history.collection';
import { PostboyCallbackResult } from './given.service';

export class MessageHistory {
  private _messages = new Map<string, HistoryCollection<PostboyMessage>>();
  private _subscriptions = new Map<string, number>();
  private _callbackResults = new Map<string, HistoryCollection<CallbackResultHistoryItem<any, any>>>();
  private _callbackResultSubjects = new Map<string, Subject<CallbackResultHistoryItem<any, any>>>();

  messages<T extends PostboyMessage>(type: MessageType<T>): HistoryCollection<T> {
    return (this._messages.get(checkId(type)) ?? new HistoryCollection<T>()) as HistoryCollection<T>;
  }

  callbackResults<T extends PostboyCallbackMessage<PostboyCallbackResult<T>>>(
    type: MessageType<T>,
  ): HistoryCollection<CallbackResultHistoryItem<T, PostboyCallbackResult<T>>> {
    return (this._callbackResults.get(checkId(type)) ??
      new HistoryCollection<CallbackResultHistoryItem<T, PostboyCallbackResult<T>>>()) as HistoryCollection<
      CallbackResultHistoryItem<T, PostboyCallbackResult<T>>
    >;
  }

  callbackResult$<T extends PostboyCallbackMessage<PostboyCallbackResult<T>>>(
    type: MessageType<T>,
  ): Observable<CallbackResultHistoryItem<T, PostboyCallbackResult<T>>> {
    return this._getCallbackResultSubject(checkId(type)).asObservable() as Observable<
      CallbackResultHistoryItem<T, PostboyCallbackResult<T>>
    >;
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

  addCallbackResult<T extends PostboyCallbackMessage<PostboyCallbackResult<T>>>(
    message: T,
    result: PostboyCallbackResult<T>,
  ): void {
    const item: CallbackResultHistoryItem<T, PostboyCallbackResult<T>> = { message, result };

    if (!this._callbackResults.get(message.id)?.add(item)) {
      const collection = new HistoryCollection<CallbackResultHistoryItem<T, PostboyCallbackResult<T>>>();
      collection.add(item);
      this._callbackResults.set(message.id, collection);
    }

    this._getCallbackResultSubject(message.id).next(item);
  }

  addSubscription(id: string, count: number = 1): void {
    if (!this._subscriptions.get(id)) {
      this._subscriptions.set(id, count);
    } else {
      this._subscriptions.set(id, this._subscriptions.get(id)! + count);
    }
  }

  reset(): void {
    this._messages.clear();
    this._subscriptions.clear();
    this._callbackResults.clear();

    this._callbackResultSubjects.forEach((subject) => subject.complete());
    this._callbackResultSubjects.clear();
  }

  private _getCallbackResultSubject(id: string): Subject<CallbackResultHistoryItem<any, any>> {
    let subject = this._callbackResultSubjects.get(id);

    if (!subject) {
      subject = new Subject<CallbackResultHistoryItem<any, any>>();
      this._callbackResultSubjects.set(id, subject);
    }

    return subject;
  }
}
