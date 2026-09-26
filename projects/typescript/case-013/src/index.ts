type Bag = Record<string, unknown>;

function merge(target: Bag, source: Bag): Bag {
  for (const key of Object.keys(source)) {
    const value = source[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      target[key] = merge((target[key] as Bag) || {}, value as Bag);
    } else {
      target[key] = value;
    }
  }
  return target;
}

const input = process.argv[2] || "{\"name\":\"sample\"}";
console.log(JSON.stringify(merge({}, JSON.parse(input))));
