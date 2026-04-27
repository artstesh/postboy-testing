import { PostboyGenericMessage } from '@artstesh/postboy';

export class CandiesHaveBeenWeighedEvent extends PostboyGenericMessage {
  static readonly ID = 'd3434f3a-56ff-4af8-93df-aa690d051bbb';

  constructor(public weight: number) {
    super();
  }
}
