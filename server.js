const Koa = require('koa')
const Influx = require('influx')
const os = require('os')
const bodyParser = require('koa-bodyparser')
const koaLogger = require('koa-logger')
const koaBody = require('koa-body')
const Router = require('koa-router')

const createInfluxClient = require('./framework/createInfluxClient')

const app = new Koa()

const router = new Router()

router
  .get('/', (ctx) => {
    ctx.body = 'Hello World'
  })
  .get('/times', async (ctx) => {
    ctx.body = await ctx.influx.query(`
      select * from response_times
      where host = ${Influx.escape.stringLit(os.hostname())}
      order by time desc
      limit 10
    `)
  })

createInfluxClient(app, {})

app.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start
  try {
    await ctx.influx.writePoints([{
      measurement: 'response_times',
      tags: { host: os.hostname() },
      fields: { duration, path: ctx.path }
    }])
  } catch (err) {
    console.log(err)
  }
})

app
  .use(koaLogger())
  .use(koaBody({}))
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(3000, () => {
  console.log('Listening on port 3000')
})
