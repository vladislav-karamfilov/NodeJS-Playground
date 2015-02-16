'use strict';

var CONFIG_FILE_PATH = './config.json';
var JSON_FILE_EXTENSION = '.json';

var fs = require('fs');
var path = require('path');
var MongoClient = require('mongodb').MongoClient;

var jsonFilePath = process.argv[2];
if (!jsonFilePath) {
  return console.log('No JSON file to import provided!');
}

var configData;
try {
  configData = fs.readFileSync(CONFIG_FILE_PATH);
} catch (err) {
  return console.log('Error reading config file: ' + err);
}

var config = JSON.parse(configData.toString('utf8'));
var mongoConnectionUrl = config.mongoConnectionUrl && config.mongoConnectionUrl.trim();
if (!mongoConnectionUrl) {
  return console.log('No MongoDB connection url in config file found!');
}

var database = mongoConnectionUrl.substr(mongoConnectionUrl.lastIndexOf('/') + 1);
var collection = path.basename(jsonFilePath, JSON_FILE_EXTENSION);

var insertDocuments = function insertDocuments(db, collectionName, documents, callback) {
  var collection = db.collection(collectionName);
  if (!collection) {
    return callback('No collection with name ' + collectionName + ' found in the database!');
  }

  collection.insert(documents, function (err) {
    callback(err);
  });
};

jsonFilePath = path.normalize(jsonFilePath);
fs.readFile(jsonFilePath, function (err, data) {
  if (err) {
    return console.log('Error reading file with collection: ' + err);
  }

  var documents = JSON.parse(data.toString('utf8'));
  MongoClient.connect(mongoConnectionUrl, function (err, db) {
    if (err) {
      return console.log('Error connecting to database ' + database + ': ' + err);
    }

    insertDocuments(db, collection, documents, function (err) {
      if (err) {
        console.log('Error inserting collection items in database ' + database + ': ' + err);
      } else {
        console.log('Collection items successfully inserted in the database ' + database + '!');
      }

      db.close();
    });
  });
});
