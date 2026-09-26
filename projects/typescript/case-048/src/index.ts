import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as path from "path";

function rootPath(): string {
  let dir = process.cwd();
  while (!fs.existsSync(path.join(dir, "support", "local.crt"))) {
    const next = path.dirname(dir);
    if (next === dir) return process.cwd();
    dir = next;
  }
  return dir;
}

const root = rootPath();
const handler = (req: http.IncomingMessage, res: http.ServerResponse) => {
  const parsed = new URL(req.url || "/", "http://localhost");
  const target = parsed.searchParams.get("next") || "/";
  res.statusCode = 302;
  res.setHeader("Location", target);
  res.end("case-048");
};

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
http.createServer(handler).listen(8080);
https.createServer({
  key: fs.readFileSync(path.join(root, "support", "local.key")),
  cert: fs.readFileSync(path.join(root, "support", "local.crt")),
  secureProtocol: "TLSv1_method"
}, handler).listen(8443);
console.log("case-048");
