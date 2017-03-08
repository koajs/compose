'use strict'

const Promise = require('any-promise')
const callMiddleware = require('koa-call-middleware')

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
      let fn = middleware[i]
      if (i === middleware.length) fn = next
      if (!fn) return Promise.resolve()
      try {
        if (fn) {
          return Promise.resolve(callMiddleware(fn, context, function next () {
            return dispatch(i + 1)
          }))
        } else {
          if (next) {
            return Promise.resolve(next())
          } else {
            return Promise.resolve()
          }
        }
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}
