const _ = require('lodash')

const parseFilter = (tableName, filter) => {
  const {
    where, order, limit, offset
  } = filter
  let query = `select * from ${tableName}`
  if (Object.keys(where).length > 0) {
    Object.entries(where).forEach(([key, value]) => {
      query += ` where ${key} = '${value}'`
    })
  }
  if (order) {
    query += ` order by ${order}`
  }
  if (offset) {
    query += ` offset ${offset}`
  }
  if (limit) {
    query += ` limit ${limit}`
  }
  return query
}

module.exports = class Controller {
  static async index (ctx) {
    const filter = ctx.query.filter ? JSON.parse(ctx.query.filter) : {
      where: {}, order: 'id desc', limit: 100, offset: 0
    }
    return ctx.influx.query(parseFilter(ctx.tableName, filter))
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
