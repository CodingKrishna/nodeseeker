import express from 'express'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import apiSpec from './openapiSpec.js'

const router = express.Router();
const options = apiSpec

const openapiSpecification = await swaggerJsdoc(options);
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(openapiSpecification));

export default router