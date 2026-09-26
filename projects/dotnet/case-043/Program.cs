unsafe
{
    byte* p = stackalloc byte[8];
    int index = args.Length > 0 ? int.Parse(args[0]) : 16;
    p[index] = 1;
    Console.WriteLine(p[0]);
}
