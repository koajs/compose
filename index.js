'use strict'

const { DuplicateNextCallError } = require('./errors.js');
const { isNotFunction } = require('./utils.js');

/**
 * Expose compositor.
 */
module.exports = compose;

/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Array} middleware
 * @return {Function}
 * @api public
 */
function compose(middleware) {
  if (!Array.isArray(middleware)) {
    throw new TypeError('Middleware stack must be an array!');
  }
  if (middleware.some(isNotFunction)) {
    throw new TypeError('Middleware must be composed of functions!');
  }

  /**
   * @param {Object} context
   * @param {Function} last next handler
   * @return {Function}
   * @api public
   */
  return async (context, last) => {
    const localMiddleware = isNotFunction(last) ? middleware : [...middleware, last];
    const wrapper = (next, handler) => wrapHandler(handler, context, next);
    const chain = localMiddleware.reduceRight(wrapper, getLastHandler());
    return await chain();
  }
}

/**
 * @return {Function}
 * @api private
 */
function getLastHandler() {
  let called = false;

  /**
   * @return {Function}
   * @api private
   */
  return async () => {
    if (called) throw new DuplicateNextCallError();
    called = true;
    return called;
  };
}

/**
 * Helper function that wraps handler in an async function
 * @param {Function} handler
 * @param {Object} context
 * @param {Function} next
 * @return {Function}
 * @api private
 */
function wrapHandler(handler, context, next) {
  let called = false;

  /**
   * @return {Function}
   * @api private
   */
  return async () => {
    if (called) throw new DuplicateNextCallError();
    called = true;

    try {
      return await handler(context, next);
    } catch (err) {
      // Simply rethrowing the error
      throw err;
    }
  };
}
