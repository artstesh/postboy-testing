import { PostboyGenericMessage } from '@artstesh/postboy';

export interface WaitSilenceOptions<T extends PostboyGenericMessage> {
  timeout?: number;
  where?: (message: T) => boolean;
  includeHistory?: boolean;
  timeoutMessage?: string;
}
