
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
  return function(next){
    var i = middleware.length;
    var curr;

    function *prev(){
      yield next;
    }

    while (curr = middleware[--i]) {
      prev = curr(prev);
    }

    return prev;
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