'use strict'

const { isNotFunction } = require('./utils.js');

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
   * @return {Promise}
   * @api public
   */
  return (context, last) => {
    const localMiddleware = isNotFunction(last) ? middleware : [...middleware, last];
    const wrapper = (next, handler) => wrapHandler(handler, context, next);
    const chain = localMiddleware.reduceRight(wrapper, getLastHandler());
    return chain();
  }
}

/**
 * @return {Function}
 * @api private
 */
function getLastHandler() {
  let called = false;
  return () => new Promise((resolve, reject) => {
    if (called) return reject(new Error('next() called multiple times'));
    called = true;
    resolve();
  });
}

/**
 * Helper function that wraps handler in function returning promise
 * @param {Function} handler
 * @param {Object} context
 * @param {Function} next
 * @return {Function}
 * @api private
 */
function wrapHandler(handler, context, next) {
  let called = false;

  /**
   * @return {Promise}
   * @api private
   */
  return () => new Promise((resolve, reject) => {
    if (called) return reject(new Error('next() called multiple times'));
    called = true;

    try {
      resolve(handler(context, next));
    } catch (err) {
      reject(err);
    }
  });
}
