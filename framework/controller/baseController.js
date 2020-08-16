const _ = require('lodash')

const parseFilter = ({
  tableName, filter, properties, tags
}) => {
  const {
    where, order, limit, offset
  } = filter
  let query = `select * from ${tableName}`
  if (Object.keys(where).length > 0) {
    Object.entries(where).forEach(([key, value]) => {
      if (!properties[key] || !properties[key].type || !tags.includes(key)) {
        throw new Error(`${key} is not a valid property`)
      }
      if (properties[key].type === 'string') {
        query += ` where ${key} = '${value}'`
      } else {
        query += ` where ${key} = ${value}`
      }
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
    const { query: { filter }, schema, tableName } = ctx
    return ctx.influx.query(parseFilter({
      tableName,
      filter: filter ? JSON.parse(filter) : {
        where: {}, order: 'time desc', limit: 100, offset: 0
      },
      ...schema
    }))
  }

  // eslint-disable-next-line consistent-return
  static async create (ctx) {
    const { request: { body }, schema, tableName } = ctx
    try {
      await ctx.influx.writePoints([{
        measurement: tableName,
        tags: _.pick(body, schema.tags || []),
        fields: _.omit(body, schema.tags || [])
      }])
      return { success: true }
    } catch (err) {
      ctx.throw(400, '数据写入失败')
    }
  }
}
