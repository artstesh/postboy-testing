import { PostboyGenericMessage, PostboyService } from '@artstesh/postboy';
import { PostboyWorld } from '../../services/postboy.world';
import { Forger } from '@artstesh/forger';
import { should } from '@artstesh/it-should';

class PreFireEvent extends PostboyGenericMessage {
  static readonly ID = '3bede7a9-7b36-4f5f-9f02-6908787ef785';

  constructor(public value: number) {
    super();
  }
}

class PreFireEventHandler {
  public value: number = 0;

  constructor(private postboy: PostboyService) {
    postboy.sub(PreFireEvent).subscribe((ev) => (this.value = ev.value));
  }
}

describe('Subscribe Events', () => {
  let world: PostboyWorld;
  let handler: PreFireEventHandler;

  beforeEach(() => {
    world = new PostboyWorld();
    handler = new PreFireEventHandler(world.postboy);
  });

  afterEach(() => {
    world.dispose();
  });

  describe('strict', () => {
    beforeEach(() => {
      world = new PostboyWorld({ strict: true });
    });

    it('should be fired', () => {
      const value = Forger.create<number>()!;
      world.given.event(new PreFireEvent(value));
      //
      handler = new PreFireEventHandler(world.postboy);
      //
      expect(handler.value).toBe(value);
    });

    it('history works', () => {
      const value = Forger.create<number>()!;
      world.given.event(new PreFireEvent(value));
      //
      handler = new PreFireEventHandler(world.postboy);
      //
      should().number(world.history.subs(PreFireEvent)).equals(1);
    });
  });

  describe('non-strict', () => {
    beforeEach(() => {
      world = new PostboyWorld({ strict: false });
    });

    it('should be fired', () => {
      const value = Forger.create<number>()!;
      handler = new PreFireEventHandler(world.postboy);
      //
      world.postboy.fire(new PreFireEvent(value));
      //
      expect(handler.value).toBe(value);
    });

    it('history works', () => {
      handler = new PreFireEventHandler(world.postboy);
      //
      should().number(world.history.subs(PreFireEvent)).equals(1);
    });
  });
});
