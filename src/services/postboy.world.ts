import { PostboyServiceMock } from './postboy-service-mock';
import { MessageHistory } from './message-history';
import { AddNamespace, EliminateNamespace, PostboyAbstractRegistrator } from '@artstesh/postboy';

const mockNamespace = 'mock-namespace-dcc9354a-2b41-4f85-aa61-4a789b00876d'

export class PostboyWorld {
  private _postboy: PostboyServiceMock;
  private _history: MessageHistory;
  private _register: PostboyAbstractRegistrator;

  get postboy() {
    return this._postboy;
  }

  get history() {
    return this._history;
  }

  get register() {
    return this._register;
  }

  constructor() {
    this._history = new MessageHistory();
    this._postboy = new PostboyServiceMock(this._history);
    this._register = this._postboy.exec(new AddNamespace(mockNamespace));
  }

  dispose() {
    this._postboy.exec(new EliminateNamespace(mockNamespace));
    this._postboy.dispose();
    this._history.reset();
  }
}
