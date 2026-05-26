import { PostboyCallbackMessage, PostboyGenericMessage, PostboyService } from '@artstesh/postboy';
import { PostboyWorld } from '../../services/postboy.world';
import { Forger } from '@artstesh/forger';
import { should } from '@artstesh/it-should';

class ToFireQuery extends PostboyCallbackMessage<string> {
  static readonly ID = '8ec5e78c-f010-4ccf-8859-c6f8d50ad0df';

  constructor() {
    super();
  }
}

class FireManager {
  public value: string = '';

  constructor(private postboy: PostboyService) {}

  public fire = () => {
    this.postboy.fireCallback(new ToFireQuery()).subscribe((v) => {
      this.value = v;
    });
  };
}

describe('Fire Callback Events', () => {
  let world: PostboyWorld;
  let service: FireManager;
  let value: string;

  beforeEach(() => {
    value = Forger.create<string>()!;
    world = new PostboyWorld({ strict: true });
    service = new FireManager(world.postboy);
    world.given.callback(ToFireQuery, value);
  });

  afterEach(() => {
    world.dispose();
  });

  it('history works', async () => {
    service.fire();
    //
    should().number(world.history.messages(ToFireQuery).length).equals(1);
  });

  it('waitForCallbackResult works', async () => {
    //
    service.fire();
    //
    await world.waiter.waitForCallbackResult(ToFireQuery);
    should().string(service.value).equals(value);
  });

  it('then.fired works', async () => {
    let promise = world.waiter.waitForCallbackResult(ToFireQuery);
    //
    service.fire();
    //
    await promise;
    world.then.fired(ToFireQuery).once();
  });
});
