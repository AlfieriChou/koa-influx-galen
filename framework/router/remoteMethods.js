const buildBaseRemoteMethods = (schema) => {
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
        order: { type: 'array', description: '排序 例如：order=time desc' },
        offset: { type: 'integer', description: '分页偏移量 例如：offset=0' },
        limit: { type: 'integer', description: '分页数量 例如：limit=20' }
      },
      output: {
        200: {
          type: 'object',
          result: {
            code: { type: 'integer', description: '返回编码' },
            message: { type: 'string', description: '返回描述' },
            result: { type: 'array', items: { type: 'object', properties }, description: '返回数据' }
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
          result: {
            code: { type: 'integer', description: '返回编码' },
            message: { type: 'string', description: '返回描述' },
            result: { type: 'object', properties, description: '返回数据' }
          }
        }
      }
    }
  }
}

module.exports = (schema) => {
  const { remoteMethods } = schema
  const baseRemoteMethods = buildBaseRemoteMethods(schema)
  return {
    ...baseRemoteMethods,
    ...Object.entries(remoteMethods).reduce((acc, [key, value]) => {
      if (baseRemoteMethods[key]) {
        return {
          ...acc,
          [key]: {
            ...baseRemoteMethods[key],
            ...value
          }
        }
      }
      return {
        ...acc,
        [key]: value
      }
    }, {})
  }
}
