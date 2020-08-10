const _ = require('lodash')

module.exports = class Controller {
  static async index (ctx) {
    return []
  }

  // eslint-disable-next-line consistent-return
  static async create (ctx) {
    const { request: { body }, schema, tableName } = ctx
    try {
      return ctx.influx.writePoints([{
        measurement: tableName,
        tags: _.pick(body, schema.tags || []),
        fields: _.omit(body, schema.tags || [])
      }])
    } catch (err) {
      ctx.throw(400, '数据写入失败')
    }
  }
}
