using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace AppSecCorpus.Editor
{
    public static class CorpusBuild
    {
        public static void Build()
        {
            try
            {
                if (Application.unityVersion != "2022.3.62f1")
                    throw new InvalidOperationException("This fixture requires Unity 2022.3.62f1.");
                if (!BuildPipeline.IsBuildTargetSupported(BuildTargetGroup.Standalone, BuildTarget.StandaloneLinux64))
                    throw new InvalidOperationException("Linux Build Support (Mono) must be installed.");

                string root = Path.GetFullPath(Path.Combine(Application.dataPath, ".."));
                string requested = Environment.GetEnvironmentVariable("APPSEC_UNITY_OUTPUT");
                string[] args = Environment.GetCommandLineArgs();
                int outputFlag = Array.IndexOf(args, "-corpusBuildOutput");
                if (outputFlag >= 0)
                {
                    if (outputFlag + 1 >= args.Length)
                        throw new ArgumentException("-corpusBuildOutput needs an absolute player path.");
                    requested = args[outputFlag + 1];
                }
                if (string.IsNullOrEmpty(requested) || !Path.IsPathRooted(requested))
                    throw new ArgumentException("Supply -corpusBuildOutput or APPSEC_UNITY_OUTPUT.");
                string output = Path.GetFullPath(requested);
                string expected = Path.Combine(root, "build", "Case095.x86_64");
                StringComparison comparison = Application.platform == RuntimePlatform.WindowsEditor
                    ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;
                if (!string.Equals(output, expected, comparison))
                    throw new ArgumentException("Player output must be project/build/Case095.x86_64.");
                string directory = Path.GetDirectoryName(output);
                if (File.Exists(output) || Directory.Exists(Path.Combine(directory, "Case095_Data")))
                    throw new IOException("Refusing existing player output; use a fresh isolated checkout.");
                Directory.CreateDirectory(directory);

                string[] scenes = EditorBuildSettings.scenes.Where(scene => scene.enabled).Select(scene => scene.path).ToArray();
                if (scenes.Length != 1 || scenes[0] != "Assets/Scenes/Case095.unity" || !File.Exists(Path.Combine(root, scenes[0])))
                    throw new InvalidOperationException("Exactly the fixture scene must be enabled.");
                PlayerSettings.SetScriptingBackend(BuildTargetGroup.Standalone, ScriptingImplementation.Mono2x);
                var options = new BuildPlayerOptions
                {
                    scenes = scenes,
                    locationPathName = output,
                    target = BuildTarget.StandaloneLinux64,
                    options = BuildOptions.None
                };
                BuildReport report = BuildPipeline.BuildPlayer(options);
                if (report.summary.result != BuildResult.Succeeded || !File.Exists(output) || new FileInfo(output).Length == 0)
                    throw new InvalidOperationException("Unity player build failed: " + report.summary.result);
                Debug.Log("CORPUS_BUILD_SUCCEEDED: " + output);
                EditorApplication.Exit(0);
            }
            catch (Exception error)
            {
                Debug.LogException(error);
                EditorApplication.Exit(1);
            }
        }
    }
}
