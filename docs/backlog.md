## 1. Добавить `PostboyWaiter` для ожидания сообщений


## 2. Добавить fluent assertions поверх `PostboyWorldVerifier`

Сейчас `PostboyWorldVerifier` возвращает только boolean:

```textmate
world.verifier.fired(SomeEvent)
world.verifier.subscribed(SomeEvent)
```


Но в тестах удобнее иметь assertion API, который сразу бросает понятную ошибку:

```textmate
world.expect.fired(SomethingCalculatedEvent);
world.expect.firedTimes(SomethingCalculatedEvent, 1);
world.expect.notFired(SomeEvent);
world.expect.subscribed(CountCandiesQuery);
world.expect.subscribedTimes(CountCandiesQuery, 1);
```


И для payload:

```textmate
world.expect.firedWith(SomethingCalculatedEvent, event => {
  return event.something === expected;
});
```


Или:

```textmate
world.expect.last(SomethingCalculatedEvent).toMatch({
  something: expected,
});
```


Плюс — понятные сообщения ошибок:

```plain text
Expected SomethingCalculatedEvent to be fired 1 time, but it was fired 0 times.
```


Это сильно улучшит DX библиотеки.

---

## 3. Добавить `world.verify()` / `world.expect` прямо в `PostboyWorld`

Сейчас `PostboyWorldVerifier` экспортируется, но в `PostboyWorld` его нет.

Было бы удобно:

```textmate
world.expect.fired(SomethingCalculatedEvent);
world.expect.subscribed(CountCandiesQuery);
```


Или:

```textmate
world.verify.fired(SomethingCalculatedEvent);
```


То есть `PostboyWorld` мог бы иметь:

```textmate
get expect() {
  return this._verifier;
}
```


либо отдельный assertion wrapper.

---

## 4. Расширить `MessageHistory`

Сейчас `MessageHistory` умеет:

```textmate
history.messages(Type)
history.subs(Type)
```


Стоит добавить более богатый API:

```textmate
history.allMessages()
history.messagesById(id)
history.last(Type)
history.first(Type)
history.count(Type)
history.has(Type)
history.clear(Type)
history.clearAll()
```


Особенно полезно:

```textmate
world.history.last(SomethingCalculatedEvent)
world.history.count(SomethingCalculatedEvent)
world.history.has(SomethingCalculatedEvent, e => e.something === result)
```


Также полезно хранить не только сами сообщения, но и timestamp/order:

```textmate
interface HistoryRecord<T> {
  message: T;
  type: string;
  timestamp: number;
  order: number;
  source: 'fire' | 'fireCallback' | 'exec';
}
```


Тогда можно проверять порядок:

```textmate
world.expect.order([
  CountCandiesQuery,
  WeighCandiesExecutor,
  CandiesHaveBeenWeighedEvent,
]);
```


---

## 5. Проверка порядка сообщений

Для event-driven/CQRS-сценариев порядок часто важен.

Например:

```textmate
service.up();
```


Ожидаемый порядок:

1. `CountCandiesQuery`
2. `WeighCandiesExecutor`
3. `CandiesHaveBeenWeighedEvent`

Можно дать API:

```textmate
world.expect.firedInOrder([
  CountCandiesQuery,
  WeighCandiesExecutor,
  CandiesHaveBeenWeighedEvent,
]);
```


Или более гибко:

```textmate
world.expect.sequence()
  .then(CountCandiesQuery)
  .then(WeighCandiesExecutor)
  .then(CandiesHaveBeenWeighedEvent)
  .verify();
```


Это хорошо подходит именно для testing-библиотеки к message bus.

---

## 6. Добавить spy-API для сообщений и executors

Сейчас `mockCallback`, `mockSub`, `mockExecute` регистрируют поведение, но не возвращают spy-объект.

Было бы удобно:

```textmate
const countCandies = world.mocks.mockCallback(CountCandiesQuery, () => count);

service.up();

expect(countCandies.calls.length).toBe(1);
expect(countCandies.last.color).toBe(color);
```


Для executors:

