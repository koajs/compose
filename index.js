
/**
 * Module dependencies.
 */

var debug = require('debug')('koa-compose');

/**
 * Expose compositor.
 */

module.exports = debug.enabled
  ? instrumented
  : compose;

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
  var l = middleware.length;

  return function *(downstream){
    var i = 0;
    var ctx = this;
    var ended = false;

    yield next();

    function next(){
      // end of stack
      if (i === l) {
        // already ended, developer error
        if (ended) throw new Error('stack called out of bounds');
        ended = true;
        return downstream || noop;
      }

      // return the next generator
      return middleware[i++].call(ctx, next);
    }
  }
}

/**
 * Compose `middleware` instrumented for debugging.
 *
 * TODO: remove and support arbitrary hook?
 *
 * @param {Array} middleware
 * @return {Function}
 * @api public
 */

function instrumented(middleware){
  return function(next){
    var i = middleware.length;
    var curr;

    function *prev(){
      yield next;
    }

    while (curr = middleware[--i]) {
      prev = instrument(curr(prev));
    }

    return prev;
  }
}

/**
 * Instrument a middleware function.
 *
 * @param {Function} next
 * @return {GeneratorFunction}
 * @api private
 */

function instrument(next) {
  return function *wrap(){
    var name = next.name || '-';
    debug('\033[33m->\033[0m %s', name);
    yield next;
    debug('\033[32m<-\033[0m %s', name);
  }
}

/**
 * No-operation yieldable.
 * So users don't get a "not a function" error
 * when `next` is not defined.
 *
 * .nextTick'd because I get "generator already finished" otherwise.
 *
 * @api private
 */

function noop(done){
  process.nextTick(done);
}