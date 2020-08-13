const Koa = require('koa')
const os = require('os')
const bodyParser = require('koa-bodyparser')
const koaLogger = require('koa-logger')
const koaBody = require('koa-body')

const path = require('path')

const bindPropsToContext = require('./bindPropsToContext')
const createInfluxClient = require('./createInfluxClient')
const createRouter = require('./createRouter')

module.exports = async (baseConfig) => {
  const app = new Koa()

  const projectRootPath = process.cwd()
  const config = {
    influx: { host: '127.0.0.1', database: 'test' },
    influxModelPath: path.join(process.cwd(), '/app/models'),
    controllerDirPath: path.join(projectRootPath, '/app/controller'),
    serviceDirPath: path.join(projectRootPath, '/app/service'),
    ...baseConfig
  }

  bindPropsToContext(app, config)
  createInfluxClient(app, config)

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
