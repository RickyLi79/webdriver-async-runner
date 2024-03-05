# @rickyli79/webdriver-async-runner
Solution for webdriver safty executeAsyncScript, handling errors.

## unknown exception is `executeAsyncScript`
### Scenario
Here one script to be execute by Selenium Webdriver.\
And the script may occurs error for some reason.
```js
// a js script that may cause error in runtime
const args = arguments;
function main(text) {
  if ( typeof text!=='string' ) {
    throw new Error('text MUST BE a string');
  }
  return text;
}
const result = main(args[0]);
const callback = args[args.length-1];
callback(result);
```

Selenium Webdriver side
```JAVA
// JAVA
String jsScriptContent = loadFromScriptFile("jsScript.async.js");
driver.manage().timeouts().setScriptTimeout(30, TimeUnit.SECONDS);

JavascriptExecutor js = (JavascriptExecutor)driver;
Object result = js.executeAsyncScript(jsScriptContent, 1); // `1` is not a string
```

When error occurs, JAVA side would not get the execption immediately. Until the script timeout.

### Solution
wrap the code like this. The wrapper will handle any error in runtime
```js
const asyncRun = require('@rickyli79/webdriver-async-runner');

const args = arguments;
function main(text) {
  if ( typeof text!=='string' ) {
    throw new Error('text MUST BE a string');
  }
  return text;
}
asyncRun(
  ()=> { return main(args[0]) } ,   // can be Promise or not
  args,   // will extract the last member as callback
  false,  // do not JSON.stringify the result to callback;
);
```

And Selenium Webdriver side SHOULD detect the error like
```JAVA
// JAVA
String jsScriptContent = loadFromScriptFile("jsScript.async.js");
driver.manage().timeouts().setScriptTimeout(30, TimeUnit.SECONDS);

JavascriptExecutor js = (JavascriptExecutor)driver;
Object result = js.executeAsyncScript(jsScriptContent, 1);
if ( result.getClass() == String.class ) {
  if ( result.startsWith("{\"__error__\":") ) {
    // throw out Exception here
  }
}
```

## large callback result
When webdriver run by Selenium Grid, large callback result ( string type and over 2048KB ), callback will fail to response to script machine

### Scenario
Here one script to be execute by Selenium Webdriver.\
And the script may occurs error for some reason.
```js
// returns large string , over 2048KB
const args = arguments;
function main(text) {
  return text+text+text+text+text+text+text+text+text+text; // 10 times
}
const result = main(args[0]);
const callback = args[args.length-1];
callback(result);
```

Selenium Webdriver side
```JAVA
// JAVA
String jsScriptContent = loadFromScriptFile("jsScript.async.js");
String largeText = loadStringContent(); // for example, 300KB

driver.manage().timeouts().setScriptTimeout(30, TimeUnit.SECONDS);
JavascriptExecutor js = (JavascriptExecutor)driver;
Object result = js.executeAsyncScript(jsScriptContent, largeText); // will never recieve, and script timeout
```

### Solution 
```js
const asyncRun = require('@rickyli79/webdriver-async-runner');

const args = arguments;
function main(text) {
  return text+text+text+text+text+text+text+text+text+text; // 10 times
}
asyncRun(()=> { return main(args[0]) },args,false);
```

```ts
export type Chunk = {
  __result__: number,
  content: string,

  chunkSize: number,
  current: number,
  total: number;
};
```

```JAVA
// JAVA
String jsScriptContent = loadFromScriptFile("jsScript.async.js");
String largeText = loadStringContent(); // for example, 300KB

driver.manage().timeouts().setScriptTimeout(30, TimeUnit.SECONDS);
JavascriptExecutor js = (JavascriptExecutor)driver;
Object result = js.executeAsyncScript(jsScriptContent, largeText);
if ( result.getClass() == String.class ) {
  if ( result.startsWith("{\"__error__\":") ) {
    // throw out Exception here
  } else if ( result.startsWith("{\"__result__\":") ) {
    JSONObject chunk = JSONObject.parse(result);
    String resultId = (String)chunk.get("__result__");
    int total = (int)chunk.get("total");
    String resultTotal = (String)chunk.get("content");
    String getRunResultScript = loadFromScriptFile("getRunResult.sync.js");
    for( int idx=2; idx<=total; idx++ ) {
      String iChunkStr = (String)js.executeSyncScript(getRunResultScript, resultId, idx);
      JSONObject iChunk = JSONObject.parse(iChunkStr);
      resultTotal += (String)iChunk.get("content");
    }
    result = resultTotal; // here the `result` finally is the over 3MB
  }
}
result
```