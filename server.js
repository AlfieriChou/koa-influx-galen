const initializeApp = require('./framework/initializeApp')
const config = require('./config')

const bootstrap = async () => {
  const app = await initializeApp(config)
  app.listen(3000, () => {
    console.log('Listening on port 3000')
  })
}

bootstrap()
