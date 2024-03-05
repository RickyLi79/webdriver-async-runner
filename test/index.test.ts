import { assert } from 'chai';
import { describe } from 'mocha';
import { asyncRun, setConfig } from '../src';
import { getRunResult } from '../src/getRunResult';
import { getResultStore } from '../src/lib';

describe('all', () => {

  describe('asyncRun', () => {
    it('result is Primitive', async () => {
      const expect = 1;
      let callResult:any;
      function fn() {
        return expect;
      }
      function callback(result:any) {
        callResult = result;
      }
      await asyncRun(fn, callback, false);
      assert.deepEqual(callResult, expect);    
    });
    it('result is Primitive, async', async () => {
      const expect = 1;
      let callResult:any;
      function fn() {
        return Promise.resolve(expect);
      }
      function callback(result:any) {
        callResult = result;
      }
      await asyncRun(fn, callback, false);
      assert.deepEqual(callResult, expect);    
    });
    it('result is Primitive, toJSON', async () => {
      const expect = 1;
      let callResult:any;
      function fn() {
        return expect;
      }
      function callback(result:any) {
        callResult = result;
      }
      await asyncRun(fn, callback, true);
      assert.deepEqual(callResult, JSON.stringify(expect));    
    });
    it('result is Primitive, async, toJSON', async () => {
      const expect = 1;
      let callResult:any;
      function fn() {
        return Promise.resolve(expect);
      }
      function callback(result:any) {
        callResult = result;
      }
      await asyncRun(fn, callback, true);
      assert.deepEqual(callResult, JSON.stringify(expect));    
    });

    it('Array<Primitive>', async () => {
      const expect = [ 1, [ 2 ]];
      let callResult:any;
      function fn() {
        return expect;
      }
      function callback(result:any) {
        callResult = result;
      }
      await asyncRun(fn, callback, false);
      assert.deepEqual(callResult, expect);    
    });
    it('Array<Primitive>, toJSON', async () => {
      const expect = [ 1, [ 2 ]];
      let callResult:any;
      function fn() {
        return expect;
      }
      function callback(result:any) {
        callResult = result;
      }
      await asyncRun(fn, callback, true);
      assert.deepEqual(callResult, JSON.stringify(expect));    
    });

    it('error callback type', async () => {
      function fn() {
      }
      try {
        await asyncRun(fn, true as any, true);
      } catch (e) {
        assert.instanceOf(e, Error);
      }
    });

    it('catch error in fn', async () => {
      const errMsg = 'error message in fn';
      const errorKey = 'errorKey';
      setConfig({ errorKey });
      function fn() {
        throw new Error(errMsg);
      }
    
      let callResult:any;
      function callback(result:any) {
        callResult = result;
      }
      await asyncRun(fn, callback, true);
      assert.isString(callResult);
    
      const callResultObj = JSON.parse(callResult);
      assert.deepEqual(callResultObj, { [errorKey]: errMsg });

    });

    it('chunk size', async () => {
      const chunkSize = 3;
      const fnRt = '1234567890';
      setConfig({ chunkSize });
      function fn() {
        return fnRt;
      }
    
      let callResult:string;
      function callback(result:any) {
        callResult = result;
      }
      await asyncRun(fn, callback, false);
      assert.isTrue(callResult.startsWith('{\"__result__\"'));
      const actual = JSON.parse(callResult);
      assert.deepEqual(actual, { __result__: actual.__result__, chunkSize, current: 1, content: fnRt.substring(0, chunkSize), total: Math.ceil(fnRt.length / chunkSize) });
    });

    it('getRunResult', async () => {
      const chunkSize = 3;
      const fnRt = '1234567890';
      setConfig({ chunkSize });
      function fn() {
        return fnRt;
      }
    
      let callResult:any;
      function callback(result:any) {
        callResult = result;
      }
      await asyncRun(fn, callback, false);
      
      const chunk_1 = JSON.parse(callResult);
      const chunks:any[] = [];
      const resultStore = getResultStore();
      for (let idx = 1; idx <= chunk_1.total; idx++) {
        const iChunk = getRunResult(chunk_1.__result__, idx);
        assert.isNotEmpty(iChunk);
        chunks.push(iChunk);
        if (idx !== chunk_1.total) {
          assert.isNotEmpty(resultStore.results[chunk_1.__result__]);
        } else {
          assert.isUndefined(resultStore.results[chunk_1.__result__]);
        }
      }
      assert.strictEqual(chunks.reduce((result, i) => {
        result += i.content;
        return result;
      }, ''), fnRt);
      
    });
  });

  
});
