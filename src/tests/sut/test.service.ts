import { IPostboyDependingService, PostboyCallbackMessage, PostboyExecutor, PostboyService } from '@artstesh/postboy';
import { CountCandiesQuery } from './messages/count-candies.query';
import { WeighCandiesExecutor } from './messages/weigh-candies.executor';
import { CandiesHaveBeenWeighedEvent } from './messages/candies-have-been-weighed.event';
import { SomethingCalculatedEvent } from './messages/something-calculated.event';

export class TestService implements IPostboyDependingService {
  constructor(
    private postboy: PostboyService,
    private color: 'red' | 'blue',
  ) {}

  up(): void {
    this.postboy.fireCallback(new CountCandiesQuery(this.color)).subscribe((count) => {
      const weight = this.postboy.exec(new WeighCandiesExecutor(count, this.color));
      this.postboy.fire(new CandiesHaveBeenWeighedEvent(weight));
    });
  }

  calculateSomething(x: number, y: number): number {
    const result = x + y;
    this.postboy.fire(new SomethingCalculatedEvent(result));
    return result;
  }
}
