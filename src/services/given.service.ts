import {
  MessageType,
  PostboyAbstractRegistrator,
  PostboyCallbackMessage,
  PostboyExecutor,
  PostboyGenericMessage,
  PostboyService,
} from '@artstesh/postboy';
import { PostboyMessageStreamService } from './postboy-message-stream.service';

export type PostboyCallbackResult<T> = T extends PostboyCallbackMessage<infer R> ? R : never;

export class PostboyGivenService {
  constructor(private _mocks: PostboyMessageStreamService) {}

  callback<T extends PostboyCallbackMessage<PostboyCallbackResult<T>>>(
    type: MessageType<T>,
    result: PostboyCallbackResult<T>,
  ): PostboyGivenService {
    this._mocks.mockCallback(type, () => result);
    return this;
  }

  executor<R, T extends PostboyExecutor<R>>(type: MessageType<T>, result: R): PostboyGivenService {
    this._mocks.mockExecute(type, () => result);
    return this;
  }

  event<T extends PostboyGenericMessage>(message: T): PostboyGivenService {
    this._mocks.mockEvent(message);
    return this;
  }
}
