'use strict';

var SUBSCRIBERS_FILE_PATH = '../data/subscribers.json';
var SUBSCRIBERS_STORAGE_KEY = 'subscribers';

var express = require('express');
var bodyParser = require('body-parser');
var storage = require('node-persist');
var random = require('generate-key');
var fs = require('fs');

storage.init({
  'dir': '../data',
  'stringify': JSON.stringify,
  'parse': JSON.parse,
  'encoding': 'utf8',
  'logging': false,
  'continuous': true,
  'interval': false
});

var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.post('/subscribe', function (req, res) {
  var subscriptionData = req.body;
  if (subscriptionData) {
    if (subscriptionData.email && subscriptionData.keywords && subscriptionData.type) {
      var subscriberId = random.generateKey(8);

      var subscribers = storage.getItem(SUBSCRIBERS_STORAGE_KEY) || {};

      subscribers[subscriberId] = {
        'email': subscriptionData.email, // TODO: Validation for email!
        'keywords': subscriptionData.keywords, // TODO: Validation for array and skip empty strings!
        'type': subscriptionData.type, // TODO: Validation for only story and comment types!
        'confirmed': false
      };

      storage.setItem(SUBSCRIBERS_STORAGE_KEY, subscribers);

      fs.writeFile(SUBSCRIBERS_FILE_PATH, JSON.stringify(subscribers, null, 2), function (err) {
        if (err) {
          res.send('Error writing subscribers to file: ' + err);
        } else {
          res.json(subscriberId);
        }
      });
    } else {
      res.send('Invalid subscription data provided. You must specify Email, keywords and type!');
    }
  } else {
    res.send('No subscription data provided!');
  }
});

app.post('/unsubscribe', function (req, res) {
  var subscriberId = req.body && req.body.subscriberId;
  if (subscriberId) {
    var subscribers = storage.getItem(SUBSCRIBERS_STORAGE_KEY);
    if (subscribers && subscribers[subscriberId]) {
      delete subscribers[subscriberId];

      storage.setItem(SUBSCRIBERS_STORAGE_KEY, subscribers);

      fs.writeFile(SUBSCRIBERS_FILE_PATH, JSON.stringify(subscribers, null, 2), function (err) {
        if (err) {
          res.send('Error writing subscribers to file: ' + err);
        } else {
          res.send('Successfully unsubscribed!');
        }
      });
    } else {
      res.send('No such subscriber found!');
    }
  } else {
    res.send('No subscriber ID provided!');
  }
});

app.get('/listSubscribers', function (req, res) {
  var subscribersList = [];
  var subscriber;

  var subscribers = storage.getItem(SUBSCRIBERS_STORAGE_KEY);
  if (subscribers) {
    Object.getOwnPropertyNames(subscribers).forEach(function (subscriberId) {
      subscriber = subscribers[subscriberId];
      subscribersList.push({
        'subscriberId': subscriberId,
        'email': subscriber.email,
        'keywords': subscriber.keywords,
        'type': subscriber.type,
        'confirmed': subscriber.confirmed
      });
    });
  }

  res.send(subscribersList);
});

app.get('/confirmEmail/:email/:subscriberId', function (req, res) {
  var email = req.param('email');
  var subscriberId = req.param('subscriberId');

  var subscribers = storage.getItem(SUBSCRIBERS_STORAGE_KEY);
  if (subscribers) {
    var subscriber = subscribers[subscriberId];
    if (subscriber && subscriber.email === email) {
      subscriber.confirmed = true;
      res.send('Email successfully confirmed!');
    } else {
      res.send('Invalid email or subscriberId!');
    }
  } else {
    res.send('No subscribers!');
  }
});

app.listen(3000);
