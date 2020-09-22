const Influx = require('influx')
const path = require('path')
const readDirFilenames = require('read-dir-filenames')
const _ = require('lodash')
const fs = require('fs')
const yaml = require('js-yaml')

const createSchema = require('./model/schema')
const buildRemoteMethods = require('./router/remoteMethods')

module.exports = async (app, { influx, influxModelPath }) => {
  const ctx = app.context
  // eslint-disable-next-line no-param-reassign
  ctx.jsonSchema = {}
  ctx.remoteMethods = {}
  ctx.schemas = {}
  const schemas = readDirFilenames(influxModelPath).reduce((ret, filepath) => {
    let schema
    if (filepath.endsWith('.json')) {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      schema = require(filepath)
    }
    if (filepath.endsWith('.yaml')) {
      try {
        schema = yaml.safeLoad(fs.readFileSync(filepath, 'utf8'))
      } catch (err) {
        throw new Error(`${filepath.split('/').slice(-1)[0]} load yaml file error`)
      }
    }
    const filename = path.basename(filepath).replace(/\.\w+$/, '')

    const requiredFields = Object.entries(schema.properties).reduce((acc, [key, prop]) => {
      if (prop.required) {
        return [...acc, key]
      }
      return acc
    }, [])

    const remoteMethods = buildRemoteMethods({
      remoteMethods: {},
      ...schema,
      modelName: filename,
      required: requiredFields
    })

    ctx.remoteMethods = {
      ...ctx.remoteMethods,
      ...Object.entries(remoteMethods).reduce((acc, [key, value]) => ({
        ...acc,
        [`${filename}-${key}`]: value
      }), {})
    }

    // eslint-disable-next-line no-param-reassign
    ctx.jsonSchema = {
      ...ctx.jsonSchema,
      [filename]: {
        ...schema,
        remoteMethods
      }
    }

    ctx.schemas = {
      ...ctx.schemas,
      [filename]: {
        type: 'object', properties: schema.properties || {}
      }
    }

    return [...ret, createSchema({
      tableName: _.snakeCase(filename),
      ...schema
    })]
  }, [])
  const influxClient = new Influx.InfluxDB({
    host: influx.host,
    database: influx.database,
    schema: schemas
  })
  // eslint-disable-next-line no-param-reassign
  ctx.influx = influxClient
  const dbNames = await influxClient.getDatabaseNames()
  if (!dbNames.includes(influx.database)) {
    await influxClient.createDatabase(influx.database)
  }
}
