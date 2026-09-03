import { Observable } from 'rxjs';
import { MessageHistory } from '../services/message-history';
import {
  MessageType,
  PostboyCallbackMessage,
  PostboyExecutor,
  PostboyGenericMessage,
  PostboyMessage,
  PostboyService,
} from '@artstesh/postboy';
import { checkId } from '../utils/check-id.util';
import { PostboyTestingSettings } from '../models/postboy-testing.settings';
import { PostboyMessageStoreMock } from './postboy-message-store.mock';
import { PostboyMiddlewareServiceMock } from './postboy-middleware-service.mock';
import { PostboyNamespaceStoreMock } from './postboy-namespace-store.mock';

export class PostboyServiceMock extends PostboyService {
  private _store: PostboyMessageStoreMock;

  constructor(
    private _history: MessageHistory,
    settings: PostboyTestingSettings = { strict: false },
  ) {
    let store!: PostboyMessageStoreMock;
    super({
      getMessageStore: () => (store ??= new PostboyMessageStoreMock(settings.strict)),
      getMiddlewareService: () => new PostboyMiddlewareServiceMock(),
      getNamespaceStore: () => new PostboyNamespaceStoreMock(),
    });
    this._store = store;
  }

  /**
   * Whether a message type is already registered on the bus. Re-registering a taken
   * id makes the store replace the subject, silently detaching existing subscribers
   * and replay buffers — callers must check this before any `record*` call.
   */
  isRegistered<T extends PostboyMessage>(type: MessageType<T>): boolean {
    return this._store.has(checkId(type));
  }

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

    const originalFinish = message.finish.bind(message);

    message.finish = ((result: T) => {
      this._history.addCallbackResult(message, result);
      originalFinish(result);
    }) as typeof message.finish;

    return super.fireCallback(message, action);
  }
}
