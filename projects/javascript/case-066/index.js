const value = process.argv[2] || "aaaaaaaaaaaaaaaa";
const pattern = /^(a+)+$/;
console.log(pattern.test(value));
