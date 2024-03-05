import { getResultStore } from './lib';

export function getRunResult(resultId:number, idx:number) {
  const resultStore = getResultStore();
  const results = resultStore.results[resultId];
  if (results === undefined) {
    return;
  }
  const re = results[idx - 1];
  if (idx === re.total) {
    delete resultStore.results[resultId];
  }
  return re;
}
