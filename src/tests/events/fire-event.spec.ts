import { PostboyGenericMessage, PostboyService } from '@artstesh/postboy';
import { PostboyWorld } from '../../services/postboy.world';
import { TestService } from '../sut/test.service';
import { Forger } from '@artstesh/forger';
import { should } from '@artstesh/it-should';

class ToFireEvent extends PostboyGenericMessage {
  static readonly ID = '3bede7a9-7b36-4f5f-9f02-6908787ef785';

  constructor(public value: number) {
    super();
  }
}

class FireManager {
  constructor(private postboy: PostboyService) {}

  public fire = (value: number) => this.postboy.fire(new ToFireEvent(value));
}

describe('Fire Events', () => {
  let world: PostboyWorld;
  let service: FireManager;
  let value: number;

  beforeEach(() => {
    value = Forger.create<number>()!;
  });

  afterEach(() => {
    world.dispose();
  });

  describe('strict', () => {
    beforeEach(() => {
      world = new PostboyWorld({ strict: true });
      service = new FireManager(world.postboy);
    });

    it('history works', () => {
      world.registry.recordSubject(ToFireEvent);
      //
      service.fire(value);
      //
      let ev = world.history.messages(ToFireEvent).first;
      should().number(ev!.value).equals(value);
    });

    it('waitFor works', async () => {
      world.registry.recordSubject(ToFireEvent);
      //
      service.fire(value);
      //
      let ev = await world.waiter.waitFor(ToFireEvent, {includeHistory: true});
      should().number(ev!.value).equals(value);
    });
  });

  describe('non-strict', () => {
    beforeEach(() => {
      world = new PostboyWorld({ strict: false });
      service = new FireManager(world.postboy);
    });

    it('history works', () => {
      service.fire(value);
      //
      let ev = world.history.messages(ToFireEvent).first;
      should().number(ev!.value).equals(value);
    });

    it('waitFor works', async () => {
      service.fire(value);
      //
      let ev = await world.waiter.waitFor(ToFireEvent, {includeHistory: true});
      should().number(ev!.value).equals(value);
    });

    it('then.fired works', async () => {
      service.fire(value);
      //
      world.then.fired(ToFireEvent).with((ev) => ev.value === value);
    });
  });
});