```textmate
const weigh = world.mocks.mockExecute(WeighCandiesExecutor, () => weight);

expect(weigh.calledOnce()).toBe(true);
expect(weigh.last.count).toBe(count);
expect(weigh.last.color).toBe(color);
```


Возможный API:

```textmate
const spy = world.mocks.mockCallback(Query, handler);

spy.called();
spy.calledTimes(1);
spy.last;
spy.first;
spy.all;
spy.reset();
```


Это уменьшит необходимость напрямую лезть в `world.history`.

---

## 7. Поддержка async callback mocks

Сейчас `mockCallback` ожидает синхронный результат:

```textmate
mockCallback<R, T extends PostboyCallbackMessage<R>>(
  type: MessageType<T>,
  action: (m: T) => R,
): void
```


Но callback messages часто используются для async-логики: HTTP, storage, async queries.

Нужно разрешить:

```textmate
world.mocks.mockCallback(LoadUserQuery, async query => {
  return user;
});
```


Или Observable:

```textmate
world.mocks.mockCallback(LoadUserQuery, query => of(user).pipe(delay(10)));
```


Можно добавить отдельные методы:

```textmate
mockCallbackAsync<R, T extends PostboyCallbackMessage<R>>(
  type: MessageType<T>,
  action: (m: T) => Promise<R>,
): void
```


Или расширить существующий `mockCallback`:

```textmate
action: (m: T) => R | Promise<R> | Observable<R>
```


---

## 8. Добавить возможность мокать callback error

Для тестирования ошибок нужно удобно симулировать failure.

Например:

```textmate
world.mocks.mockCallbackError(LoadUserQuery, new Error('User not found'));
```


Или:

```textmate
world.mocks.mockCallback(LoadUserQuery, () => {
  throw new Error('User not found');
});
```


Но лучше иметь явный API:

```textmate
world.mocks.rejectCallback(LoadUserQuery, error);
world.mocks.throwExecutor(SomeExecutor, error);
```


Для callback messages можно дать:

```textmate
world.mocks.mockCallbackFailure(SomeQuery, error);
```


Это важно для тестирования error handling в сервисах.

---

## 9. Добавить сценарные helpers: given/when/then

Можно сделать более высокоуровневый API:

```textmate
world
  .given()
  .callback(CountCandiesQuery).returns(count)
  .executor(WeighCandiesExecutor).returns(weight)
  .event(CandiesHaveBeenWeighedEvent).capture();

service.up();

world
  .then()
  .fired(CandiesHaveBeenWeighedEvent)
  .with(event => event.weight === weight);
```


Или компактнее:

```textmate
world.given.callback(CountCandiesQuery).returns(count);
world.given.executor(WeighCandiesExecutor).returns(weight);

service.up();

world.then.fired(CandiesHaveBeenWeighedEvent).times(1);
```


Это уже ближе к testing DSL и сделает библиотеку намного выразительнее.

---

## 10. Auto-dispose и интеграция с Jest

Сейчас нужно вручную писать:

```textmate
afterEach(() => {
  world.dispose();
});
```


Можно дать helper:

```textmate
const world = createPostboyWorldForJest();
```


Или:

```textmate
let world: PostboyWorld;

beforeEach(() => {
  world = PostboyWorld.jest({ strict: true });
});
```


Где `PostboyWorld.jest()` сам регистрирует `afterEach`.

Например:

```textmate
export function setupPostboyWorld(settings?: PostboyTestingSettings): PostboyWorld {
  const world = new PostboyWorld(settings);
  afterEach(() => world.dispose());
  return world;
}
```


Для Jest:

```textmate
const world = postboyTesting.jestWorld({ strict: true });
```


Для Jasmine/Vitest можно аналогично.

---

## 11. Добавить leak detection

Так как Postboy активно работает с subscriptions/namespaces, полезно проверять утечки.

Например:

```textmate
world.expect.noActiveSubscriptions();
world.expect.noLeakedNamespaces();
world.expect.clean();
```


Или автоматически при `dispose()` в strict mode:

```textmate
world.dispose({ verifyClean: true });
```


