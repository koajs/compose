'use strict'

/**
 * Expose compositor.
 */

module.exports = compose;

function noop () {
  return Promise.resolve()
}

/**
 * Try catch middlware invocation
 * @api private
 * @param fn
 * @param ctx
 * @param next
 * @returns {Promise<any>}
 */

function tryCatch(fn, ctx, next) {
  try {
    return Promise.resolve(fn(ctx, next))
  } catch (err) {
    return Promise.reject(err)
  }
}


/**
 * Reducer for creating storing next reference
 * @api private
 * @param next
 * @param mw
 * @returns {Function}
 */

function middlewareReducer(next, mw) {
  return function(ctx, nextFn) {
    ctx.next = next && function () { return next(ctx, nextFn) }
      || nextFn
      || noop
    return tryCatch(mw, ctx, ctx.next)
  }
}

/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Array} middleware
 * @return {Function}
 * @api public
 */

function compose(middleware){
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
  }
  if (!middleware.length) {
    return function(ctx, next) {
      return tryCatch(next || noop, ctx, noop)
    }
  }
  return middleware.reduceRight(middlewareReducer, undefined)
}
