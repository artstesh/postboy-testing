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
  private _strict: boolean;
  private _intercepted = new WeakSet<PostboyCallbackMessage<any>>();
  private _warnedTypes = new Set<string>();

  constructor(
    private _history: MessageHistory,
    settings: PostboyTestingSettings = { strict: false },
  ) {
    if (!(_history instanceof MessageHistory)) {
      throw new Error(
        'PostboyServiceMock expects a MessageHistory instance as the first constructor argument. ' +
          'Prefer PostboyWorld, which wires the mock and its shared history for you.',
      );
    }
    let store!: PostboyMessageStoreMock;
    super({
      getMessageStore: () => (store ??= new PostboyMessageStoreMock(settings.strict)),
      getMiddlewareService: () => new PostboyMiddlewareServiceMock(),
      getNamespaceStore: () => new PostboyNamespaceStoreMock(),
    });
    this._store = store;
    this._strict = settings.strict;
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
    this._warnIfNoId(executor, 'executed');
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
    this._warnIfNoId(message, 'fired');
    this._history.addMessage(message);
    if (message instanceof PostboyCallbackMessage) this._interceptFinish(message);
    super.fire(message);
  }

  fireCallback<T>(message: PostboyCallbackMessage<T>, action?: (e: T) => void): Observable<T> {
    this._warnIfNoId(message, 'fired');
    this._history.addMessage(message);
    this._interceptFinish(message);
    return super.fireCallback(message, action);
  }

  /**
   * Wraps the message's own `finish` so every result it produces lands in the shared
   * history — and therefore in `history.callbackResults` and `waitForCallbackResult` —
   * no matter whether the message is dispatched by `fire` or by `fireCallback`. A real
   * handler completing a query fired with plain `fire` is recorded the same way as a
   * `given.callback` stub. Idempotent per message instance.
   */
  private _interceptFinish(message: PostboyCallbackMessage<any>): void {
    if (this._intercepted.has(message)) return;
    this._intercepted.add(message);
    const originalFinish = message.finish.bind(message);
    message.finish = ((result: any) => {
      this._history.addCallbackResult(message, result);
      originalFinish(result);
    }) as typeof message.finish;
  }

  /**
   * A message or executor without a usable id — the class declares no static `ID` or does
   * not extend a postboy base class — is routed under the `undefined` key. In strict mode
   * the bus throws; in non-strict mode it is silently auto-registered, so nothing is ever
   * delivered or recorded. Warns once per class name so the mistake stays visible.
   */
  private _warnIfNoId(message: PostboyMessage, verb: string): void {
    if (this._strict || !!message.id) return;
    const name = message.constructor.name;
    if (this._warnedTypes.has(name)) return;
    this._warnedTypes.add(name);
    console.warn(
      `[postboy-testing] ${name} is ${verb} without a message id: the class misses a static ID ` +
        `or does not extend a postboy base class. In non-strict mode it is silently registered ` +
        `under an empty key — nothing is delivered or recorded.`,
    );
  }
}
