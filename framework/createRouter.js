const Router = require('koa-router')
const _ = require('lodash')
const { Validator } = require('jsonschema')

const BaseController = require('./controller/baseController')

const v = new Validator()

const validate = async apiInfo => async (ctx, next) => {
  if (!apiInfo.requestBody) {
    return next()
  }
  const { body, required = [] } = apiInfo.requestBody
  const validateRets = await v.validate(ctx.request.body, {
    type: 'object', properties: body, required
  })
  if (validateRets.errors.length > 0) {
    const [error] = validateRets.errors
    ctx.throw(400, error.stack)
  }
  return next()
}

const camelObjKeys = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(value => camelObjKeys(value))
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

  const { remoteMethods, jsonSchema } = context

  await Object.entries(remoteMethods).reduce(async (promise, [key, value]) => {
    await promise
    const [modelName, handler] = key.split('-')
    router[value.method](
      value.path,
      await validate(value),
      // eslint-disable-next-line consistent-return
      async (ctx) => {
        ctx.tableName = _.snakeCase(modelName)
        ctx.schema = jsonSchema[modelName]
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
