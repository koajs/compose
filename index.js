'use strict'
const debug = require('debug')('koa:compose')

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
    async function dispatch (i) {
      if (i <= index) throw new Error('next() called multiple times')
      index = i
      let fn = middleware[i]
      const nextDispatcher = dispatch.bind(null, i + 1)
      if (i === middleware.length && next) return next(context, nextDispatcher)
      if (fn) {
        debug('executing %s', fn._name || fn.name || '-')
        const result = await fn(context, nextDispatcher)
        debug('executed %s', fn._name || fn.name || '-')

        return result
      }
    }
  }
}
