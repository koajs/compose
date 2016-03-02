'use strict'

const compose = require('..')

suite('compose', () => {
  set('type', 'adaptive')
  set('mintime', 1000)
  set('delay', 100)

  const logic = () => Promise.resolve(true)

  const fn = (ctx, next) => {
    return logic().then(next).then(logic)
  }

  for (let exp = 0; exp <= 10; exp++) {
    const count = Math.pow(2, exp)
    const arr = []
    for (let i = 0; i < count; i++) {
      arr.push(fn)
    }
    const stack = compose(arr)

    bench(`(fn * ${count})`, done => {
      stack({}).then(done, done)
    })
  }
})
