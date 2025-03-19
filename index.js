'use strict'

/**
 * @param {Array} middleware
 * @return {Function}
 */
const composeSlim = (middleware) => async (ctx, next) => {
  const dispatch = (i) => async () => {
    const fn = i === middleware.length
      ? next
      : middleware[i]
    if (!fn) return
    return await fn(ctx, dispatch(i + 1))
  }
  return dispatch(0)()
}

/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {...(Array | Function)} middleware
 * @return {Function}
 * @api public
 */

const compose = (...middleware) => {
  const funcs = middleware.flat()

  for (const fn of funcs) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
  }

  if (process.env.NODE_ENV === 'production') return composeSlim(funcs)

  return async (ctx, next) => {
    const dispatch = async (i) => {
      const fn = i === funcs.length
        ? next
        : funcs[i]
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
          'Middleware resolved before downstream.\n\tYou are probably missing an await or return'
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
