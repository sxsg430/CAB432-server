var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
const { S3 } = require('aws-sdk');
var async = require("async");
require('dotenv').config();
const asyncHandler = require('express-async-handler')


// Setup AWS S3
AWS.config.getCredentials(function(err) {
  if (err) console.log(err.stack);
  else {
    console.log("Keys found")
  }
})

// Init the S3 bucket
const bucketName = process.env.bucket;

const bucketPromise = new AWS.S3({apiVersion: '2006-03-01'}).createBucket({Bucket: bucketName}).promise();
bucketPromise.then(function(data) {
  
})
.catch(function(err) {
})

// Params for requesting all keys from the bucket.
let params = {
    Bucket: bucketName,
};

var allKeys = [];
var querykey = "";

// Function to filter key objects. If the key of an object starts with the provided query, return it.
function filterKey(key) {
    return key.Key.startsWith(querykey);
}


/* GET */
router.get('/', async (req, res, next) => {
    allKeys.length = 0;
    querykey = req.query.query;
    new AWS.S3({apiVersion: '2006-03-01'}).listObjectsV2(params, function (err, data) { // Get all keys from S3
        if (err) {
            console.log(err)
        } else {
            var contents = data.Contents;
            contents = contents.filter(filterKey) // Run the contents of each object through the filter function, returning those that match the given query.
            var localArr = [];
            contents.forEach(async (element) => { // For each returned object, get the tweet contained inside.
                    let Lparams = { // Construct S3 params.
                        Bucket: bucketName,
                        Key: element.Key
                    };
                    var s3b = await new AWS.S3({apiVersion: '2006-03-01'}).getObject(Lparams); // Start await getting the objects from S3, then create a Promise.
                    var s3p = s3b.promise();
    
                    await s3p.then(
                        function(data) {
                            allKeys.push(data.Body.toString('utf-8')); // Push the UTF-8 String of the Object body (originally stored in Bytes) to the main array.
                        },
                        function(error) {
                            console.log(error);
                        }
                    )
                    if (allKeys.length === contents.length) {
                        return res.send(allKeys); // If the object body array is the same length as the object array, return the body array.
                    }
                
                
            })
        }
        

    });
});

module.exports = router;
