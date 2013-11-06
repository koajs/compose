var co = require('co');
var compose = require('./');

describe('Koa Compose', function(){
  it('should work', function(done){
    var arr = [];
    var stack = [];

    stack.push(function *(next){
      arr.push(1);
      yield next();
      arr.push(6);
    })

    stack.push(function *(next){
      arr.push(2);
      yield next();
      arr.push(5);
    })

    stack.push(function *(next){
      arr.push(3);
      yield next();
      arr.push(4);
    })

    co(compose(stack))(function(err){
      if (err) throw err;

      arr.should.eql([1, 2, 3, 4, 5, 6]);
      done();
    })
  })

  it('should work with 0 middleware', function(done){
    co(compose([]))(done);
  })

  it('should work within a generator', function(done){
    var arr = [];

    co(function *(){
      arr.push(0);

      var stack = [];

      stack.push(function* (next){
        arr.push(1);
        yield next();
        arr.push(4);
      });

      stack.push(function *(next){
        arr.push(2);
        yield next();
        arr.push(3);
      });

      yield compose(stack)

      arr.push(5);
    })(function(err){
      if (err) throw err;

      arr.should.eql([0, 1, 2, 3, 4, 5]);
      done();
    })
  })

  it('should work when yielding at the end of the stack', function(done) {
    var stack = [];

    stack.push(function *(next){
      yield next();
    });

    co(compose(stack))(done);
  })

  it('should keep the context', function(done){
    var ctx = {};

    var stack = [];

    stack.push(function *(next){
      this.should.equal(ctx);
    })

    stack.push(function *(next){
      this.should.equal(ctx);
    })

    stack.push(function *(next){
      this.should.equal(ctx);
    })

    co.call(ctx, compose(stack))(done);
  })

  it('should throw when `next()` out of the stack', function(done){
    var stack = [];

    stack.push(function *(next){
      yield next();
      yield next();
    })

    co(compose(stack))(function(err){
      err.should.be.ok;
      done();
    })
  })
})