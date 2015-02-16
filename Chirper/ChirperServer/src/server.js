'use strict';

var HTTP_GET = 'GET';
var HTTP_POST = 'POST';
var HTTP_DELETE = 'DELETE';
var JSON_CONTENT_TYPE = 'application/json';
var OK_HTTP_STATUS_CODE = 200;
var BAD_REQUEST_HTTP_STATUS_CODE = 400;
var FORBIDDEN_HTTP_STATUS_CODE = 403;
var NOT_FOUND_HTTP_STATUS_CODE = 404;
var CONFLICT_HTTP_STATUS_CODE = 409;

var http = require('http');
var url = require('url');
var util = require('util');
var random = require('generate-key');

var data = {
  users: [],
  chirps: []
};

var writeApiEndPointNotFound = function writeApiEndPointNotFound(res) {
  res.statusCode = NOT_FOUND_HTTP_STATUS_CODE;
  res.end(JSON.stringify({'error': 'Unknown Chirper API endpoint!'}));
};

var attachRequestErrorEventHandler = function attachRequestErrorEventHandler(req, res) {
  req.on('error', function (err) {
    res.statusCode = BAD_REQUEST_HTTP_STATUS_CODE;
    res.end(JSON.stringify({'error': err.toString()}));
  });
};

var getUser = function getUser(username, key) {
  var usersCount = data.users.length;
  for (var i = 0; i < usersCount; i++) {
    if (data.users[i].user === username) {
      if (key && data.users[i].key !== key) {
        break;
      }

      return data.users[i];
    }
  }

  return null;
};

var registerUser = function registerUser(req, res) {
  var userData = '';
  req.on('data', function (chunk) {
    userData += chunk.toString('utf8');
  });

  req.on('end', function () {
    var userJson = userData && JSON.parse(userData);
    if (userJson && userJson.user) {
      if (getUser(userJson.user)) {
        res.statusCode = CONFLICT_HTTP_STATUS_CODE;
        return res.end(JSON.stringify({'error': 'User already exists!'}));
      }

      var newUserKey = random.generateKey(8);
      data.users.push({
        'userId': data.users.length + 1,
        'user': userJson.user,
        'key': newUserKey,
        'chirps': 0
      });

      res.statusCode = OK_HTTP_STATUS_CODE;
      return res.end(JSON.stringify({'key': newUserKey}));
    }

    res.statusCode = BAD_REQUEST_HTTP_STATUS_CODE;
    res.end(JSON.stringify({'error': 'User not provided!'}));
  });

  attachRequestErrorEventHandler(req, res);
};

var addChirp = function addChirp(req, res) {
  var chirpData = '';
  req.on('data', function (chunk) {
    chirpData += chunk.toString('utf8');
  });

  req.on('end', function () {
    var chirpJson = chirpData && JSON.parse(chirpData);
    if (chirpJson && chirpJson.user && chirpJson.key && chirpJson.chirpText) {
      var user = getUser(chirpJson.user, chirpJson.key);
      if (!user) {
        res.statusCode = BAD_REQUEST_HTTP_STATUS_CODE;
        return res.end(JSON.stringify({'error': 'Invalid user or key!'}));
      }

      var dateTimeNow = new Date();
      var newChirpCreatedOn = util.format(
        '%d-%d-%d %d:%d:%d',
        dateTimeNow.getDate(),
        dateTimeNow.getMonth() + 1,
        dateTimeNow.getFullYear(),
        dateTimeNow.getHours(),
        dateTimeNow.getMinutes(),
        dateTimeNow.getSeconds());

      var newChirpId = data.chirps.length + 1;
      data.chirps.push({
        'userId': user.userId,
        'chirpId': newChirpId,
        'chirpText': chirpJson.chirpText,
        'chirpTime': newChirpCreatedOn
      });

      user.chirps++;

      res.statusCode = OK_HTTP_STATUS_CODE;
      return res.end(JSON.stringify({'chirpId': newChirpId}));
    }

    res.statusCode = BAD_REQUEST_HTTP_STATUS_CODE;
    res.end(JSON.stringify({'error': 'Invalid chirp data provided!'}));
  });

  attachRequestErrorEventHandler(req, res);
};

