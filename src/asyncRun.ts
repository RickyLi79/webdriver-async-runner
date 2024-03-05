import { config, getResultStore, type Chunk } from './lib';

export type WebdriverPrimitive =
  | void
  | null
  | undefined
  | string
  | number
  | boolean
  | Element
  ;

type ArrayDeep<T> = T | ArrayDeep<T>[];

type Promisable<T> = T | Promise<T>;
type TCallback<T extends ArrayDeep<WebdriverPrimitive>> = (result: string | T) => void;

type ErrorResponse = Record<string, string>;

/**
 * 
 * @param fn function to be execute, can be Promise or not
 * @param callback will extract the last member as callback
 * @param toJson `false` for not stringify. `true` for stringify before callback. `number` or `string` as the `space` of stringify
 */
export async function asyncRun<Result extends ArrayDeep<WebdriverPrimitive>>(fn: () => Promisable<Result>, callback: TCallback<Result> | [...any[], TCallback<Result>], toJson: boolean | number | string) {
  if (Array.isArray(callback)) {
    callback = callback[callback.length - 1];
  }
  if (typeof callback !== 'function') {
    throw new Error('expect callback SHOULD BE a function, actual is ' + typeof callback);
  }
  try {
    let result: string | Result = await fn.call(null);
    if (toJson !== undefined && toJson !== null && toJson !== false) {
      if (toJson === true) {
        toJson = undefined;
      }
      result = JSON.stringify(result, null, toJson as any);
    }
    if (typeof result === 'string' && result.length > config.chunkSize) {
      if (toJson === false) toJson = undefined;
      const resultStore = getResultStore();
      const resultId = resultStore.nextId++;
      const { chunkSize } = config;
      const total = Math.ceil(result.length / chunkSize);
      let firstChunk:Chunk;
      for (let idx = 1; idx <= total; idx++) {
        const chunk:Chunk = {
          __result__: resultId,
          chunkSize,
          content: result.substring((idx - 1) * chunkSize, idx * chunkSize),
          current: idx,
          total,
        };
        if (idx === 1) { firstChunk = chunk; }
        let results = resultStore.results[resultId];
        if (results === undefined) {
          results = resultStore.results[resultId] = [];
        }
        results.push(chunk);
      }
      result = JSON.stringify(firstChunk, null, toJson as any);
    }
    callback(result);
  } catch (e) {
    const err: ErrorResponse = { [ config.errorKey]: (e as Error).message };
    callback(JSON.stringify(err));
  }
}
export default asyncRun;
