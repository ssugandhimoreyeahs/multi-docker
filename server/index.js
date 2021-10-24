const Keys = require('./Keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
    user: Keys.pgUser,
    host: Keys.pgHost,
    database: Keys.pgDatabase,
    password: Keys.pgPassword,
    port: Keys.pgPort
});

pgClient.on('error', () => console.log('Lost Pg Connection!'));

pgClient.query(`
    CREATE TABLE IF NOT EXISTS values(number Int)
`).catch(err => console.log('Error while creating table - ', err));

// Redis client setup

const redis = require('redis');
const resisClient = redis.createClient({
    host: Keys.redisHost,
    port: Keys.redisPort,
    retry_strategy : () => 1000
});
const redisPublisher = resisClient.duplicate();

//Express route handlers

app.get('/', (req,res) => {
    res.send('Hi');
});

app.get('/values/all', async (req,res) => {
    const values = await pgClient.query('SELECT * from values');
    res.send(values.rows);
});

app.get('/values/current', async (req,res) => {
    resisClient.hgetall('values', (err,values) => {
        res.send(values);
    });
});

app.post('/values', async (req,res) => {
    const index = req.body.index;

    if (parseInt(index) > 40) {
        return res.status(422).send('Index to high');
    }

    resisClient.hset('values', index, 'Nothing yet!');
    redisPublisher.publish('insert',index);
    pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

    res.send({
        working: true
    })
});

app.listen(5000, () => {
    console.log("Node Server listen at ", 5000);
})