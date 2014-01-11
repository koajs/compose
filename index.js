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
    var name = prev._name || prev.name || 'noop';
    var curr;

    while (i--) {
      curr = middleware[i];
      prev = wrap.call(this, curr, prev, name);
      name = curr._name || curr.name;
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
    output(this, 'down', name);

    // yield
    this._level++;
    yield next;
    this._level--;

    // upstream
    output(this, 'up', name);
  }.call(this, prev));
}

/**
 * Output debugging information.
 */

function output(ctx, direction, name) {
  direction = 'up' == direction ? '<<' : '>>';
  console.log('  \033[1m%d \033[0m%s \033[36m%s\033[0m', ctx._level, direction, name);
  console.log('  \033[90mstatus\033[0m: %s %s', ctx.status, ctx.response.statusString);
  console.log('  \033[90mheader\033[0m:');
  header(ctx);
  console.log('  \033[90mbody\033[0m: %j', ctx.body);
  console.log();
}

/**
 * Output header fields.
 */

function header(ctx) {
  for (var key in ctx.response.header) {
    console.log('    \033[90m%s\033[0m: %s', key, ctx.response.header[key]);
  }
}

/**
 * Noop.
 *
 * @api private
 */

function *noop(){}
