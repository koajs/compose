
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
  return function *(downstream){
    var done = false;
    var ctx = this;
    var i = 0;

    yield next();

    function next(){
      var mw = middleware[i++];
      
      if (!mw) {
        if (done) throw new Error('middleware yielded control multiple times');
        done = true;
        return downstream || noop;
      }

      return mw.call(ctx, next);
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