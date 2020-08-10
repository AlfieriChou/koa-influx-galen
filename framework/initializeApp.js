const Koa = require('koa')
const os = require('os')
const bodyParser = require('koa-bodyparser')
const koaLogger = require('koa-logger')
const koaBody = require('koa-body')

const createInfluxClient = require('./createInfluxClient')
const createRouter = require('./createRouter')

module.exports = async (config) => {
  const app = new Koa()

  createInfluxClient(app, config || {})

  const router = await createRouter(app.context)
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
    await next()
    const duration = Date.now() - start
    try {
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

  app
    .use(koaLogger())
    .use(koaBody({}))
    .use(bodyParser())
    .use(router.routes())
    .use(router.allowedMethods())

  return app
}
