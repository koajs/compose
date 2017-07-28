
# ctx-compose

[![NPM version][npm-image]][npm-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

:globe_with_meridians: Universal middleware composing library based on [koajs/koa-compose](https://github.com/koajs/compose). Works with asynchronous and synchronous middleware on browsers, Node.js and React-Native.

**Create your own middleware-based module!**

## Installation

```sh
npm install ctx-compose

# or:
yarn add ctx-compose
```

## Usage

Import this module with:

```js
// Module import
import { compose, composeSync } from "ctx-compose";

// CommonJS import
const { compose, composeSync } = require("ctx-compose");

// Specific and lightweight import
const compose = require("ctx-compose/async");
const composeSync = require("ctx-compose/sync");
```

And it is used like this:

```js
const middleware = [/* ... */];
const context = {}; // it gets mutated along the middlewares

// Asynchronous:
await compose(middleware)(context);

// Synchronous:
composeSync(middleware)(context);

console.log(context);
```

### Asynchronous

The `compose` function works exactly as [Koa middlewares](https://github.com/koajs/koa/blob/master/docs/guide.md) and supports asynchronous and synchronous middleware.

```js
const compose = require("ctx-compose/async");
const Bluebird = require("bluebird");

async function log(ctx, next) {
  console.log(">>>", ctx.value);
  await next();
  console.log("<<<", ctx.value);
}

async function increaser(ctx) {
  await Bluebird.delay(1000); // wait 1000ms
  ctx.value = ctx.value + 1;
}

const context = { value: 4 };
const middleware = [log, increaser];
compose(middleware)(context).then(() => {
  console.log("Value:", context.value);
});
```

### Synchronous

The `composeSync` middleware works like this. It doesn't support async middleware:

```js
const composeSync = require("ctx-compose/sync");

function log(ctx, next) {
  console.log(">>>", ctx.value);
  next();
  console.log("<<<", ctx.value);
}

function increaser(ctx) {
  ctx.value = ctx.value + 1;
}

const context = { value: 4 };
const middleware = [log, increaser];
composeSync(middleware)(context);
console.log("Value:", context.value);
```

Console output:

```txt
>>> 4
<<< 5
Value: 5
```

## License

  MIT

[npm-image]: https://img.shields.io/npm/v/ctx-compose.svg?style=flat-square
[npm-url]: https://npmjs.org/package/ctx-compose
[david-image]: http://img.shields.io/david/mrpatiwi/compose.svg?style=flat-square
[david-url]: https://david-dm.org/mrpatiwi/compose
[license-image]: http://img.shields.io/npm/l/ctx-compose.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/ctx-compose.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/ctx-compose