Настройки:

```textmate
interface PostboyTestingSettings {
  strict: boolean;
  verifyNoLeaks?: boolean;
}
```


Это поможет ловить ситуации, где сервис подписался, но не был корректно уничтожен.

---

## 12. Улучшить strict-режим

Сейчас `strict` отвечает за поведение при незарегистрированных messages/executors.

Можно сделать его более гибким:

```textmate
interface PostboyTestingSettings {
  strict?: boolean;
  strictMessages?: boolean;
  strictExecutors?: boolean;
  strictCallbacks?: boolean;
  strictSubscriptions?: boolean;
}
```


Например:

```textmate
new PostboyWorld({
  strictMessages: false,
  strictExecutors: true,
});
```


Это полезно, когда в тесте хочется игнорировать лишние events, но обязательно мокать executors.

---

## 13. Добавить `failOnUnexpectedMessage`

В unit-тестах часто нужно проверить, что SUT не публикует ничего лишнего.

API:

```textmate
world.expect.onlyFired([
  CountCandiesQuery,
  WeighCandiesExecutor,
  CandiesHaveBeenWeighedEvent,
]);
```


Или режим:

```textmate
world.allowOnly([
  CountCandiesQuery,
  WeighCandiesExecutor,
  CandiesHaveBeenWeighedEvent,
]);
```


Если сервис опубликовал что-то ещё — тест падает.

Это особенно полезно для regression-тестов бизнес-процессов.

---

## 14. Добавить snapshot/debug output

При падении теста хорошо видеть, что реально происходило в Postboy.

Можно добавить:

```textmate
console.log(world.history.dump());
```


Или:

```textmate
world.debug.printHistory();
```


Вывод:

```plain text
Postboy history:
1. exec CountCandiesQuery { color: "red" }
2. exec WeighCandiesExecutor { count: 5, color: "red" }
3. fire CandiesHaveBeenWeighedEvent { weight: 100 }
```


Ещё лучше:

```textmate
expect(world.history.snapshot()).toMatchSnapshot();
```


API:

```textmate
world.history.toJSON()
world.history.dump()
world.history.snapshot()
```


---

## 15. Добавить `recordService` / `registerService` helper

Так как основная библиотека имеет `IPostboyDependingService`, можно упростить тестирование сервисов:

Сейчас:

```textmate
service = new TestService(world.postboy, color);
service.up();
```


Можно:

```textmate
service = world.registerService(new TestService(world.postboy, color));
```


Или:

```textmate
world.up(service);
```


При `dispose()` world сам мог бы делать cleanup, если сервис поддерживает destroy/down.

Возможный API:

```textmate
world.registerService(service);
world.upServices();
world.dispose();
```


Плюс проверка:

```textmate
world.expect.serviceWasUpped(service);
```


---

## 16. Добавить поддержку middleware testing

В основной библиотеке есть middleware hooks `beforeExecute` / `afterExecute`.

Testing-библиотека может дать helpers:

```textmate
world.middleware.spy();
world.middleware.block(SomeMessage);
world.middleware.before(SomeMessage, handler);
world.middleware.after(SomeMessage, handler);
```


Примеры:

```textmate
const middleware = world.mocks.mockMiddleware();

service.calculateSomething(1, 2);

expect(middleware.beforeCalls.length).toBe(1);
expect(middleware.afterCalls.length).toBe(1);
```


Или:

```textmate
world.middleware.block(SomethingCalculatedEvent);

expect(() => service.calculateSomething(1, 2)).toThrow();
```


Это поможет тестировать инфраструктурную логику вокруг Postboy.

---

## 17. Добавить typed fake builders

Для callback/executor mocks можно добавить короткий DSL:

```textmate
world.mocks.callback(CountCandiesQuery).returns(count);
world.mocks.callback(CountCandiesQuery).calls(query => count);
world.mocks.executor(WeighCandiesExecutor).returns(weight);
world.mocks.event(CandiesHaveBeenWeighedEvent).capture();
```


Сейчас API функциональный:

