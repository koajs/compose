'use strict'

const Promise = require('any-promise')

/**
 * Make an iterator for middleware.
 */

const iterable = Object.create({
  [Symbol.iterator] (middleware, length, context, nextFunc) {
    return {
      next (i) {
        i |= 0
        const fn = middleware[i] || nextFunc
        let called = false

        return {
          done: i === length,
          value: fn && fn(context, () => {
            if (called) {
              throw new Error('next() called multiple times')
            }
            called = true
            return Promise.resolve().then(() => this.next(i + 1).value)
          })
        }
      }
    }
  }
})

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
    // iterator
    const iter = iterable[Symbol.iterator](middleware, middleware.length, context, next)

    try {
      return Promise.resolve(iter.next().value)
    } catch (err) {
      return Promise.reject(err)
    }
  }
}
