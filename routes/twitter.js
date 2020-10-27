require('dotenv').config();
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

// Setup AWS S3
AWS.config.getCredentials(function(err) {
  if (err) console.log(err.stack);
  else {
    console.log("Keys found")
  }
})

const redisClient = redis.createClient(process.env.redis_port, process.env.redis_addr);
redisClient.on('error', (err) => {
    console.log("Error " + err);
});

const bucketName = process.env.bucket;

const bucketPromise = new AWS.S3({apiVersion: '2006-03-01'}).createBucket({Bucket: bucketName}).promise();
bucketPromise.then(function(data) {
  
})
.catch(function(err) {
})



/* GET */
router.get('/', function(req, res, next) {
    var client = new Twitter({
        consumer_key: process.env.api_key,
        consumer_secret: process.env.api_secret_key,
        access_token_key: process.env.access_token,
        access_token_secret: process.env.access_token_secret
      });
      client.get('search/tweets', { q: req.query.query ,count: 100,lang:  'en' }, function (error, tweets, response) {
        var i = 1;
        var total = 0;
        var array= [];

        tweets.statuses.forEach(status => {
          var sent = analyzer.getSentiment(tokenizer.tokenize(status.text));
          if(Number.isNaN(sent)){
            sent = 0;
          }

          let response = {id: status.id,
                          date: status.created_at,
                          text: status.text,
                          score: sent}
          array.push(response);
          
          const s3Key = req.query.query + "-" + status.id;
          redisClient.set(s3Key,response.score);
        
          const objectParams = {Bucket: bucketName, Key: s3Key, Body: JSON.stringify(response)};

          const uploadPromise = new AWS.S3({apiVersion: '2006-03-01'}).putObject(objectParams).promise();
          uploadPromise.then(function(data) {
            console.log('Successfully uploaded data to ' + bucketName + '/' + s3Key);
          })
          .catch(function(error) {
            console.log(error)
          })
          i++;
          total += sent;

        });
        
        var totalScore = total/i;
        var sentiment ="";
        if(totalScore<0){
          sentiment = "Negative";
        }else {
          sentiment = "Positive";
        }
        res.json({ array,totalScore,sentiment });
      });
    });    
module.exports = router;
