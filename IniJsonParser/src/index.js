'use strict';

var path = require('path');
var ArgumentParser = require('argparse').ArgumentParser;
var ParserType = require('./parser-type');
var iniJsonParser;

var HTTP_PREFIX = 'http';
var HTTPS_PREFIX = 'https';

var logToConsole = function logToConsole(err, data) {
  if (err) {
    console.error(err);
  } else {
    console.log(data);
  }
};

var argumentParser = new ArgumentParser();
argumentParser.addArgument(['--type']);
argumentParser.addArgument(['--file']);

var args = argumentParser.parseArgs();
if (!args.file) {
  return logToConsole('No file provided!');
}

if (!args.type) {
  return logToConsole('No file type provided!');
}

var filePathOrUrl = args.file;
if (!filePathOrUrl.indexOf(HTTP_PREFIX) || !filePathOrUrl.indexOf(HTTPS_PREFIX)) {
  iniJsonParser = require('./http-ini-json-parser');
} else {
  filePathOrUrl = path.resolve(filePathOrUrl);
  iniJsonParser = require('./fs-ini-json-parser');
}

var outputDirectory = path.join(__dirname, '../out');
var parserType;
switch (args.type) {
  case 'ini':
    parserType = ParserType.INI_TO_JSON;
    break;
  case 'json':
    parserType = ParserType.JSON_TO_INI;
    break;
  default:
    return logToConsole('Unknown file type provided!');
}

iniJsonParser(filePathOrUrl, parserType, outputDirectory, logToConsole);
