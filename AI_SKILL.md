# AI_SKILL.md — @artstesh/postboy-testing v3.4 (Context Document for AI Agents)

> Source of truth: `src/index.ts` + `src/**/*.ts` of this repository. This document targets **consumers** writing tests against the `@artstesh/postboy` message bus, not contributors.

## 1. 🚀 SCOPE & IMPORTS

`@artstesh/postboy-testing` is a BDD-style (Given / When / Then) testing toolkit for the `@artstesh/postboy` message bus. It provides: a recording `PostboyServiceMock` (captures fired messages, subscriptions, and callback results), fluent assertion builders (`fired`/`subscribed`/`notFired`), async waiters (`waitFor`, `waitForMany`, `waitForAny`, `waitForCallbackResult`, `waitForNone`), and mock stubs for executors / callback messages / events. Runtime dependencies are peer deps: `rxjs ^7` and `@artstesh/postboy ~3.4.1` — you must install both.

Dual-format build (tsup); named exports only, no default export.

```ts
// ESM / TypeScript
import { PostboyWorld, PostboyServiceMock, MessageHistory, HistoryCollection } from '@artstesh/postboy-testing';

// CommonJS
const { PostboyWorld } = require('@artstesh/postboy-testing');
```

Full export list from the package root: `PostboyServiceMock`, `HistoryCollection`, `PostboyTestingSettings`, `MessageHistory`, `PostboyWorld`, `PostboyMessageStreamService`, `PostboyWorldVerifier`, `PostboyWaiterService`, `WaitOptions`, `PostboyGivenService`, `PostboyThenService`.

NOT exported from the root (do not import): `PostboyFiredThen`, `PostboySubscribedThen`, `CallbackResultHistoryItem`, `PostboyCallbackResult`, `WaitManyOptions`, `WaitSilenceOptions`, `PostboyMessageStoreMock`, `PostboyMiddlewareServiceMock`, `PostboyNamespaceStoreMock`. They are reachable only through the public classes' return types.

## 2. 🛠️ CORE API REFERENCE

### PostboyWorld — the aggregate entry point

```ts
class PostboyWorld {
  constructor(settings: PostboyTestingSettings = { strict: false });

  get postboy(): PostboyServiceMock;   // inject this wherever the SUT expects a PostboyService
  get history(): MessageHistory;
  get given(): PostboyGivenService;    // stub executors / callbacks / events
  get then(): PostboyThenService;      // fluent assertions on recorded history
  get waiter(): PostboyWaiterService;  // promise-based async waits
  get mocks(): PostboyMessageStreamService;
  get registry(): PostboyAbstractRegistrator; // namespace registrator used internally for mocks/waiters

  dispose(): void; // resets history, tears down mock+waiter namespaces, disposes the bus — call in afterEach
}
```

`strict: false` (default) makes the mock auto-register unseen message IDs with a dummy `Subject` and unseen executors with a `null`-returning function, so the SUT can fire/exec without prior setup. `strict: true` reproduces real-bus behavior (throws on unregistered IDs).

### PostboyServiceMock

Extends `PostboyService` (all real bus methods work). Overrides add recording:

```ts
fire<T extends PostboyGenericMessage>(message: T): void;            // records message
exec<E extends PostboyExecutor<T>, T>(executor: E): T;              // records executor as message
sub<T extends PostboyGenericMessage>(type: MessageType<T>): Observable<T>;  // increments subscription counter
once<T extends PostboyGenericMessage>(type: MessageType<T>): Observable<T>; // also counted
fireCallback<T>(message: PostboyCallbackMessage<T>, action?: (e: T) => void): Observable<T>; // records + intercepts finish() to record results
```

### PostboyGivenService — stubbing (all methods chainable, return `this`)

