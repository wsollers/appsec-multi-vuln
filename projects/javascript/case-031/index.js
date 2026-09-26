const _ = require("lodash");

const value = process.argv[2] || "sample";
const render = _.template("value: <%= value %>");
console.log(render({ value }));
