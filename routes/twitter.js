var express = require('express');
var router = express.Router();
var Twitter = require('twitter');
const Sentiment = require('natural').SentimentAnalyzer;
const stemmer = require('natural').PorterStemmer;
const analyzer = new Sentiment("English",stemmer,'afinn');
const natural = require("natural");
const tokenizer = new natural.WordTokenizer();
require('dotenv').config();


/* GET */
router.get('/', function(req, res, next) {
    var client = new Twitter({
        consumer_key: process.env.api_key,
        consumer_secret: process.env.api_secret_key,
        access_token_key: process.env.access_token,
        access_token_secret: process.env.access_token_secret
      });
      client.get('search/tweets', { q: req.query.query ,count: 100,lang:  'en' }, function (error, tweets, response) {
        console.log(tweets);
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
          i++;
          if(Number.isNaN(sent)){
            sent = 0;
          }
          total += sent;
        });
        
        var totalScore = total/i;
        var sentiment ="";
        console.log(total)
        console.log(i)
        console.log(totalScore)
        if(totalScore<0){
          sentiment = "Negative";
        }else {
          sentiment = "Possitive";
        }
        res.json({ array,totalScore,sentiment });
      });
});

module.exports = router;
