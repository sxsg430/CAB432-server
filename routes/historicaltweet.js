var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
const { S3 } = require('aws-sdk');
require('dotenv').config();


// Setup AWS S3
AWS.config.getCredentials(function(err) {
  if (err) console.log(err.stack);
  else {
    console.log("Keys found")
  }
})

const bucketName = process.env.bucket;

const bucketPromise = new AWS.S3({apiVersion: '2006-03-01'}).createBucket({Bucket: bucketName}).promise();
bucketPromise.then(function(data) {
  
})
.catch(function(err) {
})

let params = {
    Bucket: bucketName,
};


/* GET */
router.get('/', function(req, res, next) {
    let params = {Bucket: bucketName, Key: req.query.key};
    return new AWS.S3({apiVersion: '2006-03-01'}).getObject(params, (err, result) => {
        if (result) {
            res.json(result.Body.toString('utf-8'));
        } else {
            console.log("Tweet Error");
            return err;
        }
    });
    
    
});

module.exports = router;
