import express from 'express'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'

const router = express.Router();
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Nodeseeker',
            version: '1.0.0',
        },
        paths: {
            "/getNAV/{schemeCode}": {
                "get": {
                    "tags": [
                        "NAV Controller"
                    ],
                    "summary": "Fetch the latest NAV data from AMFI website.",
                    "operationId": "getScheme",
                    "parameters": [
                        {
                            "name": "schemeCode",
                            "in": "path",
                            "description": "scheme code for mutual fund",
                            "required": true,
                            "schema": {
                                "type": "string"
                            },
                            "example": 120503
                        },
                        {
                            "name": "force_update",
                            "in": "query",
                            "description": "force update NAV cache?",
                            "required": false,
                            "schema": {
                                "type": "boolean",
                                "default": false
                            },
                            "example": false
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "OK",
                        }
                    }
                }
            }
        }
    },
    apis: ['server.js'],
};

const openapiSpecification = await swaggerJsdoc(options);
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(openapiSpecification));

export default router