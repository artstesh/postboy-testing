import { PostboyGenericMessage } from '@artstesh/postboy';
import { PostboyWorld } from '../../services/postboy.world';

class CountedEvent extends PostboyGenericMessage {
  static readonly ID = '6d64b1b1-61f4-4d19-9d92-4c9d64a3d0aa';

  constructor(public value: number) {
    super();
  }
}

describe('Waiter waitForMany', () => {
  let world: PostboyWorld;

  beforeEach(() => {
    world = new PostboyWorld({ strict: false });
  });

  afterEach(() => {
    world.dispose();
  });

  it('rejects immediately when exact count is exceeded', async () => {
    const timeout = 5000;
    const waiting = world.waiter.waitForMany(CountedEvent, 1, { exact: true, timeout });
    const startedAt = Date.now();
    //
    world.postboy.fire(new CountedEvent(1));
    world.postboy.fire(new CountedEvent(2));
    //
    await expect(waiting).rejects.toThrow('exactly 1 time(s), but got 2');
    expect(Date.now() - startedAt).toBeLessThan(timeout);
  });

  it('resolves exactly in count messages when exact is set', async () => {
    const waiting = world.waiter.waitForMany(CountedEvent, 2, { exact: true, timeout: 100 });
    //
    world.postboy.fire(new CountedEvent(1));
    world.postboy.fire(new CountedEvent(2));
    //
    expect((await waiting).map((m) => m.value)).toEqual([1, 2]);
  });

  it('rejects by timeout when exact count is not reached', async () => {
    const waiting = world.waiter.waitForMany(CountedEvent, 2, { exact: true, timeout: 50 });
    //
    world.postboy.fire(new CountedEvent(1));
    //
    await expect(waiting).rejects.toThrow('exactly 2 time(s), but got 1');
  });
});
