var composition = require('composition');

/**
 * Expose compositor.
 */

module.exports = compose;

/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Array} middleware
 * @param {Boolean} experimental
 * @return {Function}
 * @api public
 */

function compose(middleware, experimental){
  if (experimental) return composition(middleware);

  return function *(next){
    if (!next) next = noop();

    var i = middleware.length;

    while (i--) {
      next = middleware[i].call(this, next);
    }

    yield *next;
  }
}

/**
 * Noop.
 *
 * @api private
 */

function *noop(){}
