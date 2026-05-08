import { WaitOptions } from '../models/waiter.options';
import {
  AddNamespace,
  EliminateNamespace,
  MessageType,
  PostboyAbstractRegistrator,
  PostboyCallbackMessage,
  PostboyGenericMessage,
  PostboyMessage,
} from '@artstesh/postboy';
import { PostboyServiceMock } from '../mocks/postboy-service-mock';
import { MessageHistory } from './message-history';
import { WaitManyOptions } from '../models/wait-many.options';
import { Subscription } from 'rxjs';
import { WaitSilenceOptions } from '../models/wait-silence.options';
import { PostboyCallbackResult } from './given.service';

const waiterNamespace = 'waiter-namespace-0a809c2d-1a76-4c40-8b2f-a78c27ffef2e';

export class PostboyWaiterService {
  private _registry: PostboyAbstractRegistrator;

  constructor(
    private _postboy: PostboyServiceMock,
    private _history: MessageHistory,
  ) {
    this._registry = this._postboy.exec(new AddNamespace(waiterNamespace));
  }

  waitFor<T extends PostboyGenericMessage>(type: MessageType<T>, options: WaitOptions<T> = {}): Promise<T> {
    const timeout = this._getTimeout(options);
    const predicate = options.where ?? (() => true);

    if (options.includeHistory) {
      const message = this._history.messages(type).all.find(predicate);
      if (message) return Promise.resolve(message);
    }

    this._recordReplay(type);

    return new Promise<T>((resolve, reject) => {
      let completed = false;
      let subscription: Subscription | undefined;

      const timer = setTimeout(() => {
        if (completed) {
          return;
        }

        completed = true;
        subscription?.unsubscribe();

        reject(
          new Error(`Postboy waiter timeout: expected ${this._getTypeName(type)} to be fired within ${timeout}ms.`),
        );
      }, timeout);

      subscription = this._postboy.sub(type).subscribe({
        next: (message) => {
          if (completed || !predicate(message)) {
            return;
          }

          completed = true;
          clearTimeout(timer);
          subscription?.unsubscribe();
          resolve(message);
        },
        error: (error) => {
          if (completed) {
            return;
          }

          completed = true;
          clearTimeout(timer);
          subscription?.unsubscribe();
          reject(error);
        },
      });
    });
  }

  waitForMany<T extends PostboyGenericMessage>(
    type: MessageType<T>,
    count: number,
    options: WaitManyOptions<T> = {},
  ): Promise<T[]> {
    if (count <= 0) {
      return Promise.resolve([]);
    }

    const timeout = this._getTimeout(options);
    const predicate = options.where ?? (() => true);
    const collected: T[] = [];

    if (options.includeHistory) {
      collected.push(...this._history.messages(type).all.filter(predicate));

      if (!options.exact && collected.length >= count) {
        return Promise.resolve(collected.slice(0, count));
      }
    }

    this._recordReplay(type);

    return new Promise<T[]>((resolve, reject) => {
      let completed = false;
      let subscription: Subscription | undefined;

      const timer = setTimeout(() => {
        if (completed) {
          return;
        }

        completed = true;
        subscription?.unsubscribe();

        if (options.exact && collected.length === count) {
          resolve([...collected]);
          return;
        }

        reject(
          new Error(
            `Postboy waiter timeout: expected ${this._getTypeName(type)} to be fired ${
              options.exact ? 'exactly' : 'at least'
            } ${count} time(s), but got ${collected.length}.`,
          ),
        );
      }, timeout);

      subscription = this._postboy.sub(type).subscribe({
        next: (message) => {
          if (completed || !predicate(message)) {
            return;
          }

          collected.push(message);

          if (!options.exact && collected.length >= count) {
            completed = true;
            clearTimeout(timer);
            subscription?.unsubscribe();
            resolve(collected.slice(0, count));
          }
        },
        error: (error) => {
          if (completed) {
            return;
          }

          completed = true;
          clearTimeout(timer);
          subscription?.unsubscribe();
          reject(error);
        },
      });
    });
  }

