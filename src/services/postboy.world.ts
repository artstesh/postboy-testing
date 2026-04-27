import { PostboyServiceMock } from './postboy-service-mock';
import { MessageHistory } from './message-history';
import { AddNamespace, EliminateNamespace, PostboyAbstractRegistrator } from '@artstesh/postboy';
import { PostboyTestingSettings } from '../models/postboy-testing.settings';
import { PostboyMessageStreamService } from './postboy-message-stream.service';

const mockNamespace = 'mock-namespace-dcc9354a-2b41-4f85-aa61-4a789b00876d'

export class PostboyWorld {
  private _postboy: PostboyServiceMock;
  private _history: MessageHistory;
  private _register: PostboyAbstractRegistrator;
  private _mocks: PostboyMessageStreamService;

  constructor(settings: PostboyTestingSettings= { strict: false }) {
    this._history = new MessageHistory();
    this._postboy = new PostboyServiceMock(this._history, settings);
    this._mocks = new PostboyMessageStreamService(this._postboy);
    this._register = this._postboy.exec(new AddNamespace(mockNamespace));
  }

  get mocks() {
    return this._mocks;
  }

  get postboy() {
    return this._postboy;
  }

  get history() {
    return this._history;
  }

  get register() {
    return this._register;
  }

  dispose() {
    this._postboy.exec(new EliminateNamespace(mockNamespace));
    this._history.reset();
    this._mocks.dispose();
    this._postboy.dispose();
  }
}
