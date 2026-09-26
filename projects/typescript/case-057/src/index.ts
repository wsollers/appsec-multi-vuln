type Doc = Record<string, unknown>;

const input = process.argv[2] || "{\"name\":\"sample\"}";
const filter = JSON.parse(input) as Doc;
const query = { account: "default", ...filter };
console.log(JSON.stringify(query));
