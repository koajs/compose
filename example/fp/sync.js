/* eslint no-console: 0 */

const composeSync = require("../../fp/sync");

function log(ctx, next) {
  console.log(">>>", ctx.value);
  next();
  console.log("<<<", ctx.value);
}

function increaser(ctx) {
  ctx.value = ctx.value + 1;
}

const middleware = [log, increaser];
const context = composeSync(middleware)({ value: 4 });
console.log("Value:", context.value);
