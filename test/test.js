var co = require('co');
var compose = require('..');

function wait(ms) {
  return function (done) {
    setTimeout(done, ms || 0);
  }
}

describe('Koa Compose', function(){
  it('should work', function(done){
    var arr = [];
    var stack = [];

    stack.push(function *(next){
      arr.push(1);
      yield wait(1);
      yield next;
      yield wait(1);
      arr.push(6);
    })

    stack.push(function *(next){
      arr.push(2);
      yield wait(1);
      yield next;
      yield wait(1);
      arr.push(5);
    })

    stack.push(function *(next){
      arr.push(3);
      yield wait(1);
      yield next;
      yield wait(1);
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
        yield next;
        arr.push(4);
      });

      stack.push(function *(next){
        arr.push(2);
        yield next;
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
      yield next;
    });

    co(compose(stack))(done);
  })

  it('should work when yielding at the end of the stack with yield*', function(done) {
    var stack = [];

    stack.push(function *(next){
      yield* next;
    });

    co(compose(stack))(done);
  })

  it('should keep the context', function(done){
    var ctx = {};

    var stack = [];

    stack.push(function *(next){
      yield next
      this.should.equal(ctx);
    })

    stack.push(function *(next){
      yield next
      this.should.equal(ctx);
    })

    stack.push(function *(next){
      yield next
      this.should.equal(ctx);
    })

    co(compose(stack)).call(ctx, done);
  })

  it('should catch downstream errors', function(done){
    var arr = [];
    var stack = [];

    stack.push(function *(next){
      arr.push(1);
      try {
        arr.push(6);
        yield next;
        arr.push(7);
      } catch (err) {
        arr.push(2);
      }
      arr.push(3);
    })

    stack.push(function *(next){
      arr.push(4);
      throw new Error();
      arr.push(5);
    })

    co(compose(stack))(function(err){
      if (err) throw err;

      arr.should.eql([1, 6, 4, 2, 3]);
      done();
    })
  })

  it('should return last return value', function(done){
    var stack = [];

    stack.push(function *(next){
      var val = yield next;
      val.should.equal(2);
      return 1;
    });
    stack.push(function *(next){
      yield next;
      return 2;
    });

    co(compose(stack))(function(err, val){
      val.should.equal(1);
      done();
    });
  })
})
