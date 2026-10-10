// Synthetic CWE-95: command-line text reaches eval. The build never runs it.
const expression = process.argv[2] || "1 + 1";
console.log(eval(expression));
