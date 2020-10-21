var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
const { S3 } = require('aws-sdk');


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
  console.log(err);
})

let params = {
    Bucket: bucketName,
};

var allKeys = [];

async function getAllKeys() {
    await new AWS.S3({apiVersion: '2006-03-01'}).listObjectsV2(params, function (err, data) {
        if (err) {
            console.log(err)
        } else {
            var contents = data.Contents;
            contents.forEach(function(content) {
                allKeys.push(content.Key);
            });

            if (data.IsTruncated) {
                params.ContinuationToken = data.NextContinuationToken;
                getAllKeys();
            }
        }
    }).promise()
    .then(function(data) {
      })
      .catch(function(error) {
      })
}


/* GET */
router.get('/', function(req, res, next) {
    getAllKeys();
    res.json(allKeys);
    
    
});

module.exports = router;
