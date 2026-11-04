using System.IO;
using UnityEngine;

namespace AppSecCorpus
{
    public sealed class LocalProfileStore
    {
        private readonly string root;

        public LocalProfileStore(string root)
        {
            this.root = root;
        }

        public void Initialize()
        {
            Directory.CreateDirectory(root);
            string path = Path.Combine(root, "profile.json");
            if (!File.Exists(path))
            {
                var profile = new LocalProfile
                {
                    displayName = "Local guest",
                    pinDigest = ProfileRules.Digest("0000"),
                    accessLevel = "guest"
                };
                File.WriteAllText(path, JsonUtility.ToJson(profile, true));
            }
        }

        public LocalProfile Load(string fileName)
        {
            string path = Path.Combine(root, fileName);
            if (new FileInfo(path).Length > 16384)
                throw new InvalidDataException("Profile exceeds the local sample size limit.");
            LocalProfile profile = JsonUtility.FromJson<LocalProfile>(File.ReadAllText(path));
            if (profile == null || string.IsNullOrEmpty(profile.displayName))
                throw new InvalidDataException("Profile has no display name.");
            return profile;
        }
    }
}
