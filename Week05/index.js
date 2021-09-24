const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require( 'yamljs');
const bodyParser = require('body-parser');
const { body } = require('express-validator');
const Joi = require("Joi");
const dataStore = require('./dataStore');
const swaggerDocs = YAML.load('./swagger.yaml');

const app = express();
const PORT = 3002;

const paramSchema = Joi.object({ id: Joi.number().required() });
const transformData = (data) => Object.values(data).map(entry => entry);

app.use(bodyParser.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.get('/students', (req, res) => {
    const transformedData = transformData(dataStore.getData());
    if (transformedData.length === 0) {
        return res.status(404).send({ message: 'No data available' });
    }
    return res.status(200).json({ data: transformData });
});


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

app.delete('/student/:id',
    validateSchema(paramSchema, 'params'),
    (req, res) => {
        const { params: { id } } = req;
        if (dataStore.checkIfExists(id)) {
            return res.status(200).send({ data: transformData(dataStore.removeEntry(id)) });
        }
        return res.status(500).send({ message: `${id} not found` });
    });

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(PORT, () => console.log(`Server started at ${PORT}`));
