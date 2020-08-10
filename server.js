const app = require('./framework/initializeApp')

const bootstrap = () => {
  app.listen(3000, () => {
    console.log('Listening on port 3000')
  })
}

bootstrap()
