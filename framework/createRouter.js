const Router = require('koa-router')
const _ = require('lodash')

const BaseController = require('./controller/baseController')

const camelObjKeys = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(v => camelObjKeys(v))
  }
  if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj)
      .reduce((result, key) => ({
        ...result,
        [_.camelCase(key)]: camelObjKeys(obj[key])
      }), {})
  }
  return obj
}

module.exports = async (context, prefix = '/v1') => {
  const router = new Router()
  router.prefix(prefix)

  const { remoteMethods } = context

  await Object.entries(remoteMethods).reduce(async (promise, [key, value]) => {
    await promise
    const [modelName, handler] = key.split('-')
    router[value.method](
      value.path,
      // eslint-disable-next-line consistent-return
      async (ctx) => {
        ctx.tableName = _.snakeCase(modelName)
        if (BaseController[handler]) {
          const ret = await BaseController[handler](ctx)
          ctx.body = {
            status: 200,
            message: 'success',
            result: camelObjKeys(ret)
          }
          return
        }
        ctx.throw(404, 'not found')
      }
    )
  }, Promise.resolve())
  return router
}
