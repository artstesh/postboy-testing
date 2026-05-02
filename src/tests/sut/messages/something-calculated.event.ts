import { PostboyGenericMessage } from '@artstesh/postboy';

export class SomethingCalculatedEvent extends PostboyGenericMessage {
  static readonly ID = '42336b3b-1cdd-4d79-89cb-db844a467587';

  constructor(public something: number) {
    super();
  }
}
