'use strict';

var PORT = 3000;

var http = require('http');
var path = require('path');
var Busboy = require('busboy');
var jade = require('jade');
var lwip = require('lwip');

var writeSuccessResponseContentTypeHeader = function writeSuccessResponseContentTypeHeader(res, contentType) {
  res.writeHeader(200, {"Content-Type": contentType});
};

var renderErrorView = function renderErrorView(res, err) {
  var template = jade.compileFile('./views/error.jade');
  var html = template({error: err});

  writeSuccessResponseContentTypeHeader(res, 'text/html');
  res.end(html);
};

var requestListener = function (req, res) {
  var requestMethod = req.method.toLowerCase();
  var requestUrl = req.url.toLowerCase();
  if (requestMethod === 'get' && requestUrl == '/') {
    jade.renderFile('./views/index.jade', function (err, html) {
      if (err) {
        return renderErrorView(res, 'Error rendering home page: ' + err);
      }

      writeSuccessResponseContentTypeHeader(res, 'text/html');
      res.end(html);
    });
  } else if (requestMethod === 'post' && requestUrl == '/upload') {
    var busboy = new Busboy({headers: req.headers});
    busboy.on('file', function (fieldName, file, fileName, encoding, mimeType) {
      if (fieldName === 'image') {
        var imageData = '';

        file.on('data', function (chunk) {
          imageData += chunk.toString('binary');
        });

        file.on('end', function () {
          var imageBuffer = new Buffer(imageData, 'binary');
          var imageType = path.extname(fileName).substr(1);
          lwip.open(imageBuffer, imageType, function (err, image) {
            if (err) {
              return renderErrorView(res, 'Error reading image: ' + err);
            }

            var batch = image.batch();

            var imageWidth = image.width();
            var imageHeight = image.height();

            // TODO: Use multiple threads
            for (var i = 0; i < imageWidth; i++) {
              for (var j = 0; j < imageHeight; j++) {
                var currentPixel = image.getPixel(i, j);
                var averageColorValue = Math.floor((currentPixel.r + currentPixel.g + currentPixel.b) / 3);
                var newPixelColor = {
                  r: averageColorValue,
                  g: averageColorValue,
                  b: averageColorValue,
                  a: currentPixel.a
                };

                batch.setPixel(i, j, newPixelColor);
              }
            }

            batch.toBuffer(imageType, {}, function (err, imageBuffer) {
              if (err) {
                return renderErrorView(res, 'Error processing image: ' + err);
              }

              res.writeHeader(200, {
                "Content-Type": mimeType,
                "Content-Disposition": 'attachment; filename=' + fileName,
                "Content-Length": imageBuffer.length
              });

              res.end(imageBuffer, 'binary');
            });
          });
        });
      }
    });

    req.pipe(busboy);
  } else {
    renderErrorView(res, 'Invalid URL or HTTP method!');
  }
};

var server = http.createServer(requestListener);

server.listen(PORT, function () {
  console.log('Server running on port: ' + PORT);
});