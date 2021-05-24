import express from 'express'
import swaggerRouter from './src/config/swagger.js'
import graphql from './src/controller/gqlController.js'
import navrouter from './src/controller/navController.js'
import expressPlayground from 'graphql-playground-middleware-express'
const app = express()

app.use('/', swaggerRouter)
app.use('/rest', navrouter)
app.use('/graphql', graphql)
app.get('/playground', expressPlayground.default({ endpoint: '/graphql' }))


app.listen(process.env.PORT || 5000, () => { console.log('Nodeseeker GO!') })
