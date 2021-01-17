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
 * @return {Function}
 * @api public
 */

function compose (_middleware) {
  if (!Array.isArray(_middleware)) throw new TypeError('Middleware stack must be an array!')
  for (const fn of _middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
  }


  /**
   * @param {Object} context
   * @return {Promise}
   * @api public
   */

  return function (context, next) {
    let middleware = [..._middleware];

    // last called middleware #
    let index = -1

    // inject middleware
    const injectMiddleware = fn => {
      middleware = [...middleware.slice(0, index + 1), fn, ...middleware.slice(index + 1, middleware.length)];
    };
    
    return dispatch(0)
    function dispatch (i) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      let fn = middleware[i]
      if (i === middleware.length) fn = next
      if (!fn) return Promise.resolve()
      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1), injectMiddleware));
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}
