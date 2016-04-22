(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'any-promise'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, require('any-promise'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, global.anyPromise);
    global.index = mod.exports;
  }
})(this, function (module, Promise) {
  'use strict';

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

  function compose(middleware) {
    if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!');
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = middleware[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var fn = _step.value;

        if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!');
      }

      /**
       * @param {Object} context
       * @return {Promise}
       * @api public
       */
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return function (context, next) {
      // last called middleware #
      var index = -1;
      return dispatch(0);
      function dispatch(i) {
        if (i <= index) return Promise.reject(new Error('next() called multiple times'));
        index = i;
        var fn = middleware[i] || next;
        if (!fn) return Promise.resolve();
        try {
          return Promise.resolve(fn(context, function next() {
            return dispatch(i + 1);
          }));
        } catch (err) {
          return Promise.reject(err);
        }
      }
    };
  }
});
