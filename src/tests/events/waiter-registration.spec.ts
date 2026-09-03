import { PostboyGenericMessage, PostboyService } from '@artstesh/postboy';
import { PostboyWorld } from '../../services/postboy.world';
import { Forger } from '@artstesh/forger';
import { should } from '@artstesh/it-should';

class WaitedEvent extends PostboyGenericMessage {
  static readonly ID = 'b4b6370b-23a8-4c46-9f34-1f4f9df5f60c';

  constructor(public value: number) {
    super();
  }
}

class WaitedEventHandler {
  public values: number[] = [];

  constructor(private postboy: PostboyService) {
    postboy.sub(WaitedEvent).subscribe((ev) => this.values.push(ev.value));
  }
}

describe('Waiter Registrations', () => {
  let world: PostboyWorld;

  beforeEach(() => {
    world = new PostboyWorld({ strict: false });
  });

  afterEach(() => {
    world.dispose();
  });

  it('does not steal the stream from existing subscribers', async () => {
    const handler = new WaitedEventHandler(world.postboy);
    const value = Forger.create<number>()!;
    const waiting = world.waiter.waitFor(WaitedEvent);
    //
    world.postboy.fire(new WaitedEvent(value));
    //
    await waiting;
    expect(handler.values).toEqual([value]);
  });

  it('keeps the replay buffer registered by given.event', async () => {
    world = new PostboyWorld({ strict: true });
    const value = Forger.create<number>()!;
    world.given.event(new WaitedEvent(value));
    const pending = world.waiter.waitFor(WaitedEvent, { timeout: 50 }).catch(() => undefined);
    //
    const handler = new WaitedEventHandler(world.postboy);
    //
    expect(handler.values).toEqual([value]);
    await pending;
  });

  it('still registers unknown types in strict mode', async () => {
    world = new PostboyWorld({ strict: true });
    const value = Forger.create<number>()!;
    const waiting = world.waiter.waitFor(WaitedEvent, { timeout: 50 });
    //
    world.postboy.fire(new WaitedEvent(value));
    //
    should()
      .number((await waiting).value)
      .equals(value);
  });
});
