export type Chunk = {
  __result__: number,
  content: string,

  chunkSize: number,
  current: number,
  total: number;
};

export type ResultStore = {
  nextId: number;
  results: Record<number, Chunk[]>;
};
const NAME = '@rickyli79/webdriver-async-runner';
export function getResultStore() {
  let store:ResultStore = globalThis[NAME];
  if (store === undefined) {
    globalThis[NAME] = store = {
      nextId: 0,
      results: {},
    };
  }
  return store;
}

type TConfig = {
  /**
   * @default '__error__'
   */
  errorKey: string;

  /**
   * @default 1024*1024*2 - 1024
   */
  chunkSize: number,
};

export const config: TConfig = {
  errorKey: '__error__',
  chunkSize: 1024 * 1024 * 2 - 1024,
};

export function setConfig(conf: Partial<TConfig>) {
  Object.assign(config, conf);
}
