import { Observable } from 'rxjs';
import { MessageHistory } from '../services/message-history';
import {
  checkId,
  MessageType,
  PostboyCallbackMessage,
  PostboyExecutor,
  PostboyGenericMessage,
  PostboyService,
} from '@artstesh/postboy';
import { PostboyMessageStoreMock } from './postboy-message-store.mock';
import { PostboyMiddlewareServiceMock } from './postboy-middleware-service.mock';
import { PostboyNamespaceStoreMock } from './postboy-namespace-store.mock';
import { PostboyTestingSettings } from '../models/postboy-testing.settings';

export class PostboyServiceMock extends PostboyService {
  constructor(
    private _history: MessageHistory,
    settings: PostboyTestingSettings = { strict: false },
  ) {
    super({
      getMessageStore: () => new PostboyMessageStoreMock(settings.strict),
      getMiddlewareService: () => new PostboyMiddlewareServiceMock(),
      getNamespaceStore: () => new PostboyNamespaceStoreMock(),
    });
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
