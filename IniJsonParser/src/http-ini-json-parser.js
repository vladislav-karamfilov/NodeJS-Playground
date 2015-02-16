module.exports = function (fileToParseUrl, parserType, outputFileDirectory, callback) {
  'use strict';

  var fs = require('fs');
  var path = require('path');
  var util = require('util');
  var ParserType = require('./parser-type');
  var parser = require(parserType === ParserType.INI_TO_JSON ? './ini-to-json-parser' : './json-to-ini-parser');
  var http;

  var INI_FILE_EXTENSION = '.ini';
  var JSON_FILE_EXTENSION = '.json';
  var HTTPS_PREFIX = 'https';

  fileToParseUrl = fileToParseUrl && fileToParseUrl.trim();
  if (!fileToParseUrl) {
    return callback('No URL to file to parse provided!');
  }

  if (!fileToParseUrl.indexOf(HTTPS_PREFIX)) {
    http = require('https');
  } else {
    http = require('http');
  }

  var request = http.request(fileToParseUrl, function (response) {
    var data = '';

    response.on('data', function (chunk) {
      data += chunk.toString('utf8');
    });

    response.on('end', function () {
      // JSON-to-INI parser uses an object to parse and INI-to-JSON parser uses a string
      var dataToParse = parserType === ParserType.INI_TO_JSON ? data : JSON.parse(data);

      var parsedData = parser.parse(dataToParse);
      if (parserType === ParserType.INI_TO_JSON) {
        parsedData = JSON.stringify(parsedData, null, 2);
      }

      var inputFileExtension = parserType === ParserType.INI_TO_JSON ? INI_FILE_EXTENSION : JSON_FILE_EXTENSION;
      var fileName = path.basename(fileToParseUrl, inputFileExtension);
      var outputFileExtension = parserType === ParserType.INI_TO_JSON ? JSON_FILE_EXTENSION : INI_FILE_EXTENSION;
      var resultFilePath = util.format('%s/%s%s', outputFileDirectory, fileName, outputFileExtension);

      fs.writeFile(resultFilePath, parsedData, function (err) {
        if (err) {
          callback(util.format('Error writing file: %s', err));
        } else {
          callback(null, util.format('File parsed successfully! The result file is: %s', resultFilePath));
        }
      });
    });
  });

  request.on('error', function (err) {
    callback(util.format('Error on request: ', err));
  });

  request.end();
};
