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

function compose (middleware) {
  if (!Array.isArray(middleware))
    throw new TypeError('Middleware stack must be an array!')

  for (const fn of middleware) {
    if (typeof fn !== 'function')
      throw new TypeError('Middleware must be composed of functions!')
  }


  return function (context, next) {
    let lastCalledIndex = -1
    return (async function dispatch (currentCallIndex) {
      if (currentCallIndex <= lastCalledIndex)
        throw new Error('next() called multiple times')
      lastCalledIndex = currentCallIndex
      let fn = middleware[currentCallIndex]
      if (currentCallIndex === middleware.length) fn = next
      if (!fn) return;
      try {
        return fn(context, dispatch.bind(null, currentCallIndex + 1));
      } catch (err) {
        throw err
      }
    })(0);
  }
}
