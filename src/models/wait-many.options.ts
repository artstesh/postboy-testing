import { WaitOptions } from './waiter.options';
import { PostboyGenericMessage } from '@artstesh/postboy';

export interface WaitManyOptions<T extends PostboyGenericMessage> extends WaitOptions<T> {
  exact?: boolean;
}
