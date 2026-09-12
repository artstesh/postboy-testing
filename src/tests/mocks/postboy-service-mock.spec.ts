import { PostboyCallbackMessage, PostboyService } from '@artstesh/postboy';
import { PostboyServiceMock } from '../../mocks/postboy-service-mock';
import { PostboyWorld } from '../../services/postboy.world';
import { Forger } from '@artstesh/forger';
import { should } from '@artstesh/it-should';

class HandledQuery extends PostboyCallbackMessage<string> {
  static readonly ID = 'c3d4a8f1-7b2e-4c9a-9d05-1f6e8a2b4c70';

  constructor() {
    super();
  }
}

class StubQuery extends PostboyCallbackMessage<string> {
  static readonly ID = 'e8a1c5d9-4f07-4b3e-8a62-9c1d5e7f3a20';

  constructor() {
    super();
  }
}

// The standard IPostboyDependingService shape: a real service subscribing in its
// constructor and completing the caller's query with finish().
class RealHandler {
  constructor(postboy: PostboyService) {
    postboy.sub(HandledQuery).subscribe((q) => q.finish('handled'));
  }
}

describe('PostboyServiceMock', () => {
  let world: PostboyWorld;

  beforeEach(() => (world = new PostboyWorld({ strict: true })));
  afterEach(() => world.dispose());

  describe('callback results recorded from fire()', () => {
    it('records the result of a real handler finishing a message fired with fire', async () => {
      world.registry.recordSubject(HandledQuery);
      new RealHandler(world.postboy);
      //
      world.postboy.fire(new HandledQuery());
      const result = await world.waiter.waitForCallbackResult(HandledQuery, { includeHistory: true });
      //
      should().string(result).equals('handled');
      should().number(world.history.callbackResults(HandledQuery).length).equals(1);
    });

    it('feeds a waiter subscribed before the fire', async () => {
      world.registry.recordSubject(HandledQuery);
      new RealHandler(world.postboy);
      const promise = world.waiter.waitForCallbackResult(HandledQuery);
      //
      world.postboy.fire(new HandledQuery());
      //
      await promise;
    });

    it('records the stub result when the message is fired with fire', async () => {
      const value = Forger.create<string>()!;
      world.given.callback(StubQuery, value);
      //
      world.postboy.fire(new StubQuery());
      const result = await world.waiter.waitForCallbackResult(StubQuery, { includeHistory: true });
      //
      should().string(result).equals(value);
    });
  });

  describe('finish interception', () => {
    it('wraps finish only once when fire and fireCallback both touch the message', () => {
      world.registry.recordSubject(StubQuery);
      const message = new StubQuery();
      world.postboy.fire(message);
      world.postboy.fireCallback(message).subscribe();
      //
      message.finish('once');
      //
      // a missing interception guard would wrap twice and record the result twice
      should().number(world.history.callbackResults(StubQuery).length).equals(1);
    });
  });

  describe('constructor', () => {
    it('rejects a mock created without a MessageHistory', () => {
      expect(() => new PostboyServiceMock({ strict: false } as any)).toThrow(/MessageHistory/);
    });
  });

  describe('missing id warning', () => {
    it('warns once for a message class without an id in non-strict mode', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const lax = new PostboyWorld();
      class Probe {}

      lax.postboy.fire(new Probe() as any);
      lax.postboy.fire(new Probe() as any);
      //
      should().number(warn.mock.calls.length).equals(1);
      expect(warn.mock.calls[0][0]).toContain('Probe');
      warn.mockRestore();
      lax.dispose();
    });

    it('does not warn for proper messages', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      world.registry.recordSubject(HandledQuery);
      //
      world.postboy.fire(new HandledQuery());
      //
      should().number(warn.mock.calls.length).equals(0);
      warn.mockRestore();
    });

    it('warns once for an executor without an id in non-strict mode', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const lax = new PostboyWorld();
      class ProbeExecutor {}

      lax.postboy.exec(new ProbeExecutor() as any);
      //
      should().number(warn.mock.calls.length).equals(1);
      expect(warn.mock.calls[0][0]).toContain('ProbeExecutor');
      warn.mockRestore();
      lax.dispose();
    });
  });
});
