import { PostboyGenericMessage, PostboyService } from '@artstesh/postboy';
import { PostboyWorld } from '../../services/postboy.world';
import { Forger } from '@artstesh/forger';
import { should } from '@artstesh/it-should';

class PaymentCompletedEvent extends PostboyGenericMessage {
  static readonly ID = '3bede7a9-7b36-4f5f-9f02-6908787ef785';

  constructor(public amount: number) {
    super();
  }
}

class PaymentService {
  constructor(private postboy: PostboyService) {}

  public process = (value: number) => this.postboy.fire(new PaymentCompletedEvent(value));
}

describe('Fire Events', () => {
  let world: PostboyWorld;
  let service: PaymentService;
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
      service = new PaymentService(world.postboy);
    });

    it('history works', () => {
      world.registry.recordSubject(PaymentCompletedEvent);
      //
      service.process(value);
      //
      let ev = world.history.messages(PaymentCompletedEvent).first;
      should().number(ev!.amount).equals(value);
      should().objects({}, {}).equal();
    });

    it('waitFor works', async () => {
      world.registry.recordSubject(PaymentCompletedEvent);
      //
      service.process(value);
      //
      let ev = await world.waiter.waitFor(PaymentCompletedEvent, { includeHistory: true });
      should().number(ev!.amount).equals(value);
    });

    it('fires PaymentCompletedEvent after processing', () => {
      world.registry.recordSubject(PaymentCompletedEvent);
      const service = new PaymentService(world.postboy);
      //
      service.process(value);
      //
      world.then
        .fired(PaymentCompletedEvent)
        .once()
        .with((event) => event.amount === value);
    });
  });

  describe('non-strict', () => {
    beforeEach(() => {
      world = new PostboyWorld({ strict: false });
      service = new PaymentService(world.postboy);
    });

    it('history works', () => {
      service.process(value);
      //
      let ev = world.history.messages(PaymentCompletedEvent).first;
      should().number(ev!.amount).equals(value);
    });

    it('waitFor works', async () => {
      service.process(value);
      //
      let ev = await world.waiter.waitFor(PaymentCompletedEvent, { includeHistory: true });
      should().number(ev!.amount).equals(value);
    });

    it('then.fired works', async () => {
      service.process(value);
      //
      world.then.fired(PaymentCompletedEvent).with((ev) => ev.amount === value);
    });

    it('fires PaymentCompletedEvent after processing', () => {
      const service = new PaymentService(world.postboy);
      //
      service.process(value);
      //
      world.then
        .fired(PaymentCompletedEvent)
        .once()
        .with((event) => event.amount === value);
    });
  });
});
