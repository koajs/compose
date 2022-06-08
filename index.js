'use strict'

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
   * @param {Object} ctx
   * @return {Promise}
   * @api public
   */
  return async (ctx, next) => {
    const dispatch = async (i) => {
      if (i > middleware.length) return
      const fn = middleware[i] || next
      if (!fn) return

      let nextCalled = false
      let nextResolved = false
      const nextProxy = async () => {
        if (nextCalled) throw Error('next() called multiple times')
        nextCalled = true
        try {
          return await dispatch(i + 1)
        } finally {
          nextResolved = true
        }
      }

      const result = await fn(ctx, nextProxy)
      if (nextCalled && !nextResolved) {
        throw Error(
          'middleware resolved before downstream.\n\tyou are probably missing an await or return'
        )
      }
      return result
    }
    return dispatch(0)
  }
}

/**
 * Expose compositor.
 */

module.exports = compose
