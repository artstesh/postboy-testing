# @artstesh/postboy – condensed reference for AI

## What it is
- Framework-agnostic typed Pub/Sub library for TypeScript.
- Single event bus (`AppPostboyService` extends `PostboyService`).
- Uses RxJS under the hood.
- Homepage: https://postboy.artstesh.ru/overview.html

## Message types

### 1. PostboyGenericMessage
- Fire-and-forget event.
- Base class: `PostboyGenericMessage`.
- Publisher: `postboy.fire(new MyEvent(...))`.
- Subscriber: `postboy.sub(MyEvent).subscribe(...)`.
- No return value.

### 2. PostboyCallbackMessage<T>
- Request–response with typed result `T`.
- Caller calls `postboy.fireCallback(new MyQuery(...))` → receives `Observable<T>`.
- Handler must call `message.finish(result)` to send the result back.
- Handler registered via `postboy.exec(new ConnectMessage(MyQuery, new Subject<MyQuery>()))`
  then `postboy.sub(MyQuery).subscribe(msg => { ... msg.finish(...) })`.

### 3. PostboyExecutor<T>
- Synchronous operation, runs immediately when called.
- Registration:
  - Direct function: `postboy.exec(new ConnectExecutor(MyExec, fn))`
  - Handler class: extends `PostboyExecutionHandler<T, E>`, registered via `ConnectHandler`.
- Execution: `const result: T = postboy.exec(new MyExec(...))`.
- Used for domain operations and infrastructure tasks (ConnectMessage, ConnectExecutor,
  ConnectHandler are themselves executors).

## Registration primitives (infrastructure executors)
- `ConnectMessage(Type, Subject)` – registers a new message type (generic or callback).
- `ConnectExecutor(Type, fn)` – registers a direct function for an executor.
- `ConnectHandler(Type, handlerInstance)` – registers a handler class for an executor.
- All three are invoked via `postboy.exec(...)`.

## Lifecycle management & scoping

### PostboyAbstractRegistrator
- Base class for grouping registrations.
- Lifecycle: `up()` (activates), `down()` (cleans all subscriptions).
- Subclass must implement `_up()`.
- Recording methods:
  - `recordSubject(Type)` – plain Subject.
  - `recordReplay(Type, n)` – ReplaySubject with buffer n.
  - `recordBehavior(Type, initial)` – BehaviorSubject.
  - `recordWithPipe(Type, subject, pipeFactory)` – custom Subject + optional RxJS pipe.
- Can also call `this.registerServices([...])` to activate `IPostboyDependingService` instances;
  their `up()` is called **after** `_up()` completes, ensuring messages are already registered.

### Namespaces
- Lightweight scoping inside a single class.
- `postboy.addNamespace('name').recordSubject(Type)...`
- Subscriptions under that namespace are tracked.
- `postboy.eliminateNamespace('name')` unsubscribes everything.
- Never forget to call `eliminateNamespace` in destructor.

### IPostboyDependingService
- Interface with `up(): void`.
- Purpose: **avoid premature subscriptions in constructor** – service is created before
  registrator sets up message types; `up()` is called later when bus is ready.
- Registered via `registrator.registerServices([svc])`.
- Subscriptions are cleaned up automatically when registrator calls `down()`.

## CQRS-style message organisation (author’s recommendation)
- Four roles based on intent:
  - **Query** (always returns result) → `PostboyCallbackMessage<T>`.
  - **Command** (may return result or void) → `PostboyCallbackMessage<T>`.
  - **Event** (never returns result) → `PostboyGenericMessage`.
  - **Executor** (synchronous, always returns) → `PostboyExecutor<T>`.
- Naming convention: suffixes `Query`, `Command`, `Event`, `Executor`.
- Directory layout: `messages/commands/`, `messages/queries/`, `messages/events/`,
  `messages/executors/`.

## Middleware
- Hooks `beforeExecute` / `afterExecute` on the bus.
- Can inspect, log, block, or augment messages without touching handlers.

## Documentation sections (for reference)
- Overview (landing page)
- Quick Start
- Generic Messages (fire-and-forget)
  - Publish and Subscribe
  - Broadcasting from Services
  - Subscribing in Multiple Components
  - Fire-and-Forget Semantics
  - Common Patterns
- Callback Messages
  - Quick Start
  - Asynchronous Processing (Promise/Observable/HTTP)
  - Cancellation
  - Error Handling & Edge Cases
  - Composing Responses from Multiple Sources
  - Typed Responses with Discriminated Union
- Executors
  - Overview & Core Concepts
  - Registration & Execution
  - Lifecycle
  - Error Handling & Result Semantics
  - Best Practices
- Message Roles (CQRS-style organisation)
- Lifecycle Management & Scoping
  - Concepts & Overview
  - PostboyAbstractRegistrator
  - Namespaces
  - IPostboyDependingService
  - Choosing the Right Scoping Strategy
  - Best Practices & Anti-patterns
