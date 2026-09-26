using Newtonsoft.Json.Linq;

var value = args.Length > 0 ? args[0] : "{\"name\":\"sample\"}";
var parsed = JObject.Parse(value);
Console.WriteLine(parsed["name"] ?? "sample");
