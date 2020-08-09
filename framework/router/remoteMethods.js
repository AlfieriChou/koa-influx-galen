module.exports = (schema) => {
  const {
    modelName, properties, description = modelName, required = []
  } = schema
  return {
    index: {
      path: `/${modelName}`,
      method: 'get',
      tags: [`${modelName}`],
      summary: `获取${description}列表`,
      query: {
        where: { type: 'json', description: '搜索条件 例如：where={}' },
        order: { type: 'array', description: '排序 例如：order=[["createdAt","desc"]]' },
        attribute: { type: 'array', description: '返回字段控制 例如：attribute=["id"]' },
        include: { type: 'array', description: '关联表 关联查询 例如：include=[{"model":"UserRole"}]' },
        offset: { type: 'integer', description: '分页偏移量 例如：offset=0' },
        limit: { type: 'integer', description: '分页数量 例如：limit=20' }
      },
      output: {
        200: {
          type: 'object',
          result: {
            count: { type: 'integer', description: '总数' },
            offset: { type: 'integer', description: '偏移量' },
            limit: { type: 'integer', description: '限制数量' },
            data: { type: 'array', items: { type: 'object', properties }, description: '数据' }
          }
        }
      }
    },
    create: {
      path: `/${modelName}`,
      method: 'post',
      tags: [`${modelName}`],
      summary: `创建${description}`,
      requestBody: {
        body: properties,
        required
      },
      output: {
        200: {
          type: 'object',
          result: properties
        }
      }
    }
  }
}
