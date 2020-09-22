const {
  PORT,
  INFLUX_HOST,
  INFLUX_DB
} = process.env

module.exports = {
  influx: {
    host: INFLUX_HOST || '127.0.0.1',
    database: INFLUX_DB || 'test'
  },
  port: PORT || 4000
}
