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
  const composer = new Composer()

  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
    composer.push(fn)
  }
  // a placehold for lastFn
  composer.push(null)

  /**
   * @param {Object} context
   * @param {Function} lastFn
   * @return {Promise}
   * @api public
   */
  return function (context, lastFn) {
    try {
      return Promise.resolve(composer.runNext(0, context, lastFn))
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

class Composer extends Array {
  runNext (index, context, lastFn) {
    let ctx = this
    let called = false
    if (index >= this.length) return

    // if this[index] not exists, it is the placehold for lastFn
    let fn = this[index] || lastFn
    // should keep function name "next"
    return fn && fn(context, function next () {
      if (called) throw new Error('next() called multiple times')
      called = true

      return Promise.resolve(ctx.runNext(index + 1, context, lastFn))
    })
  }
}
