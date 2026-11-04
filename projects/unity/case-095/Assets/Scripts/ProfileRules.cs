using System;
using System.Security.Cryptography;
using System.Text;

namespace AppSecCorpus
{
    [Serializable]
    public sealed class LocalProfile
    {
        public string displayName;
        public string pinDigest;
        public string accessLevel;
    }

    public static class ProfileRules
    {
        public static bool CheckPin(LocalProfile profile, string pin)
        {
            return profile.pinDigest == Digest(pin);
        }

        public static bool CanOpenMemberPanel(LocalProfile profile)
        {
            return profile.accessLevel == "member";
        }

        public static string Digest(string value)
        {
            using (MD5 algorithm = MD5.Create())
            {
                byte[] digest = algorithm.ComputeHash(Encoding.UTF8.GetBytes(value));
                return BitConverter.ToString(digest).Replace("-", "").ToLowerInvariant();
            }
        }
    }
}