```ts
callback<T extends PostboyCallbackMessage<R>>(type: MessageType<T>, result: R): PostboyGivenService;
// subscribes to the message and calls m.finish(result) on every fire

executor<R, T extends PostboyExecutor<R>>(type: MessageType<T>, result: R): PostboyGivenService;
// registers an executor that returns `result`

event<T extends PostboyGenericMessage>(message: T): PostboyGivenService;
// records a ReplaySubject for the message's type AND immediately fires the instance
```

### PostboyThenService — assertions (throw plain `Error` on failure)

```ts
then.fired<T extends PostboyMessage>(type: MessageType<T>): PostboyFiredThen<T>;
then.notFired<T extends PostboyMessage>(type: MessageType<T>): PostboyThenService;
then.subscribed<T extends PostboyMessage>(type: MessageType<T>): PostboySubscribedThen<T>;
```

`PostboyFiredThen<T>` (chainable, `.and()` returns the `PostboyThenService` back):

```ts
.once(): PostboyFiredThen<T>;                              // exactly 1 fire
.times(count: number): PostboyFiredThen<T>;                // exact count
.atLeast(count: number): PostboyFiredThen<T>;
.with(predicate: (m: T) => boolean): PostboyFiredThen<T>;  // any historical message matches
.last(predicate: (m: T) => boolean): PostboyFiredThen<T>;  // most recent message matches
.first(predicate: (m: T) => boolean): PostboyFiredThen<T>; // earliest message matches
get value(): T;                                            // last fired instance; throws if none
and(): PostboyThenService;
```

`PostboySubscribedThen<T>`: `.once()`, `.times(n)`, `.atLeast(n)`, `.and()`.

### PostboyWaiterService — async waits (default timeout 1000 ms; rejects with `Error` on timeout)

```ts
waitFor<T extends PostboyGenericMessage>(type: MessageType<T>, options?: WaitOptions<T>): Promise<T>;
waitForMany<T extends PostboyGenericMessage>(type: MessageType<T>, count: number, options?: WaitManyOptions<T>): Promise<T[]>;
waitForAny<T extends PostboyGenericMessage>(types: MessageType<any>[], options?: WaitOptions<any>): Promise<T>;
waitForCallbackResult<T extends PostboyCallbackMessage<R>>(type: MessageType<T>, options?: WaitOptions<T>): Promise<R>;
waitForNone<T extends PostboyGenericMessage>(type: MessageType<T>, options?: WaitSilenceOptions<T>): Promise<void>;
delay(ms: number): Promise<void>;
dispose(): void;
```

Waiter semantics:

- `waitFor`: resolves with the first future message matching `where` (or any message if omitted); `includeHistory: true` first scans already-recorded messages and resolves synchronously if found.
- `waitForMany`: collects until `count` matches; with `exact: true` it waits the full timeout and resolves only if exactly `count` arrived (rejecting on both under- and over-count at timeout); without `exact` it resolves as soon as `count` are collected (history counts toward the total when `includeHistory`).
- `waitForAny`: races several types; resolves with the first matching message of any type.
- `waitForCallbackResult`: resolves with the result of the next (or already-recorded) `message.finish(result)` for the given callback message type; emits through `history.callbackResult$(type)`.
- `waitForNone`: resolves after `timeout` ms of silence; rejects immediately if a matching message fires (or was found in history with `includeHistory`). `timeoutMessage` overrides the rejection text.

### MessageHistory & HistoryCollection

```ts
class MessageHistory {
  messages<T extends PostboyMessage>(type: MessageType<T>): HistoryCollection<T>;
  callbackResults<T extends PostboyCallbackMessage<R>>(type: MessageType<T>): HistoryCollection<{ message: T; result: R }>;
  callbackResult$<T extends PostboyCallbackMessage<R>>(type: MessageType<T>): Observable<{ message: T; result: R }>; // hot stream of finish() results
  subs<T extends PostboyMessage>(type: MessageType<T>): number;   // subscription count
  reset(): void;                                                   // clears everything, completes subjects
}

class HistoryCollection<T> {
  add(item: T): void;
  hasItem(item: T): boolean;
  has(predicate: (i: T) => boolean): boolean;
  get last(): T | null; get first(): T | null; get all(): T[]; get length(): number;
  clear(): void;
}
```

