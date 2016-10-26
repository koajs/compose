'use strict'

/* eslint-env mocha */

const co = require('co')
const compose = require('..')
const assert = require('assert')

function wait (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms || 1))
}

describe('Koa Compose', function () {
  it('should work', function () {
    var arr = []
    var stack = []

    stack.push(function * (context, next) {
      arr.push(1)
      yield wait(1)
      yield next()
      yield wait(1)
      arr.push(6)
    })

    stack.push(function * (context, next) {
      arr.push(2)
      yield wait(1)
      yield next()
      yield wait(1)
      arr.push(5)
    })

    stack.push(function * (context, next) {
      arr.push(3)
      yield wait(1)
      yield next()
      yield wait(1)
      arr.push(4)
    })

    return compose(stack.map((fn) => co.wrap(fn)))({}).then(function () {
      arr.should.eql([1, 2, 3, 4, 5, 6])
    })
  })

  it('should be able to be called twice', () => {
    var stack = []

    stack.push(function * (context, next) {
      context.arr.push(1)
      yield wait(1)
      yield next()
      yield wait(1)
      context.arr.push(6)
    })

    stack.push(function * (context, next) {
      context.arr.push(2)
      yield wait(1)
      yield next()
      yield wait(1)
      context.arr.push(5)
    })

    stack.push(function * (context, next) {
      context.arr.push(3)
      yield wait(1)
      yield next()
      yield wait(1)
      context.arr.push(4)
    })

    const fn = compose(stack.map((fn) => co.wrap(fn)))
    const ctx1 = { arr: [] }
    const ctx2 = { arr: [] }
    const out = [1, 2, 3, 4, 5, 6]

    return fn(ctx1).then(() => {
      assert.deepEqual(out, ctx1.arr)

      return fn(ctx2)
    }).then(() => {
      assert.deepEqual(out, ctx2.arr)
    })
  })

  it('should support variadic arguments', function () {
    const arr = []
    const gen = str => (ctx, next) => new Promise((resolve, reject) => {
      arr.push(str)
      next()
      resolve()
    })

    const promise = compose(gen('a'), gen('b'), gen('c'))({})
    return promise.then(() => arr.should.eql([ 'a', 'b', 'c' ]))
  })

  it('should work with 0 middleware', function () {
    return compose([])({})
  })

  it('should only accept middleware as functions', function () {
    var err
    try {
      (compose([{}]))({}).should.throw()
    } catch (e) {
      err = e
    }
    return (err).should.be.instanceof(TypeError)
  })

  it('should work when yielding at the end of the stack', function () {
    var stack = []
    var called = false

    stack.push(function * (ctx, next) {
      yield next()
      called = true
    })

    return compose(stack.map(co.wrap))({}).then(function () {
      assert(called)
    })
  })

  it('should reject on errors in middleware', function () {
    var stack = []

    stack.push(function * () { throw new Error() })

    return compose(stack.map(co.wrap))({})
      .then(function () {
        throw new Error('promise was not rejected')
      })
      .catch(function (e) {
        e.should.be.instanceof(Error)
      })
  })

  it('should work when yielding at the end of the stack with yield*', function () {
    var stack = []

    stack.push(function * (ctx, next) {
      yield next
    })

    compose(stack.map(co.wrap))({})
  })

  it('should keep the context', function () {
    var ctx = {}

    var stack = []

    stack.push(function * (ctx2, next) {
      yield next()
      ctx2.should.equal(ctx)
    })

    stack.push(function * (ctx2, next) {
      yield next()
      ctx2.should.equal(ctx)
    })

    stack.push(function * (ctx2, next) {
      yield next()
      ctx2.should.equal(ctx)
    })

    return compose(stack.map(co.wrap))(ctx)
  })

  it('should catch downstream errors', function () {
    var arr = []
    var stack = []

    stack.push(function * (ctx, next) {
      arr.push(1)
      try {
        arr.push(6)
        yield next()
        arr.push(7)
      } catch (err) {
        arr.push(2)
      }
      arr.push(3)
    })

    stack.push(function * (ctx, next) {
      arr.push(4)
      throw new Error()
      // arr.push(5)
    })

    return compose(stack.map(co.wrap))({}).then(function () {
      arr.should.eql([1, 6, 4, 2, 3])
    })
  })

  it('should compose w/ next', function () {
    var called = false

    return compose([])({}, co.wrap(function * () {
      called = true
    })).then(function () {
      assert(called)
    })
  })

  it('should handle errors in wrapped non-async functions', function () {
    var stack = []

    stack.push(function () {
      throw new Error()
    })

    return compose(stack.map(co.wrap))({}).then(function () {
      throw new Error('promise was not rejected')
    }).catch(function (e) {
      e.should.be.instanceof(Error)
    })
  })

  // https://github.com/koajs/compose/pull/27#issuecomment-143109739
  it('should compose w/ other compositions', function () {
    var called = []

    return compose([
      compose([
        (ctx, next) => {
          called.push(1)
          return next()
        },
        (ctx, next) => {
          called.push(2)
          return next()
        }
      ]),
      (ctx, next) => {
        called.push(3)
        return next()
      }
    ])({}).then(() => assert.deepEqual(called, [1, 2, 3]))
  })

  it('should throw if next() is called multiple times', function () {
    return compose([
      co.wrap(function * (ctx, next) {
        yield next()
        yield next()
      })
    ])({}).then(() => {
      throw new Error('boom')
    }, (err) => {
      assert(/multiple times/.test(err.message))
    })
  })

  it('should return a valid middleware', function () {
    var val = 0
    compose([
      compose([
        (ctx, next) => {
          val++
          return next()
        },
        (ctx, next) => {
          val++
          return next()
        }
      ]),
      (ctx, next) => {
        val++
        return next()
      }
    ])({}).then(function () {
      val.should.equal(3)
    })
  })

  it('should return last return value', function () {
    var stack = []

    stack.push(function * (context, next) {
      var val = yield next()
      val.should.equal(2)
      return 1
    })

    stack.push(function * (context, next) {
      var val = yield next()
      val.should.equal(0)
      return 2
    })
    var next = () => 0
    return compose(stack.map(co.wrap))({}, next).then(function (val) {
      val.should.equal(1)
    })
  })

  it('should not affect the original middleware array', () => {
    const middleware = []
    const fn1 = (ctx, next) => {
      return next()
    }
    middleware.push(fn1)

    for (const fn of middleware) {
      assert.equal(fn, fn1)
    }

    compose(middleware)

    for (const fn of middleware) {
      assert.equal(fn, fn1)
    }
  })

  it('should not get stuck on the passed in next', () => {
    const middleware = [(ctx, next) => {
      ctx.middleware++
      return next()
    }]
    const ctx = {
      middleware: 0,
      next: 0
    }

    return compose(middleware)(ctx, (ctx, next) => {
      ctx.next++
      return next()
    }).then(() => {
      ctx.should.eql({ middleware: 1, next: 1 })
    })
  })

  it('should not cache middleware', function() {
    var arr = []
    var stack = []

    stack.push(function original(ctx, next) {
      arr.push(0)
      return next().then(() => arr.push(5))
    })

    var composed = compose(stack)

    stack[0] = function replacement(ctx, next) {
      arr.push(1)
      return next().then(() => arr.push(4))
    }

    stack.push(function inserted(ctx, next) {
      arr.push(2)
      return next().then(() => arr.push(3))
    })

    return composed({}).then(function () {
      arr.should.eql([1, 2, 3, 4])
    })
  })
})
