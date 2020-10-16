var express = require('express');
var router = express.Router();
var Twitter = require('twitter');
const Sentiment = require('natural').SentimentAnalyzer;
const stemmer = require('natural').PorterStemmer;
const analyzer = new Sentiment("English", stemmer, 'afinn');
const natural = require("natural");
const tokenizer = new natural.WordTokenizer();
const redis = require('redis');
require('dotenv').config();


// This section will change for Cloud Services
const redisClient = redis.createClient();
redisClient.on('error', (err) => {
  console.log("Error " + err);
});

const api_key = 'X6P8tmxAf1B7U1APJFjeT3rty';
const api_secret_key = 'iTIQzMHRzv5DmNv21dMObH0t3MQju06uzti9H247aHwokwDm13';
const access_token = '1086685746-d0Dwa9pNZLJHX8NNEJ2ZQD55LWOr5ZG9Pu2tLaB';
const access_token_secret = 'gGDd2TaO0vBstTPnImiqxBpxiAvCiamFcUkV1i7DbUXA8';




/* GET */
router.get('/query=:q&count=:number', function (req, res, next) {
  var query = req.params.q;
  var number = req.params.number;
  var i = 1;
  var total = 0;
  var array = [];
  var client = new Twitter({
    consumer_key: api_key,
    consumer_secret: api_secret_key,
    access_token_key: access_token,
    access_token_secret: access_token_secret
  });


  redisClient.keys('*', async function (err, keys) {
    if (!err) {

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var id = key.replace(`${query}:`, '');
        if(key.includes(query)){
          redisClient.get(key, async function (error, value) {
            //console.log(value);
            var sent = analyzer.getSentiment(tokenizer.tokenize(value));
            array.push({ id: id, text: value, score: sent });
  
            i++;
            if (Number.isNaN(sent)) {
              sent = 0;
            }
            total += sent;
          });
        }
      }
    }
    client.get('search/tweets', { q: query, count: number, lang: 'en' }, function (error, tweets, response) {
      //console.log(tweets);
      tweets.statuses.forEach(status => {
        var rediskey = `${query}:${status.id}`;
  
        redisClient.exists(rediskey, (err, ok) => {
          if (err) console.log(err);
          if (!ok) {
            var sent = analyzer.getSentiment(tokenizer.tokenize(status.text));
            redisClient.set(rediskey, status.text)
            array.push({ id: status.id, text: status.text, score: sent })
            i++;
            if (Number.isNaN(sent)) {
              sent = 0;
            }
            total += sent;
            //console.log(sent);
  
          }
        });
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
      console.log(array);
      console.log(i);
      res.json({ array, totalScore, sentiment });
    });
  });

});



module.exports = router;
