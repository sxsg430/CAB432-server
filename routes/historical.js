var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
const { S3 } = require('aws-sdk');
var async = require("async");


// Setup AWS S3
AWS.config.getCredentials(function(err) {
  if (err) console.log(err.stack);
  else {
    console.log("Keys found")
  }
})

const bucketName = 'n10225978-twitter';

const bucketPromise = new AWS.S3({apiVersion: '2006-03-01'}).createBucket({Bucket: bucketName}).promise();
bucketPromise.then(function(data) {
  
})
.catch(function(err) {
})

let params = {
    Bucket: bucketName,
};

var allKeys = [];



/* GET */
router.get('/', function(req, res, next) {
    allKeys.length = 0;
    return new AWS.S3({apiVersion: '2006-03-01'}).listObjectsV2(params, function (err, data) {
        if (err) {
            console.log(err)
        } else {
            var contents = data.Contents;
            contents.forEach(function(content) {
                if (content.Key.startsWith(req.query.query + "-")) {
                    allKeys.push(content.Key);
                }
            });
            const uniqueAllKeys = Array.from(new Set(allKeys));
            return res.json(uniqueAllKeys);
            // NOTE: Only returns the first 1000 results. API limitation without recursion.

        }

    });
    
});

module.exports = router;
