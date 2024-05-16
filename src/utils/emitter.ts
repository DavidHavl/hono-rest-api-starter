import type { MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';

export type EventKey = string | symbol;
export type EventHandler<T> = (payload: T) => void;
export type EventHandlers<T> = { [K in keyof T]?: EventHandler<T[K]>[] };

export interface Emitter<EventHandlerPayloads> {
  on<Key extends keyof EventHandlerPayloads>(type: Key, handler: EventHandler<EventHandlerPayloads[Key]>): void;
  off<Key extends keyof EventHandlerPayloads>(type: Key, handler?: EventHandler<EventHandlerPayloads[Key]>): void;
  emit<Key extends keyof EventHandlerPayloads>(type: Key, payload: EventHandlerPayloads[Key]): void;
}

export const createEmitter = <EventHandlerPayloads>(
  eventHandlers?: EventHandlers<EventHandlerPayloads>,
): Emitter<EventHandlerPayloads> => {
  const handlers: Map<EventKey, EventHandler<unknown>[]> = eventHandlers
    ? new Map(Object.entries(eventHandlers))
    : new Map();

  return {
    on<Key extends keyof EventHandlerPayloads>(key: Key, handler: EventHandler<EventHandlerPayloads[Key]>) {
      console.log('in emitter.on', key);
      if (!handlers.has(key as EventKey)) {
        handlers.set(key as EventKey, []);
      }
      const handlerArray = handlers.get(key as EventKey) as Array<EventHandler<EventHandlerPayloads[Key]>>;
      console.log('handlerArray', handlerArray);
      if (!handlerArray.includes(handler)) {
        console.log('handlerArray.push(handler)', handler);
        handlerArray.push(handler);
      }
    },

    off<Key extends keyof EventHandlerPayloads>(key: Key, handler?: EventHandler<EventHandlerPayloads[Key]>) {
      if (!handler) {
        handlers.delete(key as EventKey);
      } else {
        const handlerArray = handlers.get(key as EventKey);
        if (handlerArray) {
          handlers.set(
            key as EventKey,
            handlerArray.filter((h) => h !== handler),
          );
        }
      }
    },

    emit<Key extends keyof EventHandlerPayloads>(key: Key, payload: EventHandlerPayloads[Key]) {
      const handlerArray = handlers.get(key as EventKey);
      if (handlerArray) {
        for (const handler of handlerArray) {
          handler(payload);
        }
      }
    },
  };
};

export const emitter = <EventHandlerPayloads>(
  eventHandlers?: EventHandlers<EventHandlerPayloads>,
): MiddlewareHandler => {
  // Create new instance to share with any middleware and handlers
  const instance = createEmitter<EventHandlerPayloads>(eventHandlers);
  return createMiddleware(async (c, next) => {
    c.set('emitter', instance);
    await next();
  });
};
