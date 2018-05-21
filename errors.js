'use strict'

exports.DuplicateNextCallError = class DuplicateNextCallError extends Error {
  constructor() {
    super('next() called multiple times');
    Error.captureStackTrace(this, DuplicateNextCallError);
  }
}
