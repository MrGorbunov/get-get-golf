const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  // filePath
  let fileName = req.url;
  if (req.url === '/') fileName = '/index.html';

  let filePath = path.join(__dirname, 'public', fileName);

  // contentType
  let fileExt = path.extname(filePath);
  let contentType = "text/html";

  switch (fileExt) {
    case '.js':
    case '.mjs':
      contentType = "text/javascript";
      break;
    case '.css':
      contentType = "text/css";
      break;
    case '.json':
      contentType = "application/json";
      break;
    case '.png':
      contentType = "image/png";
      break;
    case '.jpg':
      contentType = "image/jpg";
      break;
  }

  // actually serve the content
  fs.readFile(filePath, (err, content) => {
    if (err) {
      // Page not found (404)
      if (err.code == 'ENOENT') {
        fs.readFile(path.join(__dirname, 'public', '404.html'), (err, content) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.write(content, 'utf8');
          res.end();
        });

      // Some server error
      } else {
        res.writeHead(500);
        res.write(`Server Error: ${err.code}`)
        res.end();
      }


    // Successful response
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.write(content, 'utf8');
      res.end();
    }
  });
});

server.listen(PORT, () => {
  console.log(`Now listening on port ${PORT} for requests, yippe :D`);
});
