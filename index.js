
/**
 * Expose compositor.
 */

module.exports = compose;

/**
 * Lazily flattens an array in reverse order
 *
 * @param {Array} arr
 * @return {Iterable<Function>}
 * @api private
 */
function *flatten(arr) {
  for (var i = arr.length - 1; i >= 0; i--) {
    var item = arr[i];
    if (item instanceof Array) {
      yield* flatten(item);
    } else {
      yield item;
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

function compose(){
  var middleware = flatten(arguments);
  return function *(next){
    if (!next) next = noop();

    var curr = middleware.next();
    while (!curr.done) {
      next = curr.value.call(this, next);
      curr = middleware.next();
    }

    return yield *next;
  }
}

/**
 * Noop.
 *
 * @api private
 */

function *noop(){}
