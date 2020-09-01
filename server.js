const os = require('os')
const koaLogger = require('koa-logger')

const initializeApp = require('./framework/initializeApp')
const config = require('./config')

const exitTimeout = 60 * 1000

const bootstrap = async () => {
  const app = await initializeApp(config)
  app.use(async (ctx, next) => {
    const start = Date.now()
    if (ctx.request.method === 'OPTIONS') {
      ctx.response.status = 200
    }
    ctx.set('Access-Control-Allow-Origin', ctx.request.header.origin)
    ctx.set('Access-Control-Allow-Credentials', true)
    ctx.set('Access-Control-Max-Age', 86400000)
    ctx.set('Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, POST, DELETE')
    ctx.set('Access-Control-Allow-Headers', 'x-requested-with, accept, origin, content-type')
    try {
      await next()
      const duration = Date.now() - start
      await ctx.influx.writePoints([{
        measurement: 'response_times',
        tags: { host: os.hostname() },
        fields: { duration, path: ctx.path }
      }])
    } catch (err) {
      ctx.status = err.status || 500
      ctx.body = {
        code: ctx.status,
        message: err.message,
        stack: err.stack
      }
    }
  })
  app.use(koaLogger())
  await app.coreMiddleware.reduce(async (promise, key) => {
    await promise
    const middleware = app.coreMiddlewareObj[key]
    if (Array.isArray(middleware)) {
      app.use(...middleware)
    } else {
      app.use(middleware)
    }
  }, Promise.resolve())
  const server = app.listen(3000, () => {
    console.log('Listening on port 3000')
  })
  process.on('SIGINT', () => {
    server.close(async () => {
      process.exit(0)
    })
    setTimeout(() => {
      process.exit(0)
    }, exitTimeout)
  })
  process.on('SIGTERM', () => {
    server.close(async () => {
      process.exit(0)
    })
    setTimeout(() => {
      process.exit(0)
    }, exitTimeout)
  })
}

bootstrap()