```textmate
world.mocks.mockCallback(CountCandiesQuery, () => count);
```


DSL может быть удобнее и расширяемее:

```textmate
world.mocks
  .onCallback(CountCandiesQuery)
  .where(q => q.color === 'red')
  .returns(5);
```


---

## 18. Добавить conditional mocks

Полезно для сценариев, где один и тот же query вызывается с разными параметрами.

Например:

```textmate
world.mocks
  .onCallback(CountCandiesQuery)
  .when(q => q.color === 'red')
  .returns(10);

world.mocks
  .onCallback(CountCandiesQuery)
  .when(q => q.color === 'blue')
  .returns(20);
```


Для executors:

```textmate
world.mocks
  .onExecutor(WeighCandiesExecutor)
  .when(e => e.color === 'red')
  .returns(100);
```


Сейчас для этого надо писать всё внутри callback вручную.

---

## 19. Добавить sequential mocks

Для тестов retry/fallback логики полезно:

```textmate
world.mocks
  .onCallback(LoadUserQuery)
  .returnsOnce(null)
  .returnsOnce(user);
```


Или:

```textmate
world.mocks
  .onExecutor(SomeExecutor)
  .throwsOnce(new Error())
  .returnsOnce(result);
```


API:

```textmate
returns(value)
returnsOnce(value)
throws(error)
throwsOnce(error)
calls(fn)
callsOnce(fn)
```


---

## 20. Улучшить README и документацию

Сейчас README очень короткий. Для такой библиотеки стоит добавить минимум:

1. Что такое `PostboyWorld`.
2. Как тестировать generic event.
3. Как тестировать callback query.
4. Как мокать executor.
5. Разница между `strict: true` и `strict: false`.
6. Как смотреть историю.
7. Как ждать async event.
8. Best practices.

Пример структуры README:

```textmate
# @artstesh/postboy-testing

Testing utilities for @artstesh/postboy.

## Installation

## Quick start

## PostboyWorld

## Mocking callback messages

## Mocking executors

## Capturing events

## Strict mode

## Message history

## Verifying fired messages

## Async testing

## Cleanup
```


Это, возможно, самое важное улучшение для adoption.

---

# Приоритетный roadmap

Я бы предложил такой порядок развития.

## Этап 1 — быстрые DX-улучшения

1. Добавить `world.verify` / `world.expect`.
2. Расширить `PostboyWorldVerifier`.
3. Улучшить `MessageHistory`.
4. Добавить документацию в README.

Это мало ломает архитектуру, но сразу делает библиотеку удобнее.

---

## Этап 2 — async testing

1. Реализовать `PostboyWaiter`.
2. Добавить `waitFor`, `waitForMany`, `waitUntil`.
3. Добавить timeout handling.
4. Добавить async callback mocks.

Это сильно улучшит тестирование реальных приложений.

---

## Этап 3 — mocks/spies DSL

1. Сделать spy-объекты для `mockSub`, `mockCallback`, `mockExecute`.
2. Добавить conditional mocks.
3. Добавить sequential mocks.
4. Добавить `returns`, `returnsOnce`, `throwsOnce`.

Это превратит библиотеку из простого mock service в полноценный testing toolkit.

---

## Этап 4 — advanced verification

1. Проверка порядка сообщений.
2. `onlyFired`.
3. Leak detection.
4. Debug dump/snapshot.
5. Middleware testing helpers.

Это уже будет уровень mature testing framework для Postboy.

---

# Самые ценные фичи на мой взгляд

Если выбрать только 5, я бы сделал:

1. **`PostboyWaiter`** — `await world.waiter.waitFor(Event)`.
2. **Assertion API** — `world.expect.fired(Event).times(1)`.
3. **Spy mocks** — `const spy = world.mocks.mockCallback(...)`.
4. **Async callback mocks** — `mockCallback(..., async () => result)`.
5. **History dump / fired order** — удобно для диагностики и сложных бизнес-сценариев.

Эти фичи лучше всего соответствуют задаче библиотеки: упростить тестирование приложений, использующих `@artstesh/postboy`.
