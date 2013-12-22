
# koa-compose [![Build Status](https://travis-ci.org/koajs/compose.png)](https://travis-ci.org/koajs/compose)

 Compose middleware.

## API

### compose([a, b, c, ...])

  Compose the given middleware and return middleware.

## Debugging

  To debug the interactions between middleware, you may use
  the __DEBUG__ environment variable, for example:

```
$ DEBUG=koa-compose node --harmony app.js
```

  When enabled this will output verbose response information and the
  middleware names to help visualize how they interact.

  ![koa middleware debugging](https://dl.dropboxusercontent.com/u/6396913/koa/Screen%20Shot%202013-12-22%20at%208.46.46%20AM.png)

## License

  MIT