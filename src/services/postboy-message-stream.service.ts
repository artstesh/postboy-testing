import { PostboyServiceMock } from '../mocks/postboy-service-mock';
import {
  AddNamespace,
  MessageType,
  PostboyAbstractRegistrator,
  PostboyCallbackMessage,
  PostboyExecutor,
  PostboyMessage,
} from '@artstesh/postboy';

export class PostboyMessageStreamService {
  constructor(
    private postboy: PostboyServiceMock,
    private _registry: PostboyAbstractRegistrator,
  ) {
  }

  mockEvent<T extends PostboyMessage>(message: T): void {
    this._registry.recordReplay(message.constructor as MessageType<T>);
    this.postboy.fire(message);
  }

  mockCallback<R, T extends PostboyCallbackMessage<R>>(type: MessageType<T>, action: (m: T) => R): void {
    this._registry.recordSubject(type);
    this.postboy.sub(type).subscribe((m) => m.finish(action(m)));
  }

  mockExecute<R, T extends PostboyExecutor<R>>(type: MessageType<T>, action: (m: T) => R): void {
    this._registry.recordExecutor(type, (e) => action(e));
  }

  dispose(): void {
    this._registry.down();
  }
}
