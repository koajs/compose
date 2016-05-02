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
   * @param {Object} context
   * @return {Promise}
   * @api public
   */

  return function (context, next) {
    // last called middleware #
    let index = -1
    return dispatch(0)
    function dispatch (i) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      const fn = wrap(middleware[i]) || next
      if (!fn) return Promise.resolve()
      try {
        return Promise.resolve(fn(context, function next () {
          return dispatch(i + 1)
        }))
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}

/**
 * composes a wrapped middleware using middleware._wrappers
 *
 * @param {Function} middleware
 * @return {Function} composed
 * @api public
 */

function wrap (middleware) {
  if (!middleware) return false
  if (!middleware._wrappers) return middleware
  if (!Array.isArray(middleware._wrappers)) throw new TypeError('._wrappers must be an array')
  if (!middleware._wrappers.length) return middleware
  const wrappers = middleware._wrappers
  delete middleware._wrappers
  return compose([...wrappers, middleware])
}
