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
   * @param {Object} context
   * @return {Promise}
   * @api public
   */

  middleware[Symbol.iterator] = function () {
    let self = this
    let i = 0
    let c
    let n
    return {
      next (_c, _n) {
        if (!c) c = _c
        if (!n) n = _n
        let fn = self[i++]
        let ended = i > self.length
        let result = void 0

        if (!ended) {
          result = fn.call(this, c, this.next.bind(this))
        } else {
          result = n ? n() : void 0
        }

        return {
          value: result,
          done: ended
        }
      }
    }
  }

  let iter = middleware[Symbol.iterator]()

  return function (context, next) {
    return new Promise((resolve, reject) => {
      let value = iter.next(context, next).value
      if (value && value.then) value.then(resolve).catch(reject)
      else resolve(value)
    })
  }
}
