'use strict';

var PORT = 3000;

var http = require('http');
var path = require('path');
var Busboy = require('busboy');
var lwip = require('lwip');

var requestListener = function (req, res) {
  var requestMethod = req.method.toLowerCase();
  var requestUrl = req.url.toLowerCase();
  if (requestMethod === 'get' && requestUrl == '/') {
    res.writeHeader(200, {"Content-Type": "text/html"});
    res.end(
      '<form method="post" action="/upload" enctype="multipart/form-data">\
        <input type="file" name="image" />\
        <input type="submit" value="Convert to grayscale image" />\
      </form>');
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
              res.writeHeader(200, {"Content-Type": "text/plain"});
              return res.end('Error reading image: ' + err);
            }

            var batch = image.batch();

            var imageWidth = image.width();
            var imageHeight = image.height();

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

            batch.exec(function (err, image) {
              if (err) {
                res.writeHeader(200, {"Content-Type": "text/plain"});
                res.end('Error processing image: ' + err);
              } else {
                image.writeFile(function (err, imageBuffer) {
                  if (err) {
                    res.writeHeader(200, {"Content-Type": "text/plain"});
                    res.end('Error getting processed image: ' + err);
                  } else {
                    res.setHeader(200, {
                      "Content-Type": mimeType,
                      "Content-Disposition": "Attachment; Filename=" + fileName
                    });

                    res.pipe(imageBuffer);
                  }
                });
              }
            });
          });
        });
      }
    });

    req.pipe(busboy);
  } else {
    res.writeHeader(200, {"Content-Type": "text/plain"});
    res.end('Invalid URL or HTTP method!');
  }
};

var server = http.createServer(requestListener);

server.listen(PORT, function () {
  console.log('Server running on port: ' + PORT);
});