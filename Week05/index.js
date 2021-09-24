const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('swagger-jsdoc');
const dataStore = require('./dataStore');
const bodyParser = require('body-parser');
const PORT = 3002;
const Joi = require("Joi");
const { body, validationResult, param } = require('express-validator');
const YAML = require( 'yamljs');
app.use(bodyParser.json());
const options = {
    swaggerDefinition: {
        info: {
            title: 'College API',
            description: "Student API Information",
            version: '1.0.0',
            servers: [`http://localhost:${PORT}`]
        },
        components: {
            schemas: {
                User:
                {
                    type: 'object',
                    properties:
                    {
                        id: {
                            type: 'integer',
                            description: 'The user ID.'
                        },
                        username:
                        {
                            type: 'string',
                            description: 'The user name.'
                        }
                    }
                }
            }
        },
    },
    apis: ['index.js'], // files containing annotations as above
};

// const swaggerDocs = swaggerDocument(options);

const swaggerDocs = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));



/**
 * @swagger
 * /students:
 *   get:
 *     description: get all students
 *     responses:
 *       200:
 *         description: Returns a list of student records
 *         content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 */
app.get('/students', (req, res) => {
    const transformedData = transformData(dataStore.getData());
    if (transformedData.length === 0) {
        return res.status(404).send({ message: 'No data available' });
    }
    return res.status(200).json({ data: transformData });
});

const transformData = (data) => Object.values(data).map(entry => entry);

const schema = Joi.object({
    id: Joi.number().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    deptName: Joi.string().required(),
    email: Joi.string().required(),
    admitted: Joi.boolean().required(),
    age: Joi.number().required()
});

const validateSchema = (schema, property) => (req, res, next) => {
    const { error } = schema.validate(req[property]);
    if (error) {
        return res.status(400).send({ error: error.message });
    }
    next();
}

/**
 * @swagger
 * /students:
 *   post:
 *     description: add a new student entry
 *     responses:
 *       200:
 *         description: Returns updated store.
 */
app.post('/student',
    validateSchema(schema, 'body'),
    body('email').isEmail().normalizeEmail(),
    body('id').trim().escape(),
    body('firstName').trim().escape(),
    body('lastName').trim().escape(),
    body('deptName').trim().escape(),
    body('age').isNumeric(),
    body('admitted').toBoolean(),
    (req, res) => {
        const { body } = req;
        if (dataStore.checkIfExists(body.id)) {
            return res.status(500).send({ message: "Id already exists" });
        }
        const data = dataStore.addEntry(body.id, body);
        return res.status(201).send({ data: transformData(data) });
    });
const paramSchema = Joi.object({ id: Joi.number().required() });
/**
 * @swagger
 * /students:
 *   patch:
 *     description: updates student entry
 *     responses:
 *       200:
 *         description: Returns updated store.
 */
app.patch('/student/:id',
    validateSchema(paramSchema, 'params'),
    validateSchema(schema, 'body'),
    (req, res) => {
        const { body, params: { id } } = req;
        try {
            const data = dataStore.updateEntry(id, body);
            return res.status(200).send({ data: transformData(data) });
        } catch (e) {
            res.status(500).send({ message: `${id} not found` });
        }
    });

/**
 * @swagger
 * /students:
 *   put:
 *     description: updates if entry is present else creates record.
 *     responses:
 *       200:
 *         description: Returns updated store.
 */
app.put('/student/:id',
    validateSchema(paramSchema, 'params'),
    validateSchema(schema, 'body'),
    (req, res) => {
        const { body, params: { id } } = req;
        if (dataStore.checkIfExists(id)) {
            const data = dataStore.updateEntry(id, body);
            return res.status(200).send({ data: transformData(data) });
        } else {
            const data = dataStore.addEntry(id, body);
            return res.status(201).send({ data: transformData(data) });
        }
    });

/**
 * @swagger
 * /students:
 *   delete:
 *     description: delete student record
 *     responses:
 *       200:
 *         description: Returns a mysterious string.
 */
app.delete('/student/:id',
    validateSchema(paramSchema, 'params'),
    (req, res) => {
        const { params: { id } } = req;
        if (dataStore.checkIfExists(id)) {
            return res.status(200).send({ data: transformData(dataStore.removeEntry(id)) });
        }
        return res.status(500).send({ message: `${id} not found` });
    });

/**
 * @swagger
 * /health:
 *   get:
 *     description: health check
 *     responses:
 *       200:
 *         description: Returns a mysterious string.
 */
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(PORT, () => console.log(`Server started at ${PORT}`));
