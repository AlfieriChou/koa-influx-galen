const path = require('path')
const readDirFilenames = require('read-dir-filenames')

module.exports = (dirPath) => {
  const dirFiles = readDirFilenames(dirPath, { ignore: 'index.js' })
  return dirFiles.reduce((ret, dirFile) => ({
    ...ret,
    // eslint-disable-next-line import/no-dynamic-require, global-require
    [path.basename(dirFile).replace(/\.\w+$/, '')]: require(dirFile).prototype
  }), {})
}
