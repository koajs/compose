'use strict'

/**
 * Helper function that checks whether passed parameter is NOT a function
 * @param {Object} fn
 * @return {Function}
 * @api private
 */
const isNotFunction = obj => typeof obj !== 'function';

/**
 * Helper function that wraps a function in function returning promise
 * @param {Function} fn
 * @return {Function}
 * @api private
 */
const wrapHandler = (fn, ...args) => callCounter(() => Promise.resolve(fn(...args)))

/**
 * Decorator that throws error when function was called multiple times
 * @param {Function} fn
 * @return {Function}
 * @api private
 */
function callCounter(fn) {
  let calls = 0;
  return () => {
    if (calls++) {
      return Promise.reject(new Error('next() called multiple times'));
    }
    return fn();
  }
}

/**
 * Expose compositor.
 */
module.exports = compose

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
  if (!Array.isArray(middleware)) {
    throw new TypeError('Middleware stack must be an array!');
  }
  if (middleware.some(isNotFunction)) {
    throw new TypeError('Middleware must be composed of functions!');
  }

  /**
   * @param {Object} context
   * @return {Promise}
   * @api public
   */
  return (context, next) => {
    if (!next) {
      next = () => Promise.resolve();
    }
    next = callCounter(next);
    const chain = middleware.reduceRight((next, fn) => wrapHandler(fn, context, next), next);
    return chain();
  }
}
