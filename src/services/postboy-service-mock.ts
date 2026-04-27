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
import { PostboyTestingSettings } from '../models/postboy-testing.settings';

export class PostboyServiceMock extends PostboyService {
  private storeMock: PostboyMessageStoreMock;

  constructor(
    private _history: MessageHistory,
    private settings: PostboyTestingSettings = { strict: false },
  ) {
    super({
      getMessageStore: () => this.storeMock,
      getMiddlewareService: () => new PostboyMiddlewareServiceMock(),
      getNamespaceStore: () => new PostboyNamespaceStoreMock(),
    });
    this.storeMock = new PostboyMessageStoreMock(settings.strict);
  }

  private count = (collection: string[], el: string) => collection.filter((e) => e === el).length;

  exec<E extends PostboyExecutor<T>, T>(executor: E): T {
    this._history.addMessage(executor);
    return super.exec(executor);
  }

  public once<T extends PostboyGenericMessage>(type: MessageType<T>): Observable<T> {
    const key = checkId(type);
    this._history.addSubscription(key);
    return super.once(type);
  }

  public sub<T extends PostboyGenericMessage>(type: MessageType<T>): Observable<T> {
    const key = checkId(type);
    this._history.addSubscription(key);
    return super.sub(type);
  }

  fire<T extends PostboyGenericMessage>(message: T) {
    this._history.addMessage(message);
    super.fire(message);
  }

  fireCallback<T>(message: PostboyCallbackMessage<T>, action?: (e: T) => void): Observable<T> {
    this._history.addMessage(message);
    return super.fireCallback(message, action);
  }
}
