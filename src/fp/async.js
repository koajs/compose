const compose = require("../async");

module.exports = function composeAsyncFP(middleware) {
  const fn = compose(middleware);
  return function(context, next) {
    const ctx = Object.assign(context);
    return fn(ctx, next).then(() => {
      return ctx;
    });
  };
};
