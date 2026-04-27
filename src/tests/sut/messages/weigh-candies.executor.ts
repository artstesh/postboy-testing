import { PostboyExecutionHandler, PostboyExecutor } from '@artstesh/postboy';

export class WeighCandiesExecutor extends PostboyExecutor<number> {
  static ID = 'weigh-candies';
  constructor(
    public count: number,
    public color: 'red' | 'blue',
  ) {
    super();
  }
}

// tslint:disable-next-line:max-classes-per-file
export class WeighCandiesHandler extends PostboyExecutionHandler<number, WeighCandiesExecutor> {
  handle(query: WeighCandiesExecutor): number {
    return query.count * (query.color === 'red' ? 10 : 5);
  }
}