### PostboyWorldVerifier — boolean (non-throwing) checks

```ts
subscribed<T extends PostboyMessage>(type: MessageType<T>, times: number = 0): boolean; // true if subscribed at all; exact count if times > 0
fired<T extends PostboyMessage>(type: MessageType<T>, times: number = 0): boolean;
```

### PostboyMessageStreamService — low-level mock stream control

```ts
constructor(postboy: PostboyServiceMock, registry: PostboyAbstractRegistrator);
mockEvent<T extends PostboyMessage>(message: T): void;                       // recordReplay + immediate fire
mockCallback<R, T extends PostboyCallbackMessage<R>>(type: MessageType<T>, action: (m: T) => R): void; // subscribes, finish(action(m))
mockExecute<R, T extends PostboyExecutor<R>>(type: MessageType<T>, action: (m: T) => R): void;         // registers executor fn
dispose(): void; // unsubscribes + registry.down()
```

## 3. 📐 TYPESCRIPT TYPES

```ts
interface PostboyTestingSettings { strict: boolean }

interface WaitOptions<T extends PostboyGenericMessage> {
  timeout?: number;                      // ms, default 1000
  where?: (message: T) => boolean;       // filter
  includeHistory?: boolean;              // also consider already-recorded messages
}

// extends WaitOptions (not exported from root):
interface WaitManyOptions<T extends PostboyGenericMessage> extends WaitOptions<T> { exact?: boolean }
interface WaitSilenceOptions<T extends PostboyGenericMessage> {
  timeout?: number; where?: (message: T) => boolean; includeHistory?: boolean; timeoutMessage?: string;
}

// inferred callback result type (not exported from root; inferred by PostboyGivenService.callback):
type PostboyCallbackResult<T> = T extends PostboyCallbackMessage<infer R> ? R : never;
```

Types re-used from the peer `@artstesh/postboy`: `MessageType<T>`, `PostboyGenericMessage`, `PostboyCallbackMessage<T>`, `PostboyExecutor<T>`, `PostboyMessage`, `PostboyAbstractRegistrator`, `AddNamespace`, `EliminateNamespace`. Message classes under test must still follow postboy rules (`static readonly ID`, unique per class).

## 4. 💡 BEST PRACTICES & IDIOMATIC USAGE

Canonical flow: **create world → stub with `given` → run SUT with `world.postboy` → assert with `then` / await with `waiter` → `world.dispose()`**.

```ts
import { PostboyWorld } from '@artstesh/postboy-testing';

describe('CandiesService', () => {
  let world: PostboyWorld;

  beforeEach(() => (world = new PostboyWorld()));           // or new PostboyWorld({ strict: true })
  afterEach(() => world.dispose());

  it('fires WeighCandiesExecutor and publishes the weighed event', async () => {
    // Given — stub the bus
    world.given.executor(CountCandiesQuery, 42);
    world.given.callback(FetchDataMessage, 'payload');
    world.given.event(new CandiesHaveBeenWeighedEvent(3));

    // When — hand the mock bus to the system under test
    const service = new TestService(world.postboy);
    service.doWork();

    // Then — synchronous assertions
    world.then.fired(WeighCandiesExecutor).once();
    world.then.fired(CandiesHaveBeenWeighedEvent).with((m) => m.count === 3).and().notFired(SomethingCalculatedEvent);
    world.then.subscribed(CountCandiesQuery).atLeast(1);
    const last = world.then.fired(WeighCandiesExecutor).value;

    // Async — wait for messages that arrive later
    const event = await world.waiter.waitFor(CandiesHaveBeenWeighedEvent, {
      timeout: 2000,
      where: (m) => m.count > 0,
    });
    const results = await world.waiter.waitForMany(CandiesHaveBeenWeighedEvent, 3, { includeHistory: true });
    const payload = await world.waiter.waitForCallbackResult(FetchDataMessage);
    await world.waiter.waitForNone(SomethingCalculatedEvent, { timeout: 500 });
  });
});
```

