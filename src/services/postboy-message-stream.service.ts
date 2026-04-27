import { PostboyServiceMock } from './postboy-service-mock';
import {
  AddNamespace,
  MessageType,
  PostboyAbstractRegistrator,
  PostboyCallbackMessage,
  PostboyExecutor,
  PostboyMessage,
} from '@artstesh/postboy';

export class PostboyMessageStreamService {
  private _registry: PostboyAbstractRegistrator;
  constructor(private postboy: PostboyServiceMock) {
    this._registry = postboy.exec(new AddNamespace('0536f0d5-40e1-45ce-8f4b-d87fee9ea67c'));
  }

  mockSub<T extends PostboyMessage>(
    type: MessageType<T>,
    action: (m: T) => T extends PostboyCallbackMessage<any> ? any : void,
  ): void {
    this._registry.recordReplay(type);
    this.postboy.sub(type).subscribe(action);
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
