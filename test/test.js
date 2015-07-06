var co = require('co');
var compose = require('..');

function wait(ms) {
  return function (done) {
    setTimeout(done, ms || 0);
  }
}

[
  true,
  false
].forEach(function (experimental) {
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

      return co(compose(stack, experimental)).then(function(arr){
        arr.should.eql([1, 2, 3, 4, 5, 6]);
      })
    })

    it('should work with 0 middleware', function(){
      return co(compose([], experimental));
    })

    it('should work within a generator', function(){
      var arr = [];

      return co(function *(){
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

        yield compose(stack, experimental)

        arr.push(5);
      }).then(function(arr){
        arr.should.eql([0, 1, 2, 3, 4, 5]);
      })
    })

    it('should work when yielding at the end of the stack', function() {
      var stack = [];

      stack.push(function *(next){
        yield next;
      });

      return co(compose(stack, experimental));
    })

    it('should work when yielding at the end of the stack with yield*', function() {
      var stack = [];

      stack.push(function *(next){
        yield* next;
      });

      return co(compose(stack, experimental));
    })

    it('should keep the context', function(){
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

      return co.call(ctx, compose(stack, experimental));
    })

    it('should catch downstream errors', function(){
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

      return co(compose(stack, experimental)).then(function(arr){
        arr.should.eql([1, 6, 4, 2, 3]);
      })
    })
  })
})
