import { MessageHistory } from './message-history';
import { checkId, MessageType, PostboyMessage } from '@artstesh/postboy';

export class PostboyWorldVerifier {
  constructor(private _history: MessageHistory) {}

  subscribed<T extends PostboyMessage>(type: MessageType<T>, times: number = 0): boolean {
    const counter = this._history.subs(type);
    return !!counter && (!times || counter === times);
  }

  fired<T extends PostboyMessage>(type: MessageType<T>, times: number = 0): boolean {
    const count = this._history.messages(type).length;
    return !!count && (!times || count === times);
  }
}
