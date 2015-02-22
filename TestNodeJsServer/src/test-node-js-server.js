var FILE_PATH = 'some-file-path';

var http = require('http');
var fs = require('fs');

http.createServer(function (request, response) {
    if (request.url === '/json') {
        response.writeHeader({ 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ 'text': 'Hello, world!'}));
    } else if (request.url == '/file') {
        writeFileToResponseOnChunks(response, FILE_PATH);
    } else {
        response.writeHeader({ 'Content-Type': 'text/plain' });
        response.end('Default plain text response.');
    }
}).listen(3000);

var writeFileToResponseOnChunks = function (response, filePath) {
    var fileName = filePath.substr(filePath.lastIndexOf('\\') + 1);

    fs.stat(FILE_PATH, function (error, stats) {
        if (error) {
            throw error;
        }

        var fileStream = fs.createReadStream(filePath);

        response.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': 'attachment; filename="' + fileName + '"',
            'Content-Length': stats.size
        });

        fileStream.pipe(response);
    });
};
