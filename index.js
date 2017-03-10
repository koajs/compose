'use strict'

const Promise = require('any-promise')

/**
 * Expose compositor.
 */

module.exports = compose

/**
 * Default next function used when none is specified.
 *
 * @return {Promise}
 * @api public
 */

function defaultNext () {
  return Promise.resolve()
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
   * @param {Object} context
   * @return {Promise}
   * @api public
   */

  return function (context, next) {
    if (next !== undefined && typeof next !== 'function') {
      throw new TypeError('Next must be a function when specified')
    }
    const terminate = next || defaultNext
    // last called middleware #
    let lastCalled = -1
    return dispatch(0)

    /**
     * Dispatch to the i-th middleware in the composed stack, capturing
     * the state necessary to continue the process in the `next()` and
     * `dispatch` closures.
     * @param {Number} i
     */

    function dispatch (i) {
      if (i <= lastCalled) return Promise.reject(new Error('next() called multiple times'))
      lastCalled = i
      try {
        let result
        if (i < middleware.length) {
          result = middleware[i](context, function next () {
            return dispatch(i + 1)
          })
        } else {
          result = terminate()
        }
        if (typeof result === 'object' && result !== null && typeof result.then === 'function') {
          return result
        }
        if (result === undefined) {
          return Promise.resolve()
        }
        throw new TypeError('Middleware must return a Promise')
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}
