/* eslint no-console: 0 */

const compose = require("../async");
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
