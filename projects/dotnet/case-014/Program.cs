using System.Diagnostics;

var value = args.Length > 0 ? args[0] : "echo sample";
var info = OperatingSystem.IsWindows()
    ? new ProcessStartInfo("cmd.exe", "/c " + value)
    : new ProcessStartInfo("/bin/sh", "-c \"" + value.Replace("\"", "\\\"") + "\"");
info.RedirectStandardOutput = true;
using var process = Process.Start(info);
Console.WriteLine(process?.StandardOutput.ReadToEnd());
