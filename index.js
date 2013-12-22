
/**
 * Module dependencies.
 */

var debug = require('debug')('koa-compose');
var fmt = require('util').inspect;

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
  return function *(next){
    var i = middleware.length;
    var prev = next || noop();
    var curr;

    while (i--) {
      curr = middleware[i];
      prev = curr.call(this, prev);
    }

    yield *prev;
  }
}

/**
 * Compose `middleware` returning
 * an instrumented set of middleware
 * for debugging manipulation between
 * continuation.
 *
 * @param {Array} middleware
 * @return {Function}
 * @api public
 */

function instrumented(middleware){
  console.warn('Warning: do not run DEBUG=koa-compose in production');
  console.warn('as it will greatly affect the performance of your');
  console.warn('application - it is designed for a development');
  console.warn('environment only.\n');

  return function *(next){
    var i = middleware.length;
    var prev = next || noop();
    var name = prev.name || 'noop';
    var curr;

    while (i--) {
      curr = middleware[i];
      prev = wrap.call(this, curr, prev, name);
      name = curr.name;
    }

    yield *prev;
  }
}

/**
 * Wrap to output debugging info.
 *
 * @api private
 */

function wrap(curr, prev, name) {
  return curr.call(this, function *(next){
    if ('noop' == name) return yield next;
    this._level = this._level || 0;

    // downstream
    console.log('  \033[1m%d | \033[0m>> \033[36m%s\033[0m', this._level, name);
    console.log();
    console.log(fmt(this.response, { depth: 5, colors: true }).replace(/^/gm, '  '));
    console.log();

    // yield
    this._level++;
    yield next;
    this._level--;

    // upstream
    console.log('  \033[1m%d | \033[0m<< \033[36m%s\033[0m', this._level, name);
    console.log();
    console.log(fmt(this.response, { depth: 5, colors: true }).replace(/^/gm, '  '));
    console.log();
  }.call(this, prev));
}

/**
 * Noop.
 *
 * @api private
 */

function *noop(){}