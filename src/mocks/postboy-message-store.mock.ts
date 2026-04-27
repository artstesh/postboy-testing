import { PostboyMessageStore } from '@artstesh/postboy';
import { PostboySubscription } from '@artstesh/postboy/lib/models/postboy-subscription';
import { PostboyExecutor } from '@artstesh/postboy/lib/models/postboy-executor';
import { Subject } from 'rxjs';

export class PostboyMessageStoreMock extends PostboyMessageStore {

  constructor(private strict: boolean) {
    super();
  }

  override getMessage(id: string, name: string): PostboySubscription<any> {
    if (!this.strict && !this.messages.get(id)) this.registerMessage(id, new PostboySubscription(new Subject()));
    return super.getMessage(id, name);
  }

  override getExecutor<T>(id: string): (e: PostboyExecutor<T>) => T {
    if (!this.strict && !this.executors.get(id)) this.registerExecutor(id, (e: PostboyExecutor<T>) => null);
    return super.getExecutor(id);
  }
}
