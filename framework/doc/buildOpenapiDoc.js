const _ = require('lodash')
const assert = require('assert')

module.exports = async (schemas, remoteMethods, info) => {
  const methods = await Object.entries(remoteMethods)
    .reduce(async (promise, [schemaKey, {
      path, method, tags, summary, query, params, requestBody, output
    }]) => {
      assert(path, `${schemaKey} path is required`)
      assert(method, `${schemaKey} method is required`)
      const methodRet = await promise
      const content = {
        tags: tags || ['default'],
        summary: summary || ''
      }
      if (query || params) {
        content.parameters = Object.entries(query || params)
          .reduce((ret, [propKey, propValue]) => (
            [...ret, {
              name: propKey,
              in: query ? 'query' : 'path',
              description: propValue.description,
              schema: {
                type: propValue.type
              },
              required: !query
            }]
          ), [])
      }
      if (requestBody) {
        content.requestBody = {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: requestBody.body,
                required: requestBody.required
              }
            }
          }
        }
      }
      if (output) {
        content.responses = await Object.entries(output)
          .reduce((outputRets, [responseKey, result]) => {
            const baseResponses = {
              200: {
                description: 'response success',
                content: {
                  'application/json': {
                    schema: { $ref: `#/components/schemas/${schemaKey.split('-')[0]}` }
                  }
                }
              }
            }
            return {
              ...outputRets,
              ...baseResponses,
              [responseKey]: {
                description: 'response success',
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: result || {} }
                  }
                }
              }
            }
          }, {})
      }
      return [
        ...methodRet,
        {
          [path]: {
            [method]: content
          }
        }
      ]
    }, Promise.resolve([]))
  return {
    openapi: '3.0.0',
    info,
    paths: methods.reduce((acc, method) => _.merge(acc, method), {}),
    components: {
      schemas
    }
  }
}
