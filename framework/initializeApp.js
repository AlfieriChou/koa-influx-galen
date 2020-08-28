const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
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
  await createInfluxClient(app, config)

  const router = await createRouter(app.context)

  app.coreMiddleware = ['koaBody', 'bodyParser', 'router']
  app.coreMiddlewareObj = {
    koaBody: koaBody({}),
    bodyParser: bodyParser(),
    router: [router.routes(), router.allowedMethods()]
  }

  return app
}
