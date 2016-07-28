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
   * Make an iterator for middleware.
   */

  const obj = {
    [Symbol.iterator]: () => {
      const { length } = middleware
      let i = 0
      let context
      let nextFunc

      return {
        next (c, n) {
          if (!context) context = c
          if (!nextFunc) nextFunc = n

          let fn = middleware[i++] || nextFunc
          let done = i > length
          let value
          let nextCalled = false

          if (fn) {
            value = fn(context, () => {
              if (nextCalled) {
                return Promise.reject(new Error('next() called multiple times'))
              }
              nextCalled = true
              return Promise.resolve().then(() => this.next().value)
            })
          }

          return {
            value,
            done
          }
        }
      }
    }
  }

  // iteration object
  const iter = obj[Symbol.iterator]()

  /**
   * @param {Object} context
   * @return {Promise}
   * @api public
   */

  return function (context, next) {
    try {
      return Promise.resolve(iter.next(context, next).value)
    } catch (err) {
      return Promise.reject(err)
    }
  }
}
