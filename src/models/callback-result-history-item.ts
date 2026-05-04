import { PostboyCallbackMessage } from '@artstesh/postboy';

export interface CallbackResultHistoryItem<TMessage extends PostboyCallbackMessage<TResult>, TResult> {
  message: TMessage;
  result: TResult;
}
