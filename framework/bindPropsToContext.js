const fs = require('fs')

const classLoader = require('./classLoader')

module.exports = (app, config) => {
  const { serviceDirPath, controllerDirPath } = config
  if (fs.existsSync(controllerDirPath)) {
    // eslint-disable-next-line no-param-reassign
    app.context.controller = classLoader(controllerDirPath)
  }
  if (fs.existsSync(serviceDirPath)) {
    // eslint-disable-next-line no-param-reassign
    app.context.service = classLoader(serviceDirPath)
  }
}
