import { PostboyWorld } from '../services/postboy.world';
import { TestService } from './sut/test.service';
import { Forger } from '@artstesh/forger';
import { CountCandiesQuery } from './sut/messages/count-candies.query';
import { WeighCandiesExecutor } from './sut/messages/weigh-candies.executor';
import { CandiesHaveBeenWeighedEvent } from './sut/messages/candies-have-been-weighed.event';
import { should } from '@artstesh/it-should';
import { SomethingCalculatedEvent } from './sut/messages/something-calculated.event';

describe('TestService', () => {
  let world: PostboyWorld;
  let service: TestService;
  let color: 'red' | 'blue';

  beforeEach(() => {
    color = Forger.create<'red' | 'blue'>()!;
    world = new PostboyWorld({ strict: true });
    service = new TestService(world.postboy, color);
  });

  afterEach(() => {
    world.dispose();
  });

  describe('strict', () => {
    beforeEach(() => {
      world = new PostboyWorld({ strict: true });
      service = new TestService(world.postboy, color);
    });

    it('success', async () => {
      const count = Forger.create<number>()!;
      const weight = Forger.create<number>()!;
      world.given
        .callback(CountCandiesQuery, count)
        .executor(WeighCandiesExecutor, weight);
      //
      service.up();
      //
      const ev = await world.waiter.waitFor(CandiesHaveBeenWeighedEvent, {includeHistory: true});
      should().number(ev.weight).equals(weight);
    });

    it('should throw if unregistered', () => {
      expect(() => service.calculateSomething(Forger.create<number>()!, Forger.create<number>()!)).toThrow();
    });
  });

  describe('non-strict', () => {
    beforeEach(() => {
      world = new PostboyWorld({ strict: false });
      service = new TestService(world.postboy, color);
    });

    it('should ignore unregistered',async () => {
      const result = service.calculateSomething(Forger.create<number>()!, Forger.create<number>()!);
      //
      const ev = await world.waiter.waitFor(SomethingCalculatedEvent, {includeHistory: true});
      should().number(ev.something).equals(result);
    });
  });
});
