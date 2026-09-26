using System.Net.Http;

var url = args.Length > 0 ? args[0] : "http://localhost";
using var client = new HttpClient();
Console.WriteLine(await client.GetStringAsync(url));
