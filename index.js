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

  middleware[Symbol.iterator] = function () {
    const self = this
    const length = self.length
    let i = 0
    let context
    let nextFunc

    return {
      next (c, n) {
        if (!context) context = c
        if (!nextFunc) nextFunc = n

        let fn = self[i++]
        let done = i > length
        let value

        if (done) {
          value = nextFunc ? nextFunc() : void 0
        } else {
          value = fn.call(this, context, this.next.bind(this))
        }

        return {
          value,
          done
        }
      }
    }
  }

  // Alternative iteration.
  const iter = middleware[Symbol.iterator]()

  /**
   * @param {Object} context
   * @return {Promise}
   * @api public
   */

  return function (context, next) {
    try {
      let value = iter.next(context, next).value
      return Promise.resolve(value)
    } catch (err) {
      return Promise.reject(err)
    }
  }
}
