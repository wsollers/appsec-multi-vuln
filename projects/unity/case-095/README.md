# Case 095

An original, deliberately unsuitable-for-production local Unity training
fixture. The application is one scene with an IMGUI profile panel and synthetic
local data. It has no listener, remote service, real credentials, third-party
art, native plugin, or downloaded game asset. Do not enter real information or
open untrusted profiles outside an isolated test environment. Opening a profile
is a user action, not an editor/build hook. The player initializes a small
sample beneath `Application.persistentDataPath/profiles`; builds do not run the
player. Evaluation answers belong in the separate evaluator guide, never in
this target's source metadata or matrix.

## Toolchain and scope

- Unity Editor **2022.3.62f1**, with a valid license/activation appropriate to
  the operator and Linux Build Support **Mono** installed for that exact editor.
- Python 3.10+ for the standalone build wrapper. Unity supplies the player C#
  compiler/runtime; a system .NET SDK does not replace the editor.
- Target: `BuildTarget.StandaloneLinux64`, x86_64, Mono. The corresponding
  command-line `-buildTarget` value is `Linux64`. Windows and Linux editor hosts
  need their matching editor installation and supported Linux build module.
  macOS, IL2CPP, Android, iOS, and WebGL builds are not covered by this recipe.

The original source under this directory is MIT licensed; that license does
**not** license, activate, or redistribute Unity Editor or its modules. The
operator must separately satisfy Unity's terms and licensing requirements.
Neither build script installs editors/modules, configures authentication, nor
supplies license credentials.

Version-specific references: [editor release](https://unity.com/releases/editor/whats-new/2022.3.62f1),
[batch command-line arguments](https://docs.unity3d.com/2022.3/Documentation/Manual/EditorCommandLineArguments.html),
and [license management](https://docs.unity3d.com/2022.3/Documentation/Manual/ManagingYourUnityLicense.html).

`Packages/manifest.json` declares only editor-supplied IMGUI and JSONSerialize
builtin modules at `1.0.0`. `packages-lock.json` records those intended builtin
entries; it is source metadata, not evidence that an editor resolved/imported
them here. Those module versions are not the engine version. There is no
verified package-CVE claim or bundled SPDX SBOM; any later dependency inventory
must use SPDX and distinguish declared, recorded, and content-observed data.

## Explicit headless build

Use a **fresh isolated checkout**. Set `UNITY_EDITOR` to an absolute executable
path for the already installed/activated editor, then, from this directory:

```powershell
$env:UNITY_EDITOR = "C:\Program Files\Unity\Hub\Editor\2022.3.62f1\Editor\Unity.exe"
python build.py
```

```bash
export UNITY_EDITOR=/opt/unity/Editor/Unity
python3 build.py
```

These are instructions, not a claim that either installation exists. The
wrapper invokes an argv array (no shell), with a 900-second timeout:

```text
<editor> -batchmode -nographics -quit -projectPath <absolute-project-root>
  -buildTarget Linux64 -executeMethod AppSecCorpus.Editor.CorpusBuild.Build
  -corpusBuildOutput <absolute-project-root>/build/Case095.x86_64
  -logFile <absolute-project-root>/build/unity-editor.log
```

`CorpusBuild.Build` verifies the running editor version, target-module support,
and the single enabled scene, sets Mono explicitly, and calls the real
`BuildPipeline.BuildPlayer`. It exits nonzero and logs the exception on failure.
It refuses an output path other than the fixture's player path. Existing player
or data output is rejected rather than reused or deleted. The wrapper also
rejects symlinked output. On Windows, path arguments use native separators.

Expected real outputs include nonempty `build/Case095.x86_64` and
`build/Case095_Data/Managed/Assembly-CSharp.dll`, plus Unity's supporting player
files and `build/unity-editor.log`. No outputs, generated IDE projects, editor
caches, or fabricated coverage reports are committed. A successful wrapper
return is not a compiler-capture receipt or a deployment claim.

An appsec-review run-owned copy may use the approved custom method with
`APPSEC_UNITY_OUTPUT` instead of `-corpusBuildOutput`, configured
`output_path = "build/Case095.x86_64"`, `editor_version = "2022.3.62f1"`,
`target = "StandaloneLinux64"`, `architecture = "x86_64"`,
`scripting_backend = "Mono"`, and `modules = ["StandaloneLinux64"]`. Review
execution remains separately opt-in and requires real provisioned capabilities,
preflight, and receipt evidence. This fixture supplies no container image,
image digest, license-ready assertion, or generated receipt.

## Separate test tiers

From the repository root, Python wrapper/descriptor **unit tests** use temporary
files and mocked subprocesses only:

```powershell
python -m unittest scripts.tests.test_unity_build scripts.tests.test_unity_matrix -v
python scripts\validate-matrix.py
```

The package-free .NET 8 **unit harness** compiles the exact `ProfileRules.cs`
used by the player, with package sources disabled:

```powershell
dotnet run --project scripts\tests\unit\UnityCoreTests\UnityCoreTests.csproj --configuration Release
```

That project is a standalone test harness, not a generated Unity IDE project.
On Windows PowerShell 5.1, the preinstalled .NET Framework compiler can instead
compile the same two source files and run the same eight assertions without
installing a .NET SDK:

```powershell
powershell -NoProfile -File scripts\tests\unit\UnityCoreTests\run.ps1
```

The temporary unit executable is removed even on failure. This route verifies
the shared rules against .NET Framework, not the .NET 8 harness project.
Neither unit tier proves that Unity imported assets, compiled the full scene,
or produced a player.

The following **integration** and **acceptance** commands are authored opt-in
checks and must not run as part of unit validation:

```powershell
$env:RUN_UNITY_INTEGRATION = "1"
python -m unittest discover -s scripts\tests\integration -p test_unity_editor.py -v
```

The integration tier invokes the actual editor build through `build.py`, so it
requires explicit approval, a clean output directory, and all licensed
toolchain prerequisites. Acceptance inspects those real build outputs without
launching the player:

```powershell
$env:RUN_UNITY_ACCEPTANCE = "1"
python -m unittest discover -s scripts\tests\acceptance -p test_unity_player.py -v
```

For Bash, use `/` separators and `RUN_UNITY_INTEGRATION=1 python3 ...` or
`RUN_UNITY_ACCEPTANCE=1 python3 ...` for the corresponding command.
**No Unity editor build or integration/acceptance run is asserted by these
source files.** Only actual execution and its output evidence can establish
build success.
