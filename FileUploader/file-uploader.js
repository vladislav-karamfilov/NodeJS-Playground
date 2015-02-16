'use strict';

var express = require('express'),
  busboy = require('connect-busboy'),
  fs = require('fs'),
  app = express(),
  util = require('util');

app.use(busboy());

app.get('/fileUpload', function (request, response) {
  response.send('<form method="post" action="/fileUpload" enctype="multipart/form-data">' +
  '<input type="file" name="file" /><input type="submit" value="Upload" /></form>')
});

app.post('/fileUpload', function (request, response, next) {
  request.pipe(request.busboy);
  request.busboy.on('file', function (fieldName, file, fileName) {
    var filePath = __dirname + '/test/' + fileName;
    fs.exists(filePath, function (exists) {
      var redirectUrl = '/successfulFileUpload';
      if (exists) {
        fs.unlink(filePath, function (error) {
          if (error) {
            throw error;
          }

          writeFileAndRedirectResponse(filePath, file, response, redirectUrl);
        });
      } else {
        writeFileAndRedirectResponse(filePath, file, response, redirectUrl);
      }
    });
  });
});

var writeFileAndRedirectResponse = function (filePath, file, response, redirectUrl) {
  var fileStream = fs.createWriteStream(filePath);

  file.pipe(fileStream);
  fileStream.on('close', function () {
    response.redirect(redirectUrl);
  });
};

app.get('/successfulFileUpload', function (request, response) {
  response.send('<div style="color: #008000;">Successful file upload!</div>');
});

app.listen(3000);
