import { Observable, Subject } from 'rxjs';
import { MessageHistory } from './message-history';
import {
  checkId,
  MessageType,
  PostboyCallbackMessage,
  PostboyExecutor,
  PostboyGenericMessage,
  PostboyService,
} from '@artstesh/postboy';
import { MockRecord } from '../models/mock-record.model';
import { PostboySubscription } from '@artstesh/postboy/lib/models/postboy-subscription';
import { PostboyMessageStoreMock } from '../mocks/postboy-message-store.mock';
import { PostboyMiddlewareServiceMock } from '../mocks/postboy-middleware-service.mock';
import { PostboyNamespaceStoreMock } from '../mocks/postboy-namespace-store.mock';

export class PostboyServiceMock extends PostboyService {
  private _mockedRecords = new Map<string, MockRecord<any>>();
  private storeMock = new PostboyMessageStoreMock();

  constructor(private _history: MessageHistory) {
    super(
      {
        getMessageStore: () => new PostboyMessageStoreMock(),
        getMiddlewareService: () => new PostboyMiddlewareServiceMock(),
        getNamespaceStore: () => new PostboyNamespaceStoreMock()
      },
    );
    this.storeMock = (this as any).store as PostboyMessageStoreMock;
  }

  mockRecord<T extends PostboyGenericMessage>(model: MockRecord<T>): Subject<T> {
    model.sub = model.sub ?? new Subject();
    this._mockedRecords.set(model.key, model);
    this.storeMock.apps.set(model.key, new PostboySubscription<T>(model.sub, (s) => s.asObservable()));
    return model.sub;
  }

  reset(): void {
    this._mockedRecords.forEach((m) => m.sub?.complete());
    this._mockedRecords.clear();
  }

  private count = (collection: string[], el: string) => collection.filter((e) => e === el).length;

  exec<E extends PostboyExecutor<T>, T>(executor: E): T {
    this._history.addMessage(executor);
    if (!this.storeMock.execs.has(executor.id)) this.storeMock.execs.set(executor.id, (e) => null);
    return super.exec(executor);
  }

  public once<T extends PostboyGenericMessage>(type: MessageType<T>): Observable<T> {
    const key = checkId(type);
    this._history.addSubscription(key);
    if (!this.storeMock.apps.has(key)) this.mockRecord({ key });
    return super.once(type);
  }

  public sub<T extends PostboyGenericMessage>(type: MessageType<T>): Observable<T> {
    const key = checkId(type);
    this._history.addSubscription(key);
    if (!this.storeMock.apps.has(key)) this.mockRecord({ key });
    return super.sub(type);
  }

  fire<T extends PostboyGenericMessage>(message: T) {
    this._history.addMessage(message);
    if (!this.storeMock.apps.has(message.id)) this.mockRecord({ key: message.id });
    super.fire(message);
  }

  fireCallback<T>(message: PostboyCallbackMessage<T>, action?: (e: T) => void): Observable<T> {
    this._history.addMessage(message);
    if (!this.storeMock.apps.has(message.id)) this.mockRecord({ key: message.id });
    return super.fireCallback(message, action);
  }
}
