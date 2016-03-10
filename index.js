'use strict'

/**
 * Expose compositor.
 */

module.exports = compose

/**
 * Decorator that throws error when function was called multiple times
 * @param {Function} fn
 * @return {Function}
 * @api private
 */
function callCounter(fn) {
  var calls = 0;
  return () => {
    if (calls++) {
      return Promise.reject(new Error('next() called multiple times'));
    }
    return fn();
  }
}

/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Array} middleware
 * @return {Function}
 * @api public
 */

function compose(middleware){
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
  }

  /**
   * @param {Object} context
   * @return {Promise}
   * @api public
   */

  return function (context, next) {
    next = callCounter(next || () => Promise.resolve());
    next = middleware.reverse().reduce((next, fn) => callCounter(() => {
      return Promise.resolve().then(() => fn(context, next));
    }), next);
    return next();
  }
}
