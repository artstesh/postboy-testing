import { PostboyWorld } from '../services/postboy.world';
import { PostboyServiceMock } from '../services/postboy-service-mock';
import { TestService } from './sut/test.service';
import { Forger } from '@artstesh/forger';
import { CountCandiesQuery } from './sut/messages/count-candies.query';
import { WeighCandiesExecutor } from './sut/messages/weigh-candies.executor';
import { CandiesHaveBeenWeighedEvent } from './sut/messages/candies-have-been-weighed.event';
import { should } from '@artstesh/it-should';

describe('TestService', () => {
  let world: PostboyWorld;
  let service: TestService;
  let color: 'red' | 'blue';

  beforeEach(() => {
    color = Forger.create<'red' | 'blue'>()!;
    world = new PostboyWorld({strict: true});
    service = new TestService(world.postboy, color);
  });

  afterEach(() => {
    world.dispose();
  });

  it('success', (done) => {
    const count = Forger.create<number>()!;
    const weight = Forger.create<number>()!;
    world.mocks.mockCallback(CountCandiesQuery, () => count);
    world.mocks.mockExecute(WeighCandiesExecutor, () => weight);
    world.mocks.mockSub(CandiesHaveBeenWeighedEvent, ev => {
      should().number(ev.weight).equals(weight);
      done();
    });
    //
    service.up();
  });
});
