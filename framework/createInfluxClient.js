const Influx = require('influx')
const path = require('path')
const readDirFilenames = require('read-dir-filenames')

const createSchema = require('./model/schema')

module.exports = (app, config) => {
  const {
    influx = { host: '127.0.0.1', database: 'test' },
    influxModelPath = path.join(process.cwd(), '/models')
  } = config
  // eslint-disable-next-line no-param-reassign
  app.context.jsonSchema = {}
  const schemas = readDirFilenames(influxModelPath).reduce((ret, filepath) => {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const schema = require(filepath)
    const filename = path.basename(filepath).replace(/\.\w+$/, '')
    // eslint-disable-next-line no-param-reassign
    app.context.jsonSchema = {
      ...app.context.jsonSchema,
      [filename]: schema
    }
    return [...ret, createSchema({
      tableName: filename,
      ...schema
    })]
  }, [])
  const influxClient = new Influx.InfluxDB({
    host: influx.host,
    database: influx.database,
    schema: schemas
  })
  // eslint-disable-next-line no-param-reassign
  app.context.influx = influxClient
  influxClient.getDatabaseNames()
    .then((names) => {
      if (names.includes(influx.host)) {
        return
      }
      // eslint-disable-next-line consistent-return
      return influxClient.createDatabase(influx.host)
    })
}
