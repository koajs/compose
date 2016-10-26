'use strict'

const Promise = require('any-promise')

/**
 * Expose compositor.
 */

module.exports = compose

/**
 * Lazily flattens an array in reverse order
 *
 * @param {Array} arr
 * @return {Iterable<Function>}
 * @api private
 */
function * flatten (arr) {
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]
    if (item instanceof Array) {
      yield* flatten(item)
    } else {
      yield item
    }
  }
}

/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Array|Function...} middleware
 * @return {Function}
 * @api public
 */

function compose () {
  let args = arguments

  /**
   * @param {Object} context
   * @return {Promise}
   * @api public
   */

  return function (context, next) {
    const middleware = flatten(args)
    let done = false
    function dispatch () {
      if (done) return Promise.resolve()
      const curr = middleware.next()
      done = curr.done
      const fn = done ? next : curr.value
      if (!fn) return Promise.resolve()
      if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
      return Promise.resolve().then(function () { // for implicit try-catch
        let nextCalled = false
        return fn(context, function next () {
          if (nextCalled) {
            return Promise.reject(new Error('next() called multiple times'))
          } else {
            nextCalled = true
            return dispatch()
          }
        })
      })
    }
    return dispatch()
  }
}
