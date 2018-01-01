'use strict'

/**
 * Helper function that checks whether passed parameter is NOT a function
 * @param {Object} fn
 * @return {Boolean}
 * @api private
 */
exports.isNotFunction = fn => !(typeof fn === 'function' && fn.length > -1 && fn.length < 3);
