var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
const { S3 } = require('aws-sdk');
const redis = require('redis');
var redisScan = require('redisscan');
var async = require("async");
require('dotenv').config();

var allScores = [];
const redisClient = redis.createClient(process.env.redis_port, process.env.redis_addr); // Construct Redis connection.

/* GET */
router.get('/', function(req, res, next) {
    allScores.length = 0;
    return redisScan({ // Use RedisScan to iterate over the Redis DB and get all keys matching a prefix.
        redis: redisClient,
        pattern: req.query.query + '*',
        keys_only: false,
        each_callback: function (type, key, subkey, length, value, cb) {
            allScores.push(value); // Get the value of each key returned and push it to the array of scores.
            cb(); // Run the next callback.
        },
        done_callback: function (err) {
            return res.json(allScores); // After all callbacks are complete, return the array of all scores to the user.
        }
    });
    
    
});

module.exports = router;
