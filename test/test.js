'use strict'

/* eslint-env mocha */

const compose = require('..')
const assert = require('assert')

function wait (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms || 1))
}

function isPromise (x) {
  return x && typeof x.then === 'function'
}

describe('Koa Compose', function () {
  describe('when rescurive', function () {
    it('should work', () => {
      const arr = []
      const stack = []

      stack.push(async (ctx, next) => {
        arr.push(1)
        await wait(1)
        await next()
        await wait(1)
        arr.push(8)
      })

      stack.push([
        async (ctx, next) => {
          arr.push(2)
          await wait(1)
          await next()
          await wait(1)
          arr.push(7)
        },
        async (ctx, next) => {
          arr.push(3)
          await wait(1)
          await next()
          await wait(1)
          arr.push(6)
        }
      ])

      stack.push(async (ctx, next) => {
        arr.push(4)
        await wait(1)
        await next()
        await wait(1)
        arr.push(5)
      })

      return compose(stack)({}).then(function () {
        arr.should.eql([1, 2, 3, 4, 5, 6, 7, 8])
      })
    })

    it('should be able to be called twice', () => {
      const stack = []

      stack.push(async (context, next) => {
        context.arr.push(1)
        await wait(1)
        await next()
        await wait(1)
        context.arr.push(8)
      })

      stack.push([
        async (context, next) => {
          context.arr.push(2)
          await wait(1)
          await next()
          await wait(1)
          context.arr.push(7)
        },
        async (context, next) => {
          context.arr.push(3)
          await wait(1)
          await next()
          await wait(1)
          context.arr.push(6)
        }
      ])

      stack.push(async (context, next) => {
        context.arr.push(4)
        await wait(1)
        await next()
        await wait(1)
        context.arr.push(5)
      })

      const fn = compose(stack)
      const ctx1 = { arr: [] }
      const ctx2 = { arr: [] }
      const out = [1, 2, 3, 4, 5, 6, 7, 8]

      return fn(ctx1).then(() => {
        assert.deepEqual(out, ctx1.arr)
        return fn(ctx2)
      }).then(() => {
        assert.deepEqual(out, ctx2.arr)
      })
    })

    it('should throw if next() is called multiple times within recursion', function () {
      return compose([[
        async (ctx, next) => {
          await next()
          await next()
        }
      ]])({}).then(() => {
        throw new Error('boom')
      }, (err) => {
        assert(/multiple times/.test(err.message))
      })
    })
  })

  it('should work', function () {
    var arr = []
    var stack = []

    stack.push(async (context, next) => {
      arr.push(1)
      await wait(1)
      await next()
      await wait(1)
      arr.push(6)
    })

    stack.push(async (context, next) => {
      arr.push(2)
      await wait(1)
      await next()
      await wait(1)
      arr.push(5)
    })

    stack.push(async (context, next) => {
      arr.push(3)
      await wait(1)
      await next()
      await wait(1)
      arr.push(4)
    })

    return compose(stack)({}).then(function () {
      arr.should.eql([1, 2, 3, 4, 5, 6])
    })
  })

  it('should be able to be called twice', () => {
    var stack = []

    stack.push(async (context, next) => {
      context.arr.push(1)
      await wait(1)
      await next()
      await wait(1)
      context.arr.push(6)
    })

    stack.push(async (context, next) => {
      context.arr.push(2)
      await wait(1)
      await next()
      await wait(1)
      context.arr.push(5)
    })

    stack.push(async (context, next) => {
      context.arr.push(3)
      await wait(1)
      await next()
      await wait(1)
      context.arr.push(4)
    })

    const fn = compose(stack)
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

  it('should only accept an array', function () {
    var err
    try {
      (compose()).should.throw()
    } catch (e) {
      err = e
    }
    return (err).should.be.instanceof(TypeError)
  })

  it('should create next functions that return a Promise', function () {
    const stack = []
    const arr = []
    for (let i = 0; i < 5; i++) {
      stack.push((context, next) => {
        arr.push(next())
      })
    }

    compose(stack)({})

    for (let next of arr) {
      assert(isPromise(next), 'one of the functions next is not a Promise')
    }
  })

  it('should work with 0 middleware', function () {
    return compose([])({})
  })

  it('should accept middleware as functions', function () {
    var err
    try {
      (compose([{}])).should.throw()
    } catch (e) {
      err = e
    }
    return (err).should.be.instanceof(TypeError)
  })

  it('should work when yielding at the end of the stack', function () {
    var stack = []
    var called = false

    stack.push(async (ctx, next) => {
      await next()
      called = true
    })

    return compose(stack)({}).then(function () {
      assert(called)
    })
  })

  it('should reject on errors in middleware', function () {
    var stack = []

    stack.push(() => { throw new Error() })

    return compose(stack)({})
      .then(function () {
        throw new Error('promise was not rejected')
      })
      .catch(function (e) {
        e.should.be.instanceof(Error)
      })
  })

  it('should work when yielding at the end of the stack with yield*', function () {
    var stack = []

    stack.push(async (ctx, next) => {
      await next
    })

    compose(stack)({})
  })

  it('should keep the context', function () {
    var ctx = {}

    var stack = []

    stack.push(async (ctx2, next) => {
      await next()
      ctx2.should.equal(ctx)
    })

    stack.push(async (ctx2, next) => {
      await next()
      ctx2.should.equal(ctx)
    })

    stack.push(async (ctx2, next) => {
      await next()
      ctx2.should.equal(ctx)
    })

    return compose(stack)(ctx)
  })

  it('should catch downstream errors', function () {
    var arr = []
    var stack = []

    stack.push(async (ctx, next) => {
      arr.push(1)
      try {
        arr.push(6)
        await next()
        arr.push(7)
      } catch (err) {
        arr.push(2)
      }
      arr.push(3)
    })

    stack.push(async (ctx, next) => {
      arr.push(4)
      throw new Error()
      // arr.push(5)
    })

    return compose(stack)({}).then(function () {
      arr.should.eql([1, 6, 4, 2, 3])
    })
  })

  it('should compose w/ next', function () {
    var called = false

    return compose([])({}, async () => {
      called = true
    }).then(function () {
      assert(called)
    })
  })

  it('should handle errors in wrapped non-async functions', function () {
    var stack = []

    stack.push(function () {
      throw new Error()
    })

    return compose(stack)({}).then(function () {
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
      async (ctx, next) => {
        await next()
        await next()
      }
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

    stack.push(async (context, next) => {
      var val = await next()
      val.should.equal(2)
      return 1
    })

    stack.push(async (context, next) => {
      var val = await next()
      val.should.equal(0)
      return 2
    })
    var next = () => 0
    return compose(stack)({}, next).then(function (val) {
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
})
