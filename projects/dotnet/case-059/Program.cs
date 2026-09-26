using System.Security.Cryptography;
using System.Text;

var value = args.Length > 0 ? args[0] : "sample";
using var md5 = MD5.Create();
var key = md5.ComputeHash(Encoding.UTF8.GetBytes("fixture-key"));
using var aes = Aes.Create();
aes.Mode = CipherMode.ECB;
aes.Key = key;
var data = Encoding.UTF8.GetBytes(value.PadRight(16).Substring(0, 16));
var output = aes.CreateEncryptor().TransformFinalBlock(data, 0, data.Length);
Console.WriteLine(Convert.ToHexString(output));
