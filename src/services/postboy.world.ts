import { PostboyServiceMock } from '../mocks/postboy-service-mock';
import { MessageHistory } from './message-history';
import { AddNamespace, EliminateNamespace, PostboyAbstractRegistrator } from '@artstesh/postboy';
import { PostboyTestingSettings } from '../models/postboy-testing.settings';
import { PostboyMessageStreamService } from './postboy-message-stream.service';
import { PostboyWaiterService } from './postboy-waiter.service';
import { PostboyThenService } from './postboy-then.service';
import { PostboyGivenService } from './given.service';

const mockNamespace = 'mock-namespace-dcc9354a-2b41-4f85-aa61-4a789b00876d'

export class PostboyWorld {
  private _postboy: PostboyServiceMock;
  private _history: MessageHistory;
  private _registry: PostboyAbstractRegistrator;
  private _mocks: PostboyMessageStreamService;
  private _waiter: PostboyWaiterService;
  private _given: PostboyGivenService;
  private _then: PostboyThenService;

  constructor(settings: PostboyTestingSettings = { strict: false }) {
    this._history = new MessageHistory();
    this._postboy = new PostboyServiceMock(this._history, settings);
    this._waiter = new PostboyWaiterService(this._postboy, this._history);
    this._registry = this._postboy.exec(new AddNamespace(mockNamespace));
    this._mocks = new PostboyMessageStreamService(this._postboy, this._registry);
    this._given = new PostboyGivenService(this._mocks);
    this._then = new PostboyThenService(this._history);
  }

  get waiter(): PostboyWaiterService {
    return this._waiter;
  }

  get given(): PostboyGivenService {
    return this._given;
  }

  get then(): PostboyThenService {
    return this._then;
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

  get registry() {
    return this._registry;
  }

  dispose() {
    this._postboy.exec(new EliminateNamespace(mockNamespace));
    this._history.reset();
    this._mocks.dispose();
    this._waiter.dispose();
    this._postboy.dispose();
  }
}
