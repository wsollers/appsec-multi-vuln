const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");

function rootPath() {
  let dir = process.cwd();
  while (!fs.existsSync(path.join(dir, "support", "local.crt"))) {
    const next = path.dirname(dir);
    if (next === dir) return process.cwd();
    dir = next;
  }
  return dir;
}

const root = rootPath();
const handler = (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const target = url.searchParams.get("next") || "/";
  res.statusCode = 302;
  res.setHeader("Location", target);
  res.end("case-047");
};

https.globalAgent.options.rejectUnauthorized = false;
http.createServer(handler).listen(8080);
https.createServer({
  key: fs.readFileSync(path.join(root, "support", "local.key")),
  cert: fs.readFileSync(path.join(root, "support", "local.crt")),
  secureProtocol: "TLSv1_method"
}, handler).listen(8443);
console.log("case-047");
