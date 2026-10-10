const fs = require("node:fs");
const path = require("node:path");

const buildDirectory = path.join(__dirname, "..", ".build");
fs.mkdirSync(buildDirectory, { recursive: true });
fs.writeFileSync(path.join(buildDirectory, "postinstall.marker"), "case-088\n", "utf8");
