const http = require("http");
const fs = require("fs");
const path = require("path");

const base = path.join(__dirname, "public");

http.createServer((req, res) => {
  const name = decodeURIComponent(req.url.slice(1) || "index.txt");
  fs.readFile(path.join(base, name), "utf8", (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.end("missing");
      return;
    }
    res.end(data);
  });
}).listen(8080);
