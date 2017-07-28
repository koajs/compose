/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed in a sync way.
 *
 * @param {Array} middleware
 * @return {Function}
 * @api public
 */

export default function compose(middleware) {
  if (!Array.isArray(middleware)) {
    throw new TypeError("Middleware stack must be an array!");
  }
  for (const fn of middleware) {
    if (typeof fn !== "function") {
      throw new TypeError("Middleware must be composed of functions!");
    }
  }

  /**
   * @param {Object} context
   * @return {undefined}
   * @api public
   */

  return function(context, next) {
    // last called middleware #
    let index = -1;
    return dispatch(0);
    function dispatch(i) {
      if (i <= index) {
        new Error("next() called multiple times");
      }
      index = i;
      let fn = middleware[i];
      if (i === middleware.length) fn = next;
      if (!fn) {
        return undefined;
      }
      return fn(context, function next() {
        return dispatch(i + 1);
      })
    }
  };
}
