using System.Runtime.Serialization.Formatters.Binary;

#pragma warning disable SYSLIB0011
var name = args.Length > 0 ? args[0] : "sample.bin";
using var file = File.OpenRead(name);
var formatter = new BinaryFormatter();
Console.WriteLine(formatter.Deserialize(file));
#pragma warning restore SYSLIB0011
