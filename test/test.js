'use strict'

/* eslint-env jest */
const { describe, it, beforeEach, after } = require('node:test')
const compose = require('..')
const assert = require('assert')

function wait (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms || 1))
}

function isPromise (x) {
  return x && typeof x.then === 'function'
}

function testBaseFunctionality () {
  it('should work', async () => {
    const arr = []
    const stack = []

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

    await compose(stack)({})
    assert.deepStrictEqual(arr.sort(), [1, 2, 3, 4, 5, 6])
  })

  it('should be able to be called twice', () => {
    const stack = []

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

  it('should create next functions that return a Promise', function () {
    const stack = []
    const arr = []
    for (let i = 0; i < 5; i++) {
      stack.push((context, next) => {
        const result = next()
        arr.push(result)
        return result
      })
    }

    compose(stack)({})

    for (const next of arr) {
      assert(isPromise(next), 'one of the functions next is not a Promise')
    }
  })

  it('should work with 0 middleware', function () {
    return Promise.all([
      compose()({}),
      compose([])({}),
      compose([], [])({})
    ])
  })

  it('should only accept middleware as functions', () => {
    const badTypes = [1, true, 'string', {}, undefined, Symbol('test')];
    [...badTypes, []].forEach((badType) => {
      assert.throws(() => compose([badType]), TypeError)
    })
    badTypes.forEach((badType) => {
      assert.throws(() => compose(badType), TypeError)
    })
  })

  it('should work when yielding at the end of the stack', async () => {
    const stack = []
    let called = false

    stack.push(async (ctx, next) => {
      await next()
      called = true
    })

    await compose(stack)({})
    assert(called)
  })

  it('should reject on errors in middleware', () => {
    const stack = []

    stack.push(() => { throw new Error() })

    return assert.rejects(
      compose(stack)({}),
      /Error/
    )
  })

  it('should keep the context', () => {
    const ctx = {}

    const stack = []

    stack.push(async (ctx2, next) => {
      await next()
      assert.deepStrictEqual(ctx2, ctx)
    })

    stack.push(async (ctx2, next) => {
      await next()
      assert.deepStrictEqual(ctx2, ctx)
    })

    stack.push(async (ctx2, next) => {
      await next()
      assert.deepStrictEqual(ctx2, ctx)
    })

    return compose(stack)(ctx)
  })

  it('should catch downstream errors', async () => {
    const arr = []
    const stack = []

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
    })

    await compose(stack)({})
    assert.deepStrictEqual(arr, [1, 6, 4, 2, 3])
  })

  it('should compose w/ next', () => {
    let called = false

    return compose([])({}, async () => {
      called = true
    }).then(function () {
      assert(called)
    })
  })

  it('should handle errors in wrapped non-async functions', () => {
    const stack = []

    stack.push(function () {
      throw new Error()
    })

    return assert.rejects(
      compose(stack)({}),
      /Error/
    )
  })

  // https://github.com/koajs/compose/pull/27#issuecomment-143109739
  it('should compose w/ other compositions', () => {
    const called = []

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

  it('should return a valid middleware', () => {
    let val = 0
    return compose([
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
      assert.strictEqual(val, 3)
    })
  })

  it('should return last return value', () => {
    const stack = []

    stack.push(async (context, next) => {
      const val = await next()
      assert.strictEqual(val, 2)
      return 1
    })

    stack.push(async (context, next) => {
      const val = await next()
      assert.strictEqual(val, 0)
      return 2
    })

    const next = () => 0
    return compose(stack)({}, next).then(function (val) {
      assert.strictEqual(val, 1)
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
      assert.strictEqual(ctx.middleware, 1)
    })
  })
}

function testDevErrors () {
  it('should only accept middleware as functions', () => {
    assert.throws(() => compose([{}]), TypeError)
  })

  it('should throw if next() is called multiple times', () => {
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

  it('should detect disconnected promise chains', async () => {
    const middleware = [
      (ctx, next) => next(),
      (ctx, next) => {
        next()
      },
      async (ctx, next) => {
        await wait(1)
        return next()
      }
    ]
    await assert.rejects(
      compose(middleware)({}),
      /resolved before downstream/
    )
  })
}
describe('Koa Compose', function () {
  const OLD_ENV = process.env

  beforeEach(() => {
    delete require.cache[require.resolve('..')] // Most important - it clears the cache
    process.env = { ...OLD_ENV, NODE_ENV: 'production' } // Make a copy
  })

  after(() => {
    process.env = OLD_ENV // Restore old environment
  })

  testBaseFunctionality()
})

describe('Koa Compose - Dev', function () {
  testBaseFunctionality()
  testDevErrors()
})
