import { PostboyMessageStore } from '@artstesh/postboy';
import { PostboySubscription } from '@artstesh/postboy/lib/models/postboy-subscription';

export class PostboyMessageStoreMock extends PostboyMessageStore {
  get apps(): Map<string, PostboySubscription<any>> {
    return this.applications;
  }

  get execs(): Map<string, (e: any) => void> {
    return this.executors;
  }
}
