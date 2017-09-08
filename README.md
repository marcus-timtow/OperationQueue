# OperationQueue


## Synopsis - Interface

A queue of stateful operations to be executed on a specific instance.

This component can be used both in the browser and node.js (the module definition is done in AMD style, node style or as a browser global)


## Code Example

```javascript
let operations = new OperationQueue({
    debug: true,
    namespace: "example"
});

let operation = function (next) {
    log(".");
    next();
};

operations.push(operation);
operations.drop();
operations.push(operation, (err) => log(err)); // with a callback
operations.push(function (next) {
    throw new Error("error"); // Throwing an error is the same as calling next(err)
});
```

## Motivation

To easily keep the state of an object consistent when many of its methods can change it.

## Installation

```
npm install marcus-timtow/OperationQueue
```
*todo: minify*
*todo: bower*

## Interfaces (API)

*todo*

## License

Copyright 2017 Marcus Timtow

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
