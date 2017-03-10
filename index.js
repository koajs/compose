'use strict'

const Promise = require('any-promise')

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
    let hasTerminated = false;
    const skipFn = () => {
      if (hasTerminated) {
        throw new Error('skipNext() called multiple times');
      }
      hasTerminated = true;
      if (skipNext) {
        return skipNext();
      }
      return Promise.resolve();
    }
    const terminate = next || skipFn
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
      try {
        let result
        let nextCalled = false;
        if (i < middleware.length) {
          const nextFn = function next () {
            nextCalled = true;
            return dispatch(i + 1)
          }
          result = middleware[i](context, nextFn, skipFn)
        } else {
          result = terminate()
        }
        if (typeof result === 'object' && result !== null && typeof result.then === 'function') {
          return result
        }
        throw new TypeError('Middleware must return a Promise')
      } catch (err) {
        return Promise.reject(err)
      }
    } 
  }
}
