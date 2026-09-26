const parse = require("minimist");

const values = parse(process.argv.slice(2));
console.log(values.name || "sample");
