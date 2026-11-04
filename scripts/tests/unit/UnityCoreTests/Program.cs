using System;
using AppSecCorpus;

internal static class Program
{
    private static int Main()
    {
        var guest = new LocalProfile
        {
            displayName = "Unit sample",
            pinDigest = ProfileRules.Digest("0000"),
            accessLevel = "guest"
        };
        Assert(ProfileRules.CheckPin(guest, "0000"), "Sample PIN matches.");
        Assert(!ProfileRules.CheckPin(guest, "0001"), "Different PIN does not match.");
        Assert(!ProfileRules.CanOpenMemberPanel(guest), "Guest view stays closed.");
        var member = new LocalProfile { accessLevel = "member" };
        Assert(ProfileRules.CanOpenMemberPanel(member), "Member view opens.");
        Assert(!ProfileRules.CanOpenMemberPanel(new LocalProfile()), "Unassigned access stays closed.");
        Assert(!ProfileRules.CanOpenMemberPanel(new LocalProfile { accessLevel = "Member" }), "Access comparisons are exact.");
        Assert(ProfileRules.Digest("0000") == "4a7d1ed414474e4033ac29ccb8653d9b", "Sample digest is stable.");
        Assert(ProfileRules.Digest("") == "d41d8cd98f00b204e9800998ecf8427e", "Empty input is deterministic.");
        Console.WriteLine("Passed 8 shared C# rule unit assertions; this is not a Unity compilation.");
        return 0;
    }

    private static void Assert(bool condition, string message)
    {
        if (!condition)
            throw new InvalidOperationException(message);
    }
}
