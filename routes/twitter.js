var express = require('express');
var router = express.Router();
var Twitter = require('twitter');
const Sentiment = require('natural').SentimentAnalyzer;
const stemmer = require('natural').PorterStemmer;
const analyzer = new Sentiment("English",stemmer,'afinn');
const natural = require("natural");
const tokenizer = new natural.WordTokenizer();
require('dotenv').config();
var AWS = require('aws-sdk');


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




/* GET */
router.get('/', function(req, res, next) {
    var client = new Twitter({
        consumer_key: process.env.api_key,
        consumer_secret: process.env.api_secret_key,
        access_token_key: process.env.access_token,
        access_token_secret: process.env.access_token_secret
      });
      client.get('search/tweets', { q: req.query.query ,count: 100,lang:  'en' }, function (error, tweets, response) {
        //console.log(tweets);
        var str = ""
        var i = 1;
        var total = 0;
        var array= [];
        tweets.statuses.forEach(status => {
          var sent = analyzer.getSentiment(tokenizer.tokenize(status.text));
          let response = {id: status.id,
                          date: status.created_at,
                          text: status.text,
                          score: sent}
          array.push(response);
          const s3Key = req.query.query + "-" + status.id;
          const objectParams = {Bucket: bucketName, Key: s3Key, Body: JSON.stringify(response)};
          const uploadPromise = new AWS.S3({apiVersion: '2006-03-01'}).putObject(objectParams).promise();
          uploadPromise.then(function(data) {
            console.log('Successfully uploaded data to ' + bucketName + '/' + s3Key);
          })
          .catch(function(error) {
            console.log(error)
          })
          i++;
          if(Number.isNaN(sent)){
            sent = 0;
          }
          total += sent;
        });
        
        var totalScore = total/i;
        var sentiment ="";
        //console.log(total)
        //console.log(i)
        //console.log(totalScore)
        if(totalScore<0){
          sentiment = "Negative";
        }else {
          sentiment = "Positive";
        }
        res.json({ array,totalScore,sentiment });
      });
});

module.exports = router;
