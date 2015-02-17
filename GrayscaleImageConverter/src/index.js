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
          imageData += chunk;
        });

        file.on('end', function () {
          var imageBuffer = new Buffer(imageData, 'binary');
          lwip.open(imageBuffer, path.extname(fileName).substr(1), function (err, image) {
            if (err) {
              res.writeHeader(200, {"Content-Type": "text/plain"});
              return res.end('Error reading image: ' + err);
            }

            console.log('Image width: ' + image.width());
            console.log('Image height: ' + image.height());

          });
        });
      }
    });

    busboy.on('finish', function () {
      res.writeHeader(200, {"Content-Type": "application/json"});
      res.end(JSON.stringify(arguments));
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