var getRequestsHandler = function getRequestsHandler(req, res) {
  var requestUrl = url.parse(req.url.toLowerCase());
  if (requestUrl.pathname === '/all_chirps') {
    res.statusCode = OK_HTTP_STATUS_CODE;
    res.end(JSON.stringify(data.chirps.filter(Boolean)));
  } else if (requestUrl.pathname === '/all_users') {
    var users = [];
    data.users.forEach(function (user) {
      users.push({
        'user': user.user,
        'userId': user.userId,
        'chirps': user.chirps
      });
    });

    res.statusCode = OK_HTTP_STATUS_CODE;
    res.end(JSON.stringify(users));
  } else if (requestUrl.pathname === '/my_chirps') {
    var userInfo = url.parse(req.url, true).query;
    if (!userInfo) {
      res.statusCode = BAD_REQUEST_HTTP_STATUS_CODE;
      return res.end(JSON.stringify({'error': 'No user and key provided!'}));
    }

    var user = getUser(userInfo.user, userInfo.key);
    if (!user) {
      res.statusCode = BAD_REQUEST_HTTP_STATUS_CODE;
      return res.end(JSON.stringify({'error': 'Invalid user or key!'}));
    }

    var userChirps = data.chirps.filter(function (chirp) {
      return chirp && chirp.userId === user.userId;
    });

    res.statusCode = OK_HTTP_STATUS_CODE;
    res.end(JSON.stringify(userChirps));
  } else if (requestUrl.pathname === '/chirps') {
    var chirpAndUserInfo = url.parse(req.url, true).query;
    if (!chirpAndUserInfo || (!chirpAndUserInfo.chirpId && !chirpAndUserInfo.userId)) {
      res.statusCode = BAD_REQUEST_HTTP_STATUS_CODE;
      return res.end(JSON.stringify({'error': 'No chirpId nor userId provided!'}));
    }

    var chirps = [];
    if (chirpAndUserInfo.userId) {
      chirps = data.chirps.filter(function (chirp) {
        return chirp && chirp.userId == chirpAndUserInfo.userId;
      });
    } else {
      var chirp = data.chirps[chirpAndUserInfo.chirpId - 1];
      if (chirp) {
        chirps.push(chirp);
      }
    }

    res.statusCode = OK_HTTP_STATUS_CODE;
    res.end(JSON.stringify(chirps));
  } else {
    writeApiEndPointNotFound(res);
  }
};

var postRequestsHandler = function postRequestsHandler(req, res) {
  var requestUrl = url.parse(req.url.toLowerCase());
  if (requestUrl.pathname === '/register') {
    registerUser(req, res);
  } else if (requestUrl.pathname === '/chirp') {
    addChirp(req, res);
  } else {
    writeApiEndPointNotFound(res);
  }
};

var deleteRequestsHandler = function deleteRequestsHandler(req, res) {
  var requestUrl = url.parse(req.url.toLowerCase());
  if (requestUrl.pathname === '/chirp') {
    var keyAndChirpIdData = '';

    req.on('data', function (chunk) {
      keyAndChirpIdData += chunk.toString('utf8');
    });

    req.on('end', function () {
      var keyAndChirpIdJson = keyAndChirpIdData && JSON.parse(keyAndChirpIdData);
      if (!keyAndChirpIdJson || (!keyAndChirpIdJson.key && !keyAndChirpIdJson.chirpId)) {
        res.statusCode = BAD_REQUEST_HTTP_STATUS_CODE;
        return res.end(JSON.stringify({'error': 'No chirpId and key data provided!'}));
      }

      var chirp = data.chirps[keyAndChirpIdJson.chirpId - 1];
      if (!chirp) {
        res.statusCode = NOT_FOUND_HTTP_STATUS_CODE;
        return res.end(JSON.stringify({'error': 'No chirp with provided chirpId found!'}));
      }

      var user = data.users[chirp.userId - 1];
      if (user.key !== keyAndChirpIdJson.key) {
        res.statusCode = FORBIDDEN_HTTP_STATUS_CODE;
        return res.end(JSON.stringify({'error': 'Invalid key!'}));
      }

      data.chirps[keyAndChirpIdJson.chirpId - 1] = null;
      user.chirps--;

      res.statusCode = OK_HTTP_STATUS_CODE;
      res.end(JSON.stringify({'success': 'Chirp successfully deleted!'}));
    });

    attachRequestErrorEventHandler(req, res);
  } else {
    writeApiEndPointNotFound(res);
  }
};

var requestsListener = function requestsListener(req, res) {
  res.setHeader('Content-Type', JSON_CONTENT_TYPE);

  var requestMethod = req.method.toUpperCase();
  if (requestMethod === HTTP_GET) {
    getRequestsHandler(req, res);
  } else if (requestMethod === HTTP_POST) {
    postRequestsHandler(req, res);
  } else if (requestMethod === HTTP_DELETE) {
    deleteRequestsHandler(req, res);
  } else {
    writeApiEndPointNotFound(res);
  }
};

http.createServer(requestsListener).listen(8080);
