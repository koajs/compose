'use strict'

const co = require('co');
const compose = require('..');
const assert = require('assert');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms || 1))
}

describe('Koa Compose', function(){
  it('should work', function(){
    var arr = [];
    var stack = [];

    stack.push(function *(context, next){
      arr.push(1);
      yield wait(1);
      yield next();
      yield wait(1);
      arr.push(6);
    })

    stack.push(function *(context, next){
      arr.push(2);
      yield wait(1);
      yield next();
      yield wait(1);
      arr.push(5);
    })

    stack.push(function *(context, next){
      arr.push(3);
      yield wait(1);
      yield next();
      yield wait(1);
      arr.push(4);
    })

    return compose(stack.map(fn => co.wrap(fn)))({}).then(function () {
      arr.should.eql([1, 2, 3, 4, 5, 6]);
    })
  })

  it('should only accept an array', function () {
    var err;
    try {
      (compose()).should.throw();
    } catch(e) {
      err = e;
    }
    return (err).should.be.instanceof(TypeError);
  })

  it('should work with 0 middleware', function(){
    return compose([])({});
  })

  it('should only accept middleware as functions', function(){
    var err;
    try {
      (compose([{}])).should.throw();
    } catch(e) {
      err = e;
    }
    return (err).should.be.instanceof(TypeError);
  })

  it('should work when yielding at the end of the stack', function() {
    var stack = [];
    var called = false;

    stack.push(function *(ctx, next){
      yield next();
      called = true;
    });

    return compose(stack.map(co.wrap))({}).then(function () {
      assert(called)
    });
  })

  it('should reject on errors in middleware', function(){
    var stack = [];

    stack.push(function *(){throw new Error});

    return compose(stack.map(co.wrap))({})
        .then(function () {
          throw 'promise was not rejected'
        })
        .catch(function (e) {
          e.should.be.instanceof(Error)
        });
  })

  it('should work when yielding at the end of the stack with yield*', function() {
    var stack = [];

    stack.push(function *(ctx, next){
      yield next;
    });

    compose(stack.map(co.wrap))({});
  })

  it('should keep the context', function(){
    var ctx = {};

    var stack = [];

    stack.push(function *(ctx2, next){
      yield next();
      ctx2.should.equal(ctx);
    })

    stack.push(function *(ctx2, next){
      yield next()
      ctx2.should.equal(ctx);
    })

    stack.push(function *(ctx2, next){
      yield next()
      ctx2.should.equal(ctx);
    })

    return compose(stack.map(co.wrap))(ctx);
  })

  it('should catch downstream errors', function(){
    var arr = [];
    var stack = [];

    stack.push(function *(ctx, next){
      arr.push(1);
      try {
        arr.push(6);
        yield next();
        arr.push(7);
      } catch (err) {
        arr.push(2);
      }
      arr.push(3);
    })

    stack.push(function *(ctx, next){
      arr.push(4);
      throw new Error();
      arr.push(5);
    })

    return compose(stack.map(co.wrap))({}).then(function () {
      arr.should.eql([1, 6, 4, 2, 3]);
    })
  })

  it('should compose w/ next', function() {
    var called = false;

    return compose([])({}, co.wrap(function* () {
      called = true
    })).then(function () {
      assert(called)
    })
  })
})
