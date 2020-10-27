var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
const { S3 } = require('aws-sdk');
const redis = require('redis');
var redisScan = require('redisscan');
var async = require("async");
require('dotenv').config();

var allScores = [];
const redisClient = redis.createClient(process.env.redis_port, process.env.redis_addr);

/* GET */
router.get('/', function(req, res, next) {
    allScores.length = 0;
    return redisScan({
        redis: redisClient,
        pattern: req.query.query + '*',
        keys_only: false,
        each_callback: function (type, key, subkey, length, value, cb) {
            allScores.push(value);
            cb();
        },
        done_callback: function (err) {
            return res.json(allScores);
        }
    });
    
    
});

module.exports = router;