  waitForCallbackResult<T extends PostboyCallbackMessage<PostboyCallbackResult<T>>>(
    type: MessageType<T>,
    options: WaitOptions<T> = {},
  ): Promise<PostboyCallbackResult<T>> {
    const timeout = this._getTimeout(options);
    const predicate = options.where ?? (() => true);

    return new Promise<PostboyCallbackResult<T>>((resolve, reject) => {
      let completed = false;
      let subscription: Subscription | undefined;

      const complete = (result: PostboyCallbackResult<T>): void => {
        if (completed) {
          return;
        }

        completed = true;
        clearTimeout(timer);
        subscription?.unsubscribe();
        resolve(result);
      };

      const fail = (error: unknown): void => {
        if (completed) {
          return;
        }

        completed = true;
        clearTimeout(timer);
        subscription?.unsubscribe();
        reject(error);
      };

      const timer = setTimeout(() => {
        fail(
          new Error(
            `Postboy waiter timeout: expected callback result for ${this._getTypeName(type)} within ${timeout}ms.`,
          ),
        );
      }, timeout);

      subscription = this._history.callbackResult$(type).subscribe({
        next: (item) => {
          if (predicate(item.message)) {
            complete(item.result);
          }
        },
        error: fail,
      });

      const existingResult = this._history.callbackResults(type).all.find((item) => predicate(item.message));

      if (existingResult) {
        complete(existingResult.result);
      }
    });
  }

  waitForNone<T extends PostboyGenericMessage>(
    type: MessageType<T>,
    options: WaitSilenceOptions<T> = {},
  ): Promise<void> {
    const timeout = this._getTimeout(options);
    const predicate = options.where ?? (() => true);

    if (options.includeHistory && this._history.messages(type).all.some(predicate)) {
      return Promise.reject(
        new Error(
          options.timeoutMessage ??
            `Postboy waiter expected ${this._getTypeName(type)} not to be fired, but it was already found in history.`,
        ),
      );
    }

    this._recordReplay(type);

    return new Promise<void>((resolve, reject) => {
      let completed = false;
      let subscription: Subscription | undefined;

      const timer = setTimeout(() => {
        if (completed) {
          return;
        }

        completed = true;
        subscription?.unsubscribe();
        resolve();
      }, timeout);

      subscription = this._postboy.sub(type).subscribe({
        next: (message) => {
          if (completed || !predicate(message)) {
            return;
          }

          completed = true;
          clearTimeout(timer);
          subscription?.unsubscribe();

          reject(
            new Error(
              options.timeoutMessage ??
                `Postboy waiter expected ${this._getTypeName(type)} not to be fired within ${timeout}ms.`,
            ),
          );
        },
        error: (error) => {
          if (completed) {
            return;
          }

          completed = true;
          clearTimeout(timer);
          subscription?.unsubscribe();
          reject(error);
        },
      });
    });
  }

  waitForAny<T extends PostboyGenericMessage>(types: MessageType<any>[], options: WaitOptions<any> = {}): Promise<T> {
    const timeout = this._getTimeout(options);
    const predicate = options.where ?? (() => true);

    if (options.includeHistory) {
      for (const type of types) {
        const message = this._history.messages(type).all.find(predicate);

        if (message) {
          return Promise.resolve(message);
        }
      }
    }

    types.forEach((type) => this._recordReplay(type));

    return new Promise<T>((resolve, reject) => {
      let completed = false;
      const subscriptions: Subscription[] = [];

      const timer = setTimeout(() => {
        if (completed) {
          return;
        }

        completed = true;
        subscriptions.forEach((subscription) => subscription.unsubscribe());

        reject(
          new Error(
            `Postboy waiter timeout: expected any of [${types.map((type) => this._getTypeName(type)).join(', ')}] within ${timeout}ms.`,
          ),
        );
      }, timeout);

      types.forEach((type) => {
        const subscription = this._postboy.sub(type).subscribe({
          next: (message) => {
            if (completed || !predicate(message)) {
              return;
            }

            completed = true;
            clearTimeout(timer);
            subscriptions.forEach((s) => s.unsubscribe());
            resolve(message);
          },
          error: (error) => {
            if (completed) {
              return;
            }

            completed = true;
            clearTimeout(timer);
            subscriptions.forEach((s) => s.unsubscribe());
            reject(error);
          },
        });

        subscriptions.push(subscription);
      });
    });
  }

  delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  dispose(): void {
    this._registry.down();
    this._postboy.exec(new EliminateNamespace(waiterNamespace));
  }

  private _recordReplay<T extends PostboyMessage>(type: MessageType<T>): void {
    this._registry.recordReplay(type);
  }

  private _getTimeout<T extends PostboyGenericMessage>(options: WaitOptions<T> | WaitSilenceOptions<T>): number {
    return options.timeout ?? 1000;
  }

  private _getTypeName<T extends PostboyMessage>(type: MessageType<T>): string {
    return type.name;
  }
}
