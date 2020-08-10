const Router = require('koa-router')

const BaseController = require('./controller/baseController')

const router = new Router()

router
  .get('/', (ctx) => {
    ctx.body = 'Hello World'
  })
  .get('/times', async (ctx) => {
    // ctx.body = await ctx.influx.query(`
    //   select * from response_times
    //   where host = ${Influx.escape.stringLit(os.hostname())}
    //   order by time desc
    //   limit 10
    // `)
    ctx.tableName = 'response_times'
    ctx.body = await BaseController.index(ctx)
  })

module.exports = router
