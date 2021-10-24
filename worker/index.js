const keys = require('./Keys');
const redis = require('redis');

const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});

const redisClientSub = redisClient.duplicate();

function fib(index) {
    if (index < 2) {
        return 1;
    }
    return fib(index - 1) + fig(index -2);
}

redisClientSub.on('message', (channel, message) => {
    redisClient.hset('values', message, fib(parseInt(message)));
});

redisClientSub.subscribe('insert');