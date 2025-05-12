import { MessageType, PostboyGenericMessage } from '@artstesh/postboy';
import { Subject } from 'rxjs';

export interface MockRecord<T extends PostboyGenericMessage> {
  key: string;
  sub?: Subject<T>;
}
