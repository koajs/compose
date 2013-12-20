
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
 * @return {Function}
 * @api public
 */

function compose(middleware){
  return function *(downstream){
    var done = false;
    var ctx = this;
    var i = 0;

    yield *next();

    function next(){
      var mw = middleware[i++];

      if (!mw) {
        if (done) throw new Error('middleware yielded control multiple times');
        done = true;
        return downstream || noop();
      }

      return mw.call(ctx, next());
    }
  }
}

/**
 * Noop.
 *
 * @api private
 */

function *noop(){}