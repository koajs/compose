/* eslint no-console: 0 */

const compose = require("../../fp/async");
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

const middleware = [log, increaser];
compose(middleware)({ value: 4 }).then(context => {
  console.log("Value:", context.value);
});
