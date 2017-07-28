const composeSync = require("../sync");

module.exports = function composeSyncFP(middleware) {
  const fn = composeSync(middleware);
  return function(context, next) {
    const ctx = Object.assign(context);
    fn(ctx, next);
    return ctx;
  };
};
