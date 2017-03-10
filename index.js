'use strict'

const Promise = require('any-promise')

/**
 * Expose compositor.
 */

module.exports = compose

/**
 * Default skip function used when none is specified.
 *
 * @return {Promise}
 * @api public
 */

function defaultSkip() {
  return Promise.resolve()
}

/**
 * Call a middleware and ensure that a promise is always returned by 
 * transforming exceptions into rejected promises.
 *
 * @param {Function} middleware
 * @param {object} context
 * @param {Function} next
 * @param {Function} skipNext
 * @return {Promise}
 * @api public
 */
 
function callMiddleware(middleware, context, next, skip) {
  try {
    const result = middleware(context, next, skip)
    if (typeof result === 'object' && result !== null && typeof result.then === 'function') {
      return result
    }
    if (result === undefined) {
      if (middleware === skip) {
        throw new Error('skipNext infinite loop detected');
      }
      return callMiddleware(skip, context);
    }
    throw new TypeError('Middleware must return a Promise')
  } catch (err) {
    return Promise.reject(err)
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

function compose (middleware) {
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
  }

  /**
   * Middleware function representing composition of middleware stack
   * @param {Object} context
   * @param {Function} next
   * @param {Function} skipNext
   * @return {Promise}
   * @api public
   */

  return function (context, next, skipNext) {
    if (next !== undefined && typeof next !== 'function') {
      throw new TypeError('Next must be a function when specified')
    }
    if (skipNext !== undefined && typeof skipNext !== 'function') {
      throw new TypeError('skipNext must be a function when specified')
    }
    // last called middleware #
    let lastCalled = -1
    return dispatch(0)
    
    /**
     * Dispatch to the i-th middleware in the composed stack, capturing
     * the state necessary to continue the process in the `next()` closure.
     * @param {Number} i
     */
     
    function dispatch (i) {
      if (i <= lastCalled) return Promise.reject(new Error('next() called multiple times'))
      lastCalled = i
      const nextFn = function next () {
        return dispatch(i + 1)
      }
      const skipFn = skipNext === undefined ? defaultSkip: skipNext
      let middlewareFn = middleware[i]
      if (i === middleware.length) middlewareFn = next
      if (middlewareFn === undefined) middlewareFn = skipFn
      return callMiddleware(middlewareFn, context, nextFn, skipFn)
    } 
  }
}
