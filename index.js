'use strict'

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
 * @param {?Object} options
 * @param {Function} [options.Promise= Promise]
 * @return {Function}
 * @api public
 */

function compose (middleware, options) {
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
  }

  if (options != null && typeof options !== 'object') {
    throw new TypeError('options must be an object!')
  }

  const { Promise: _Promise = Promise } = options || {}

  /**
   * @param {Object} context
   * @return {PromiseLike}
   * @api public
   */

  return function (context, next) {
    // last called middleware #
    let index = -1
    return dispatch(0)
    function dispatch (i) {
      if (i <= index) return _Promise.reject(new Error('next() called multiple times'))
      index = i
      let fn = middleware[i]
      if (i === middleware.length) fn = next
      if (!fn) return _Promise.resolve()
      try {
        return _Promise.resolve(fn(context, dispatch.bind(null, i + 1)))
      } catch (err) {
        return _Promise.reject(err)
      }
    }
  }
}
