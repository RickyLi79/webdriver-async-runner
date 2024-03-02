import { assert } from 'chai';
import { describe } from 'mocha';
import asyncRun from '../src';

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
    assert.deepEqual(callResultObj, { __error__: errMsg });

  });
});
