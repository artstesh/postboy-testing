import { Observable, Subject } from 'rxjs';
import { MessageHistoryMock } from './message-history-mock';
import { MessageHistoryItemMock } from './message-history-item-mock';
import {
  checkId,
  MessageType,
  PostboyCallbackMessage,
  PostboyExecutor,
  PostboyGenericMessage,
  PostboyService,
} from '@artstesh/postboy';
import { MockRecord } from '../models/mock-record.model';
import { Dictionary } from '@artstesh/collections';

export class PostboyServiceMock extends PostboyService {
  private subscriptions: string[] = [];
  private _history = new MessageHistoryMock();
  private _mockedRecords: Dictionary<MockRecord<any>> = new Dictionary();

  mockRecord<T extends PostboyGenericMessage>(model: MockRecord<T>): Subject<T> {
    model.sub = model.sub ?? new Subject();
    this._mockedRecords.put(model.key, model);
    super.register(model.key, model.sub);
    return model.sub;
  }

  reset(): void {
    this.subscriptions = [];
    this._mockedRecords.forEach((m) => m.sub?.complete());
    this._mockedRecords = new Dictionary();
    this._history.reset();
  }

  fired(id: string, times: number = 0): boolean {
    return this._history.get(id)?.length === times;
  }

  subscribed(id: string, times: number = 0): boolean {
    const counter = this.count(this.subscriptions, id);
    return !!counter && (!times || counter === times);
  }

  private count = (collection: string[], el: string) => collection.filter((e) => e === el).length;

  exec<E extends PostboyExecutor<T>, T>(executor: E): T {
    this._history.add(executor);
    if (!this.executors.has(executor.id)) this.executors.put(executor.id, (e) => null);
    return super.exec(executor);
  }

  public sub<T extends PostboyGenericMessage>(type: MessageType<T>): Observable<T> {
    const key = checkId(type);
    this.subscriptions.push(key);
    if (!this.applications.has(key)) this.mockRecord({ key });
    return super.sub(type);
  }

  fire<T extends PostboyGenericMessage>(message: T) {
    this._history.add(message);
    if (!this.applications.has(message.id)) this.mockRecord({ key:message.id  });
    super.fire(message);
  }

  fireCallback<T>(message: PostboyCallbackMessage<T>, action?: (e: T) => void): Observable<T> {
    this._history.add(message);
    if (!this.applications.has(message.id)) this.mockRecord({ key:message.id  });
    return super.fireCallback(message, action);
  }

  history<T extends PostboyGenericMessage>(type: MessageType<T>): MessageHistoryItemMock<T> {
    return this._history.get(checkId(type));
  }
}
