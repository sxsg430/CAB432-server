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

const bucketName = process.env.bucket;

const bucketPromise = new AWS.S3({apiVersion: '2006-03-01'}).createBucket({Bucket: bucketName}).promise();
bucketPromise.then(function(data) {
  
})
.catch(function(err) {
})

let params = {
    Bucket: bucketName,
};

var allKeys = [];
var querykey = "";
function filterKey(key) {
    return key.Key.startsWith(querykey);
}


/* GET */
router.get('/', async (req, res, next) => {
    allKeys.length = 0;
    querykey = req.query.query;
    new AWS.S3({apiVersion: '2006-03-01'}).listObjectsV2(params, function (err, data) {
        if (err) {
            console.log(err)
        } else {
            var contents = data.Contents;
            contents = contents.filter(filterKey)
            var localArr = [];
            contents.forEach(async (element) => {
                    let Lparams = {
                        Bucket: bucketName,
                        Key: element.Key
                    };
                    var s3b = await new AWS.S3({apiVersion: '2006-03-01'}).getObject(Lparams);
                    var s3p = s3b.promise();
    
                    await s3p.then(
                        function(data) {
                            console.log(data)
                            allKeys.push(data.Body.toString('utf-8'));
                        },
                        function(error) {
                            console.log(error);
                        }
                    )
                    if (allKeys.length === contents.length) {
                        return res.send(allKeys);
                    }
                
                
            })
        }
        

    });
});

module.exports = router;