Rules of composition:

- Always pass `world.postboy` (a `PostboyServiceMock`) into the SUT — recording only happens through the mock, never through a plain `PostboyService`.
- Call `world.dispose()` in `afterEach`; it resets history, unsubscribes mocks, tears down the internal `mock-namespace…` / `waiter-namespace…` registrators, and disposes the bus. The world is not reusable after dispose.
- Prefer `given.*` over raw `mocks.*`; use `mocks` directly only when you need a custom action function (`(m) => R`) instead of a constant result.
- `given.event(msg)` both registers a replay subject AND fires immediately — for "latest value on subscribe" semantics of a future event, use `world.registry.recordReplay(Type)` instead.
- Assertion methods throw (`times`, `with`, `last`, `first`, `notFired`); `PostboyWorldVerifier` returns booleans — use it inside conditional test logic, use `then` for straight assertions.
- All waiter timeouts reject with descriptive `Error` messages that include the class name and counts — assert on behavior, not on message text.

## 5. ⚠️ ANTI-PATTERNS & PITFALLS

**Do NOT generate these (common LLM hallucinations):**

- `world.when(...)` — there is no When service. The "when" step is ordinary test code driving the SUT.
- `expect(world.then.fired(X)).toBe(true)` — `then.fired(X)` returns a `PostboyFiredThen` builder, not a boolean. Booleans live on `PostboyWorldVerifier` (`verifier.fired(X)`).
- `world.given.fired(...)` / `world.given.subscribed(...)` — Given only has `callback`, `executor`, `event`.
- `waiter.wait(...)` / `waitForEvent(...)` / `waitForSilence(...)` — the methods are exactly `waitFor`, `waitForMany`, `waitForAny`, `waitForCallbackResult`, `waitForNone`, `delay`.
- Importing `PostboyFiredThen`, `WaitManyOptions`, `WaitSilenceOptions`, `PostboyMessageStoreMock`, etc. from the package root — they are not in `src/index.ts`; they only appear as inferred return/parameter types.
- `new PostboyWorld(new MessageHistory())` or passing a `PostboyService` — the constructor takes only `PostboyTestingSettings`. The world builds its own history/mock; access them via getters.
- `postboy.sub(X).next(...)` — `sub` returns an `Observable`, never a Subject. To emit, use `fire`/`given.event`.
- Assuming `exec` is async — it is synchronous and returns `T` directly; only waiters and `fireCallback` are async.
- `world.reset()` / `world.clear()` — history is cleared via `world.history.reset()` or `world.dispose()`.

**Hard constraints:**

- Never construct `PostboyServiceMock` without a `MessageHistory` — the first constructor argument is the shared history instance; use `PostboyWorld` instead of wiring manually.
- Never reuse a `PostboyWorld` across tests without `dispose()` — history counters accumulate and `times`/`once` assertions will see stale records.
- Do not call `world.dispose()` twice or use the world afterwards; its namespaces are eliminated and the bus disposed.
- `given.event()` overwrites the replay registration for that message type and fires immediately; calling it repeatedly records multiple fires — intentional in `times(n)` tests, a false positive otherwise.
- In `strict: true` mode, fire/sub of unregistered message types throws (real-bus behavior) — every type used by the SUT must be registered first (e.g. via `world.registry.recordSubject(Type)` or `given`).
- `waitForMany` with `exact: true` always waits until timeout before resolving (it must prove no extra messages arrived) — do not use it when speed matters; omit `exact` for early resolve.
- Waiters use their own namespaced registrator; do not eliminate the `waiter-namespace…` / `mock-namespace…` namespaces manually — that breaks `dispose()`.
