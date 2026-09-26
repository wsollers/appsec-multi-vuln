const http = require("http");
const https = require("https");

http.createServer((req, res) => {
  const parsed = new URL(req.url, "http://localhost");
  const target = parsed.searchParams.get("u") || "http://localhost";
  const client = target.startsWith("https:") ? https : http;
  client.get(target, upstream => {
    upstream.pipe(res);
  }).on("error", err => {
    res.statusCode = 400;
    res.end(err.message);
  });
}).listen(8080);
