'use strict'

const Promise = require('any-promise')

// Shorthand for Symbol.iterator
const SYMBOL_ITERATOR = Symbol.iterator

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
    [SYMBOL_ITERATOR] (middleware, context, nextFunc) {
      const length = middleware.length
      let i = -1

      return {
        next () {
          const fn = middleware[++i] || nextFunc
          let nextCalled = false

          return {
            value: fn && fn(context, () => {
              if (nextCalled) {
                throw new Error('next() called multiple times')
              }
              nextCalled = true
              return Promise.resolve().then(() => this.next().value)
            }),
            done: i === length
          }
        }
      }
    }
  }

  /**
   * @param {Object} context
   * @return {Promise}
   * @api public
   */

  return function (context, next) {
    // iteration object
    const iter = obj[SYMBOL_ITERATOR](middleware, context, next)

    try {
      return Promise.resolve(iter.next().value)
    } catch (err) {
      return Promise.reject(err)
    }
  }
}
