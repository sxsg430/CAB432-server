require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const redis = require('redis');
const router = express.Router();
const Twitter = require('twitter');
const Sentiment = require('natural').SentimentAnalyzer;
const stemmer = require('natural').PorterStemmer;
const analyzer = new Sentiment("English", stemmer, 'afinn');
const natural = require("natural");
const AWS = require('aws-sdk');
const { json } = require('express');
const tokenizer = new natural.WordTokenizer();


const client = new Twitter({
  consumer_key: process.env.api_key,
  consumer_secret: process.env.api_secret_key,
  access_token_key: process.env.access_token,
  access_token_secret: process.env.access_token_secret
});

// Create unique bucket name
const bucketName = 'tweets-store-n9940669';
// This section will change for Cloud Services
const redisClient = redis.createClient();
redisClient.on('error', (err) => {
    console.log("Error " + err);ß
});

// Create a promise on S3 service object
const bucketPromise = new AWS.S3({ apiVersion: '2006-03-01' })
    .createBucket({ Bucket: bucketName })
    .promise();
bucketPromise.then(function (data) {
    console.log("Successfully created " + bucketName);
}).catch(function (err) {
    console.error(err, err.stack);
});



/* GET */

router.get('/:query/:number', function (req, res, next) {
  const query = req.params.query;
  var i = 1;
  var total = 0;
  var array = [];

 var s3Params = {
  Bucket: bucketName, 
  Prefix: query
 };
 var s3 = new AWS.S3();
 s3.listObjectsV2(s3Params, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else  {

    var content = data.Contents;
    content.forEach(object =>{
      const download = new AWS.S3({ apiVersion: '2006-03-01' }).getObject({ Bucket: bucketName, Key: object.Key }).promise();
      download.then(function (rslt) {
      
          var result = JSON.parse(rslt.Body);
          var redisKey = `${query}:${result.id}`; 
          redisClient.set(redisKey,result.score);
          array.push(result);
          i++;
          total+= result.score;
      });
    });    
  }  // console.log(data);           // successful response


 });
  client.get('search/tweets', { q: query, count: req.params.number, lang: 'en' }, function (error, tweets, response) {
 
    tweets.statuses.forEach(status => {
      var sent = analyzer.getSentiment(tokenizer.tokenize(status.text));
      if (Number.isNaN(sent)) {
        sent = 0;
      }
 
      var tweet = { id: status.id, text: status.text, score: sent };
 
      storeTweet(query,tweet)
  
      array.push(tweet);
      i++;
    
      total += sent;
      console.log(sent);
    });

    var totalScore = total / i;
    var sentiment = "";
    console.log(total)
    console.log(i)
    console.log(totalScore)
    if (totalScore < 0) {
      sentiment = "Negative";
    } else {
      sentiment = "Possitive";
    }

    res.json({ array, totalScore, sentiment });
  });
});


function storeTweet(query,tweet){

  const redisKey = `${query}:${tweet.id}`; 
  const s3Key = `${query}-${tweet.id}`;

  const objectParams = { Bucket: bucketName, Key: s3Key, Body: JSON.stringify(tweet)};

  const uploadPromise = new AWS.S3({ apiVersion: '2006-03-01' }).putObject(objectParams).promise();
  uploadPromise.then(function (data) {
      console.log("Successfully uploaded data to " + bucketName + "/" + s3Key);
      redisClient.set(redisKey,tweet.score);
  });
  
  return;
}
module.exports = router;
