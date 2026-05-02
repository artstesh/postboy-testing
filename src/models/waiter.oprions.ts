import { PostboyGenericMessage } from '@artstesh/postboy';

export interface WaitOptions<T extends PostboyGenericMessage> {
  timeout?: number;
  where?: (message: T) => boolean;
  includeHistory?: boolean;
}
