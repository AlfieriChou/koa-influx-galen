const Koa = require('koa')
const Influx = require('influx')
const os = require('os')
const bodyParser = require('koa-bodyparser')
const koaLogger = require('koa-logger')
const koaBody = require('koa-body')
const Router = require('koa-router')

const app = new Koa()

const router = new Router()

router
  .get('/', (ctx) => {
    ctx.body = 'Hello World'
  })
  .get('/times', async (ctx) => {
    ctx.body = await influx.query(`
      select * from response_times
      where host = ${Influx.escape.stringLit(os.hostname())}
      order by time desc
      limit 10
    `)
  })

const influx = new Influx.InfluxDB({
  host: 'localhost',
  database: 'koa-test',
  schema: [
    {
      measurement: 'response_times',
      fields: {
        path: Influx.FieldType.STRING,
        duration: Influx.FieldType.INTEGER
      },
      tags: [
        'host'
      ]
    }
  ]
})

app.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start
  try {
    await influx.writePoints([{
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

influx.getDatabaseNames()
  .then((names) => {
    if (names.includes('koa-test')) {
      return
    }
    // eslint-disable-next-line consistent-return
    return influx.createDatabase('koa-test')
  })
  .then(() => {
    app.listen(3000, () => {
      console.log('Listening on port 3000')
    })
  })
  .catch((err) => {
    console.error(`Error creating Influx database!`, err)
  })
