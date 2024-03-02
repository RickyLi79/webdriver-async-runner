# @rickyli79/webdriver-async-runner
Solution for webdriver safty executeAsyncScript, handling errors.

## Scenario
Here one script to be execute by Selenium Webdriver.\
And the script may cause error for some reason.
```js
// a js script that may cause error in runtime
const args = arguments;
function main(num) {
  if ( typeof num!=='number' ) {
    throw new Error('num MUST BE a number');
  }
  return num;
}
const result = main(args[0]);
const callback = args[args.length-1];
callback(result);
```

Selenium Webdriver side
```JAVA
// JAVA
String jsScriptContent = loadFromScriptFile("jsScript.js");
driver.manage().timeouts().setScriptTimeout(30, TimeUnit.SECONDS);

JavascriptExecutor js = (JavascriptExecutor)driver;
Object result = js.executeAsyncScript(jsScriptContent, 'not a number');
```

When error occurs, JAVA side would not get the execption immediately. Until the script timeout.

## Solution
wrap the code like this. The wrapper will handle any error in runtime
```js
const asyncRun = require('@rickyli79/webdriver-async-runner');

const args = arguments;
function main(num) {
  if ( typeof num!=='number' ) {
    throw new Error('num MUST BE a number');
  }
  return num;
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
String jsScriptContent = loadFromScriptFile("jsScript.js");
driver.manage().timeouts().setScriptTimeout(30, TimeUnit.SECONDS);

JavascriptExecutor js = (JavascriptExecutor)driver;
Object result = js.executeAsyncScript(jsScriptContent, 'not a number');
if ( result.getClass() == String.class ) {
  if ( result.startsWith("{\"__error__\":") ) {
    // throw out Exception here
  }
}
```