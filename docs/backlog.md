# Backlog @artstesh/postboy-testing

## 🔴 Приоритет 1

Найдены при ревью 3.4.1; чинятся до любых новых фич.

1. **Waiter молча перезаписывает регистрации сообщений.** Каждый `waitFor*` вызывает `registry.recordReplay(type)`, а postboy при повторной регистрации перезаписывает Subject. Если SUT уже подписан или тип зарегистрирован через `ConnectMessage` с пайпом, waiter подменяет Subject пустым `ReplaySubject` — существующие подписчики перестают получать события, replay-буфер (`given.event`) теряет значение. Фикс: перед `_recordReplay` проверять, зарегистрирован ли тип, и не трогать существующую регистрацию (в не-strict режиме авто-регистрация мока уже создаёт Subject).
2. **`waitForCallbackResult` игнорирует `includeHistory`** — всегда сканирует уже записанные результаты, в отличие от `waitFor`, где нужен явный флаг. Привести к единому поведению или задокументировать разницу.
3. **`waitForMany({ exact: true })` при переборе впустую ждёт весь таймаут.** Получив `count + 1`-е сообщение, можно падать сразу, а не по таймауту.
4. **`fireCallback` в моке оборачивает `finish` при каждом вызове** — повторная отправка того же инстанса записывает результат дважды. Заодно: записывать и `next()` (частичные результаты), сейчас в историю попадает только `finish`.
5. **Юнит-тесты на само ядро + coverage-порог.** Сейчас 16 кейсов, все через SUT-интеграцию; у `PostboyWaiterService` (самый сложный класс) нет прямых тестов на `exact`-семантику, `waitForNone`, `waitForAny`, таймауты. Покрыть waiter/then/given/history/verifier, поставить coverageThreshold ~90% на `src/` (кроме `src/tests/`).

## Приоритет 2

1. **`world.verifier`** — `PostboyWorldVerifier` экспортируется, но не проброшен в `PostboyWorld` геттером (булевы проверки для условной логики в тестах).
2. **`then.callbackResult(Type)`** — утверждения по записанным результатам callback-сообщений (`with(pred)`, `.value`, `times(n)`).
3. **Spy-объекты моков** — `mockCallback`/`mockExecute` возвращают spy: `called()`, `calledTimes(n)`, `last`, `first`, `all`, `reset()`.
4. **Мок ошибок** — `given.callbackError(Type, err)`, `given.executorThrows(Type, err)` + запись ошибок в историю (сейчас error-handling протестировать неудобно).
5. **Async-моки** — action возвращает `R | Promise<R> | Observable<R>`.
6. **Conditional/sequential-моки** — `when(pred)`, `returnsOnce(v)`, `throwsOnce(e)` поверх spy-builder'а.

## Приоритет 3

1. **Порядок сообщений и «ничего лишнего»** — `HistoryRecord { message, type, timestamp, order, source: 'fire' | 'fireCallback' | 'exec' }` вместо голых сообщений; сверху `then.firedInOrder([...])` и `then.onlyFired([...])`.
2. **`history.dump()` / `snapshot()`** — читаемый дамп шины при падении теста (`1. exec CountCandiesQuery { color: "red" }` ...).
3. **`setupPostboyWorld()`** для Jest/Vitest — сам регистрирует `afterEach(dispose)`.
4. **Leak detection** — опция `verifyNoLeaks` в `PostboyTestingSettings`: при `dispose()` падать, если остались активные подписки/неймспейсы.
5. **Fake timers** — waiter использует реальный `setTimeout`; с `jest.useFakeTimers()` ожидания зависают. Решается инжектом таймера.
6. **Гранулярный strict** — `strictMessages` / `strictExecutors` / `strictCallbacks` вместо одного флага.
7. **Middleware-testing (postboy 3.5+)** — в 3.5 middleware это abstract class с `canHandle`/`before`/`after`/`dispose` и staged-контекстом (`MiddlewareStage.Publish/Callback/Execute`), `Interrupt` из `before` бросает `CancelError`. Отсюда helpers: spy-middleware с `beforeCalls`/`afterCalls` по стейджам и `world.middleware.block(Type)` для проверки реакции SUT на отмену. *(Для 3.4 формат иной — `interface PostboyMiddleware { handle(msg) }`; поддерживаем только 3.5+.)*
8. **Регистрация сервисов в мире** (спорно) — `world.registerService(sut)` с авто-`down()` при dispose.

## ⚙️ Инфраструктура 

1. **CI (GitHub Actions)** — workflow на push/PR: `lint → typecheck → test → build → pack:check`, ровно последовательность из `prepublishOnly`. Матрица по `@artstesh/postboy` 3.4.x / 3.5.x — чтобы peer-диапазон не разъехался с реальностью.
2. **Синхронизация AI_SKILL.md** — файл едет в npm-пакет; добавить в `prepublishOnly` сверку задокументированной версии API и peer-диапазонов с `package.json`.
3. **README** — сейчас одна строка. Минимум: Quick start, PostboyWorld, моки callback/executor/event, strict-режим, история, waiter'ы, best practices.
