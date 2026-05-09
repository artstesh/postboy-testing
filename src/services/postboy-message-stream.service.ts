import { PostboyServiceMock } from '../mocks/postboy-service-mock';
import {
  AddNamespace,
  MessageType,
  PostboyAbstractRegistrator,
  PostboyCallbackMessage,
  PostboyExecutor,
  PostboyMessage,
} from '@artstesh/postboy';
import { Subscription } from 'rxjs';

export class PostboyMessageStreamService {
  private readonly _subscriptions: Subscription[] = [];

  constructor(
    private postboy: PostboyServiceMock,
    private _registry: PostboyAbstractRegistrator,
  ) {}

  mockEvent<T extends PostboyMessage>(message: T): void {
    this._registry.recordReplay(message.constructor as MessageType<T>);
    this.postboy.fire(message);
  }

  mockCallback<R, T extends PostboyCallbackMessage<R>>(type: MessageType<T>, action: (m: T) => R): void {
    this._registry.recordReplay(type);

    const subscription = this.postboy.sub(type).subscribe((m) => m.finish(action(m)));

    this._subscriptions.push(subscription);
  }

  mockExecute<R, T extends PostboyExecutor<R>>(type: MessageType<T>, action: (m: T) => R): void {
    this._registry.recordExecutor(type, (e) => action(e));
  }

  dispose(): void {
    this._subscriptions.forEach((subscription) => subscription.unsubscribe());
    this._subscriptions.length = 0;

    this._registry.down();
  }
}
