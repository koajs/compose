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

  const composer = new Composer(null)
  let nextComposer = composer
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
    nextComposer = nextComposer.addNext(fn)
  }
  // a placehold composer for lastFn
  nextComposer.addNext(null)

  /**
   * @param {Object} context
   * @param {Function} lastFn
   * @return {Promise}
   * @api public
   */
  return function (context, lastFn) {
    return composer.nextFn(context, lastFn || null)()
  }
}

class Composer {
  constructor (fn) {
    this.fn = fn
    this.next = null
  }

  addNext (fn) {
    this.next = new Composer(fn)
    return this.next
  }

  nextFn (context, lastFn) {
    let called = false
    let composer = this.next

    return function next () {
      if (called) return Promise.reject(new Error('next() called multiple times'))
      called = true
      if (!composer) return Promise.resolve()
      // if composer.fn not exists, it is the placehold composer
      let fn = composer.fn || lastFn
      if (!fn) return Promise.resolve()
      try {
        return Promise.resolve(fn(context, composer.nextFn(context, lastFn)))
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}
