'use strict';

var CONFIG_FILE_PATH = './config.json';
var API_URL_CONFIG_PROPERTY_NAME = 'api_url';
var HTTPS_PREFIX = 'https';

var fs = require('fs');
var url = require('url');
var ArgumentParser = require('argparse').ArgumentParser;
var http;

var logToConsole = function logToConsole(err, data) {
  if (err) {
    console.error(err);
  } else {
    console.log(data);
  }
};

if (!fs.existsSync(CONFIG_FILE_PATH)) {
  return logToConsole('Config file not found!');
}

var config = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH));
var apiUrl = config[API_URL_CONFIG_PROPERTY_NAME] && config[API_URL_CONFIG_PROPERTY_NAME].trim();
if (!apiUrl) {
  return logToConsole('Api URL not found in config file!');
}

if (apiUrl.indexOf(HTTPS_PREFIX) === 0) {
  http = require('https');
} else {
  http = require('http');
}

var argumentParser = new ArgumentParser();
argumentParser.addArgument(['--register'], {
  'action': 'storeConst',
  'dest': 'action',
  'constant': 'registerUser'
});
argumentParser.addArgument(['--getall'], {
  'action': 'storeConst',
  'dest': 'action',
  'constant': 'getAllChirps'
});
argumentParser.addArgument(['--getself'], {
  'action': 'storeConst',
  'dest': 'action',
  'constant': 'getMyChirps'
});
argumentParser.addArgument(['--create'], {
  'action': 'storeConst',
  'dest': 'action',
  'constant': 'createChirp'
});
argumentParser.addArgument(['--delete'], {
  'action': 'storeConst',
  'dest': 'action',
  'constant': 'deleteChirp'
});
argumentParser.addArgument(['--user']);
argumentParser.addArgument(['--message']);
argumentParser.addArgument(['--chirpId']);

var args = argumentParser.parseArgs();
if (!args.action) {
  return logToConsole('No action provided!');
}

var port = url.parse(apiUrl).port;

var handleResponse = function (res, callback) {
  var data = '';

  res.on('data', function (chunk) {
    data += chunk.toString('utf8');
  });

  res.on('end', function () {
    callback(null, data);
  });
};

var handleRequestError = function handleRequestError(request, callback) {
  request.on('error', function (err) {
    callback(err);
  });
};

var registerUser = function registerUser(user, callback) {
  var request = http.request({
    'path': apiUrl + '/register',
    'port': port,
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/json',
      'Content-Length': user.length
    }
  }, function (res) {
    handleResponse(res, callback);
  });

  handleRequestError(request, callback);

  request.end(user);
};

var getAllChirps = function getAllChirps(callback) {
  http.get(apiUrl + '/all_chirps', function (res) {
    handleResponse(res, callback);
  });
};

var getMyChirps = function getMyChirps(user, key, callback) {
  var url = apiUrl + '/my_chirps' + '?user=' + user + '&key=' + key;
  http.get(url, function (res) {
    handleResponse(res, callback);
  });
};

var createChirp = function createChirp(chirp, callback) {
  var request = http.request({
    'path': apiUrl + '/chirp',
    'port': port,
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/json',
      'Content-Length': chirp.length
    }
  }, function (res) {
    handleResponse(res, callback);
  });

  handleRequestError(request, callback);

  request.end(chirp);
};

var deleteChirp = function deleteChirp(chirpData, callback) {
  var request = http.request({
    'path': apiUrl + '/chirp',
    'port': port,
    'method': 'DELETE',
    'headers': {
      'Content-Type': 'application/json',
      'Content-Length': chirpData.length
    }
  }, function (res) {
    handleResponse(res, callback);
  });

  handleRequestError(request, callback);

  request.end(chirpData);
};

(function main() {
  switch (args.action) {
    case 'registerUser':
      var user = JSON.stringify({'user': args.user});

      registerUser(user, function (err, data) {
        if (err) {
          return logToConsole(err);
        }

        config.user = args.user;
        config.key = JSON.parse(data).key;

        fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), function (err) {
          if (err) {
            logToConsole(err);
          } else {
            logToConsole(null, data);
          }
        });
      });

      break;
    case 'getAllChirps':
      getAllChirps(logToConsole);
      break;
    case 'getMyChirps':
      if (!config.user || !config.key) {
        return logToConsole('No user and/or key set in the configuration!');
      }

      getMyChirps(config.user, config.key, logToConsole);

      break;
    case 'createChirp':
      if (!config.user || !config.key) {
        return logToConsole('No user and/or key set in the configuration!');
      }

      var chirp = JSON.stringify({'user': config.user, 'key': config.key, 'chirpText': args.message});
      createChirp(chirp, logToConsole);

      break;
    case 'deleteChirp':
      if (!config.user || !config.key) {
        return logToConsole('No user and/or key set in the configuration!');
      }

      var chirpData = JSON.stringify({'key': config.key, 'chirpId': args.chirpId});
      deleteChirp(chirpData, logToConsole);

      break;
    default :
      logToConsole('Unknown action!');
      break;
  }
}());
