import { PostboyCallbackMessage } from '@artstesh/postboy';

export class CountCandiesQuery extends PostboyCallbackMessage<number> {
  static ID = 'count-candies';

  constructor(public color: 'red' | 'blue') {
    super();
  }
}
