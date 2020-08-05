const migrateField = require('./field')

module.exports = (jsonSchema) => {
  const { tags = ['host'], properties = {}, tableName } = jsonSchema
  return {
    measurement: tableName,
    fields: migrateField(properties),
    tags
  }
}
