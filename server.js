const initializeApp = require('./framework/initializeApp')

const bootstrap = async () => {
  const app = await initializeApp({})
  app.listen(3000, () => {
    console.log('Listening on port 3000')
  })
}

bootstrap()
