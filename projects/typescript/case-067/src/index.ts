import * as http from "http";

http.createServer((_req, res) => {
  res.setHeader("Set-Cookie", "sid=local-fixture-id");
  res.end("case-067");
}).listen(8080);
