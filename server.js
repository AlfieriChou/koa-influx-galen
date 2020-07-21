const Koa = require('koa')
const Influx = require('influx')
const os = require('os')
const bodyParser = require('koa-bodyparser')
const koaLogger = require('koa-logger')
const koaBody = require('koa-body')

const app = new Koa()

const influx = new Influx.InfluxDB({
  host: 'localhost',
  database: 'express_response_db',
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

app.use((ctx) => {
  ctx.body = 'Hello Koa'
})

app.use(bodyParser())

influx.getDatabaseNames()
  .then((names) => {
    if (names.includes('express_response_db')) {
      return
    }
    // eslint-disable-next-line consistent-return
    return influx.createDatabase('express_response_db')
  })
  .then(() => {
    app.listen(3000, () => {
      console.log('Listening on port 3000')
    })
  })
  .catch((err) => {
    console.error(`Error creating Influx database!`, err)
  })
