using System;
using System.IO;
using System.Security.Cryptography;
using UnityEngine;

namespace AppSecCorpus
{
    public sealed class Case095Panel : MonoBehaviour
    {
        private LocalProfileStore store;
        private string fileName = "profile.json";
        private string pin = "0000";
        private string status = "No profile loaded.";
        private bool memberPanel;

        private void Start()
        {
            store = new LocalProfileStore(Path.Combine(Application.persistentDataPath, "profiles"));
            try
            {
                store.Initialize();
                status = "Local sample ready. Default sample PIN: 0000.";
            }
            catch (Exception error) when (error is IOException || error is UnauthorizedAccessException || error is CryptographicException)
            {
                status = "Sample initialization failed: " + error.Message;
                Debug.LogError(status);
                enabled = false;
            }
        }

        private void OnGUI()
        {
            GUILayout.BeginArea(new Rect(30, 30, 720, 500));
            GUILayout.Label("Case 095 - isolated local training sample");
            GUILayout.Label("Use synthetic data only. Do not enter real credentials.");
            GUILayout.Label("Profile file:");
            fileName = GUILayout.TextField(fileName, 240);
            GUILayout.Label("Sample PIN:");
            pin = GUILayout.PasswordField(pin, '*', 32);
            if (GUILayout.Button("Open local profile"))
                OpenProfile();
            GUILayout.Label(status);
            if (memberPanel)
                GUILayout.Label("Member panel: synthetic local content only.");
            GUILayout.EndArea();
        }

        private void OpenProfile()
        {
            memberPanel = false;
            try
            {
                LocalProfile profile = store.Load(fileName);
                if (!ProfileRules.CheckPin(profile, pin))
                {
                    status = "Sample PIN did not match.";
                    return;
                }
                memberPanel = ProfileRules.CanOpenMemberPanel(profile);
                status = "Opened local profile: " + profile.displayName;
            }
            catch (Exception error) when (error is IOException || error is UnauthorizedAccessException || error is ArgumentException || error is CryptographicException)
            {
                status = "Cannot open local profile: " + error.Message;
                Debug.LogError(status);
            }
        }
    }
}
