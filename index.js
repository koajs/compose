
/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Array} middleware
 * @return {Function}
 * @api public
 */

module.exports = function(middleware){
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
};