import { PostboyCallbackMessage } from '@artstesh/postboy';
import { PostboyWorld } from '../../services/postboy.world';
import { should } from '@artstesh/it-should';

class ToWaitQuery extends PostboyCallbackMessage<string> {
  static readonly ID = '9b41a7c3-52d8-4c6f-b0e1-7d3a94c25f86';

  constructor() {
    super();
  }
}

describe('Waiter Callback Results', () => {
  let world: PostboyWorld;
  let current: string;

  beforeEach(() => {
    world = new PostboyWorld({ strict: true });
    current = 'first';
    world.mocks.mockCallback(ToWaitQuery, () => current);
  });

  afterEach(() => {
    world.dispose();
  });

  it('waits for the next result by default', async () => {
    world.postboy.fireCallback(new ToWaitQuery()).subscribe();
    const promise = world.waiter.waitForCallbackResult(ToWaitQuery);
    current = 'second';
    world.postboy.fireCallback(new ToWaitQuery()).subscribe();
    //
    const result = await promise;
    //
    should().string(result).equals('second');
  });

  it('resolves from the recorded result with includeHistory', async () => {
    world.postboy.fireCallback(new ToWaitQuery()).subscribe();
    //
    const result = await world.waiter.waitForCallbackResult(ToWaitQuery, { includeHistory: true });
    //
    should().string(result).equals('first');
  });

  it('ignores the recorded result with includeHistory false', async () => {
    world.postboy.fireCallback(new ToWaitQuery()).subscribe();
    const promise = world.waiter.waitForCallbackResult(ToWaitQuery, { includeHistory: false });
    current = 'second';
    world.postboy.fireCallback(new ToWaitQuery()).subscribe();
    //
    const result = await promise;
    //
    should().string(result).equals('second');
  });

  it('times out when only recorded results exist', async () => {
    world.postboy.fireCallback(new ToWaitQuery()).subscribe();
    //
    await expect(world.waiter.waitForCallbackResult(ToWaitQuery, { timeout: 50 })).rejects.toThrow(Error);
  });
});
