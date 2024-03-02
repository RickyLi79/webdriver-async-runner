type Primitive =
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
type TCallback<T extends ArrayDeep<Primitive>> = (result: string | T) => void;

type ErrorResponse = {
  __error__: string,
};


/**
 * 
 * @param fn function to be execute, can be Promise or not
 * @param callback will extract the last member as callback
 * @param toJson `false` for not stringify. `true` for stringify before callback. `number` or `string` as the `space` of stringify
 */
export async function asyncRun<Result extends ArrayDeep<Primitive>>(fn: () => Promisable<Result>, callback: TCallback<Result> | [...any[], TCallback<Result>], toJson: boolean | number | string) {
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
    callback(result);
  } catch (e) {
    const err: ErrorResponse = { __error__: (e as Error).message };
    callback(JSON.stringify(err));
  }
}
export default asyncRun;
