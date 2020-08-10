const initializeApp = require('./framework/initializeApp')

const bootstrap = () => {
  const app = initializeApp({})
  app.listen(3000, () => {
    console.log('Listening on port 3000')
  })
}

bootstrap()
