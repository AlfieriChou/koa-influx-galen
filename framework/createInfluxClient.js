const Influx = require('influx')
const path = require('path')
const readDirFilenames = require('read-dir-filenames')
const _ = require('lodash')

const createSchema = require('./model/schema')
const buidlRemoteMethods = require('./router/remoteMethods')

module.exports = (app, config) => {
  const {
    influx = { host: '127.0.0.1', database: 'test' },
    influxModelPath = path.join(process.cwd(), '/models')
  } = config
  const ctx = app.context
  // eslint-disable-next-line no-param-reassign
  ctx.jsonSchema = {}
  ctx.remoteMethods = {}
  const schemas = readDirFilenames(influxModelPath).reduce((ret, filepath) => {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const schema = require(filepath)
    const filename = path.basename(filepath).replace(/\.\w+$/, '')

    const remoteMethods = buidlRemoteMethods({
      remoteMethods: {},
      ...schema,
      modelName: filename,
      required: Object.entries(schema.properties).reduce((acc, [key, prop]) => {
        if (prop.required) {
          return [...acc, key]
        }
        return acc
      }, [])
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
  influxClient.getDatabaseNames()
    .then((names) => {
      if (names.includes(influx.database)) {
        return
      }
      // eslint-disable-next-line consistent-return
      return influxClient.createDatabase(influx.database)
    })
}
