using System.Diagnostics;
using System.Reflection.Emit;

var value = args.Length > 0 ? args[0] : "echo sample";
var method = new DynamicMethod("Run", typeof(int), new[] { typeof(string) });
var il = method.GetILGenerator();
il.Emit(OpCodes.Ldarg_0);
il.Emit(OpCodes.Call, typeof(Process).GetMethod(nameof(Process.Start), new[] { typeof(string) })!);
il.Emit(OpCodes.Pop);
il.Emit(OpCodes.Ldc_I4_0);
il.Emit(OpCodes.Ret);
var run = (Func<string, int>)method.CreateDelegate(typeof(Func<string, int>));
Console.WriteLine(run(value));
