"""Unit tests for the Unity wrapper; all editor processes and outputs are synthetic."""

import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import tempfile
import unittest
from unittest import mock


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
BUILD_SCRIPT = REPOSITORY_ROOT.joinpath("projects", "unity", "case-095", "build.py")
EDITOR_VERSION = "2022.3.62f1"
BUILD_METHOD = "AppSecCorpus.Editor.CorpusBuild.Build"


def load_build_module():
    spec = importlib.util.spec_from_file_location("unity_case095_build_tests", BUILD_SCRIPT)
    if spec is None or spec.loader is None:
        raise AssertionError(f"Cannot import the Unity build wrapper: {BUILD_SCRIPT}")
    module = importlib.util.module_from_spec(spec)
    with (
        mock.patch("subprocess.run") as run,
        mock.patch("subprocess.Popen") as popen,
        mock.patch("os.system") as system,
        mock.patch("sys.dont_write_bytecode", True),
    ):
        spec.loader.exec_module(module)
    run.assert_not_called()
    popen.assert_not_called()
    system.assert_not_called()
    return module


class UnityBuildImportTests(unittest.TestCase):
    def test_import_has_no_process_or_console_side_effects(self):
        stdout = io.StringIO()
        stderr = io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            module = load_build_module()
        self.assertEqual(stdout.getvalue(), "")
        self.assertEqual(stderr.getvalue(), "")
        self.assertEqual(module.EDITOR_VERSION, EDITOR_VERSION)
        self.assertEqual(module.BUILD_METHOD, BUILD_METHOD)
        self.assertEqual(module.PROJECT_ROOT, BUILD_SCRIPT.parent)


class UnityBuildCommandTests(unittest.TestCase):
    def setUp(self):
        self.module = load_build_module()

    def test_documented_arguments_are_a_list_without_a_shell(self):
        editor = str(REPOSITORY_ROOT.joinpath("Synthetic Editor", "Unity"))
        root = REPOSITORY_ROOT.joinpath("Synthetic Unity Project")
        command = self.module.build_command(editor, root)
        self.assertIsInstance(command, list)
        self.assertTrue(all(isinstance(argument, str) for argument in command))
        self.assertEqual(
            command,
            [
                editor,
                "-batchmode",
                "-nographics",
                "-quit",
                "-projectPath",
                str(root.resolve()),
                "-buildTarget",
                "Linux64",
                "-executeMethod",
                BUILD_METHOD,
                "-corpusBuildOutput",
                str(root.joinpath("build", "Case095.x86_64").resolve()),
                "-logFile",
                str(root.joinpath("build", "unity-editor.log").resolve()),
            ],
        )

    def test_relative_project_path_becomes_absolute(self):
        command = self.module.build_command("synthetic-editor", Path("Synthetic Unity Project"))
        for flag in ("-projectPath", "-corpusBuildOutput", "-logFile"):
            with self.subTest(flag=flag):
                path = Path(command[command.index(flag) + 1])
                self.assertTrue(path.is_absolute())
                self.assertEqual(path, path.resolve())

    def test_spaces_are_preserved_inside_single_arguments(self):
        editor = str(REPOSITORY_ROOT.joinpath("Synthetic Editor With Spaces", "Unity"))
        root = REPOSITORY_ROOT.joinpath("Synthetic Project With Spaces")
        command = self.module.build_command(editor, root)
        self.assertEqual(command[0], editor)
        self.assertEqual(command[command.index("-projectPath") + 1], str(root.resolve()))
        self.assertNotIn(f'"{editor}"', command)
        self.assertNotIn(f'"{root.resolve()}"', command)

    def test_default_project_root_is_the_fixture_directory(self):
        command = self.module.build_command("synthetic-editor")
        self.assertEqual(
            command[command.index("-projectPath") + 1],
            str(BUILD_SCRIPT.parent.resolve()),
        )


class UnityBuildMainTests(unittest.TestCase):
    def setUp(self):
        self.module = load_build_module()
        self.scratch = tempfile.TemporaryDirectory(
            prefix=".unity-unit-", dir=REPOSITORY_ROOT
        )
        self.addCleanup(self.scratch.cleanup)
        self.root = Path(self.scratch.name).joinpath("Synthetic Unity Project")
        self.root.mkdir()
        self.editor = Path(self.scratch.name).joinpath("Synthetic Editor", "Unity")
        self.editor.parent.mkdir()
        self.editor.write_text("Synthetic editor placeholder; never executed.\n", encoding="utf-8")
        self.editor.chmod(0o700)
        self.version_file = self.root.joinpath("ProjectSettings", "ProjectVersion.txt")
        self.version_file.parent.mkdir()
        self.version_file.write_text(
            f"m_EditorVersion: {EDITOR_VERSION}\n", encoding="utf-8"
        )
        self.build_directory = self.root.joinpath("build")
        self.player = self.build_directory.joinpath("Case095.x86_64")
        self.assembly = self.build_directory.joinpath(
            "Case095_Data", "Managed", "Assembly-CSharp.dll"
        )
        self.command = self.module.build_command(str(self.editor), self.root)
        self.stack = contextlib.ExitStack()
        self.addCleanup(self.stack.close)
        self.stack.enter_context(mock.patch.object(self.module, "PROJECT_ROOT", self.root))
        self.command_mock = self.stack.enter_context(
            mock.patch.object(self.module, "build_command", return_value=self.command)
        )
        self.run = self.stack.enter_context(mock.patch("subprocess.run"))
        self.run.return_value = subprocess.CompletedProcess(self.command, 0)
        self.popen = self.stack.enter_context(mock.patch("subprocess.Popen"))
        self.system = self.stack.enter_context(mock.patch("os.system"))
        self.stack.enter_context(
            mock.patch.dict(os.environ, {"UNITY_EDITOR": str(self.editor)}, clear=True)
        )
        self.set_synthetic_editor_outputs()

    def invoke_main(self):
        stdout = io.StringIO()
        stderr = io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            result = self.module.main()
        self.assertIsInstance(result, int)
        self.popen.assert_not_called()
        self.system.assert_not_called()
        return result, stderr.getvalue()

    def assert_rejected(self, diagnostic=None, before_process=False):
        result, stderr = self.invoke_main()
        self.assertEqual(result, 2 if before_process else 1)
        self.assertTrue(stderr.strip(), "Failures must explain the next action on stderr.")
        if diagnostic:
            self.assertIn(diagnostic.casefold(), stderr.casefold())
        if before_process:
            self.run.assert_not_called()

    def write_synthetic_outputs(self):
        self.assembly.parent.mkdir(parents=True, exist_ok=True)
        self.player.write_bytes(b"SYNTHETIC UNIT TEST PLAYER; NOT AN EXECUTABLE\n")
        self.assembly.write_bytes(b"SYNTHETIC UNIT TEST ASSEMBLY; NOT A REAL DLL\n")

    def set_synthetic_editor_outputs(self, mutate=None):
        def synthetic_editor_run(*args, **kwargs):
            self.write_synthetic_outputs()
            if mutate is not None:
                mutate()
            return subprocess.CompletedProcess(self.command, 0)

        self.run.side_effect = synthetic_editor_run

    def test_missing_editor_environment_is_rejected_without_a_process(self):
        del os.environ["UNITY_EDITOR"]
        self.assert_rejected("UNITY_EDITOR", before_process=True)

    def test_empty_editor_environment_is_rejected_without_a_process(self):
        os.environ["UNITY_EDITOR"] = ""
        self.assert_rejected("UNITY_EDITOR", before_process=True)

    def test_relative_editor_path_is_rejected_without_a_process(self):
        os.environ["UNITY_EDITOR"] = str(Path("Synthetic Editor").joinpath("Unity"))
        self.assert_rejected(before_process=True)

    def test_nonexistent_editor_is_rejected_without_a_process(self):
        os.environ["UNITY_EDITOR"] = str(self.editor.parent.joinpath("missing-Unity"))
        self.assert_rejected(before_process=True)

    def test_editor_directory_is_rejected_without_a_process(self):
        os.environ["UNITY_EDITOR"] = str(self.editor.parent)
        self.assert_rejected(before_process=True)

    def test_missing_project_version_is_rejected_without_a_process(self):
        self.version_file.unlink()
        self.assert_rejected(before_process=True)

    def test_wrong_project_version_is_rejected_without_a_process(self):
        self.version_file.write_text("m_EditorVersion: 2021.3.0f1\n", encoding="utf-8")
        self.assert_rejected(EDITOR_VERSION, before_process=True)

    def test_version_prefix_is_not_an_exact_version_match(self):
        self.version_file.write_text(
            f"m_EditorVersion: {EDITOR_VERSION}0\n", encoding="utf-8"
        )
        self.assert_rejected(EDITOR_VERSION, before_process=True)

    def test_malformed_project_version_is_rejected_without_a_process(self):
        self.version_file.write_text(f"unrelated: {EDITOR_VERSION}\n", encoding="utf-8")
        self.assert_rejected(before_process=True)

    def test_build_directory_is_created_before_editor_invocation(self):
        def synthetic_editor_run(*args, **kwargs):
            self.assertTrue(self.build_directory.is_dir())
            self.write_synthetic_outputs()
            return subprocess.CompletedProcess(self.command, 0)

        self.run.side_effect = synthetic_editor_run
        result, _ = self.invoke_main()
        self.assertEqual(result, 0)
        self.run.assert_called_once()

    def test_editor_runs_with_argv_checked_timeout_and_no_shell(self):
        result, _ = self.invoke_main()
        self.assertEqual(result, 0)
        self.command_mock.assert_called_once()
        self.run.assert_called_once_with(self.command, check=False, timeout=900)

    def test_editor_timeout_is_reported_as_failure(self):
        self.run.side_effect = subprocess.TimeoutExpired(self.command, 900)
        self.assert_rejected()
        self.run.assert_called_once()

    def test_editor_launch_error_is_reported_as_failure(self):
        self.run.side_effect = OSError("Synthetic editor launch failure")
        self.assert_rejected()
        self.run.assert_called_once()

    def test_nonzero_editor_exit_is_reported_as_failure(self):
        self.run.side_effect = None
        self.run.return_value = subprocess.CompletedProcess(self.command, 7)
        self.assert_rejected()
        self.run.assert_called_once()

    def test_existing_player_is_rejected_without_deleting_it_or_running_editor(self):
        self.build_directory.mkdir()
        self.player.write_bytes(b"SYNTHETIC PREEXISTING PLAYER\n")
        self.assert_rejected(before_process=True)
        self.assertEqual(self.player.read_bytes(), b"SYNTHETIC PREEXISTING PLAYER\n")

    def test_existing_data_directory_is_rejected_without_running_editor(self):
        self.assembly.parent.mkdir(parents=True)
        self.assert_rejected(before_process=True)
        self.assertTrue(self.assembly.parent.is_dir())

    def test_existing_outputs_are_rejected_and_preserved_without_running_editor(self):
        self.write_synthetic_outputs()
        player_content = self.player.read_bytes()
        assembly_content = self.assembly.read_bytes()
        self.assert_rejected(before_process=True)
        self.assertEqual(self.player.read_bytes(), player_content)
        self.assertEqual(self.assembly.read_bytes(), assembly_content)

    def test_existing_empty_build_directory_is_allowed(self):
        self.build_directory.mkdir()
        result, stderr = self.invoke_main()
        self.assertEqual(result, 0, stderr)
        self.run.assert_called_once()

    def test_symlinked_build_directory_is_rejected_before_editor(self):
        original_is_symlink = Path.is_symlink
        with mock.patch.object(
            Path,
            "is_symlink",
            autospec=True,
            side_effect=lambda path: path == self.build_directory or original_is_symlink(path),
        ):
            self.assert_rejected(before_process=True)

    def test_dangling_output_symlinks_are_rejected_before_editor(self):
        original_is_symlink = Path.is_symlink
        for artifact in (self.player, self.build_directory.joinpath("Case095_Data")):
            with self.subTest(artifact=artifact.name), mock.patch.object(
                Path,
                "is_symlink",
                autospec=True,
                side_effect=lambda path: path == artifact or original_is_symlink(path),
            ):
                self.assert_rejected(before_process=True)

    def test_setup_read_error_is_reported_without_running_editor(self):
        with mock.patch.object(Path, "read_text", side_effect=OSError("Synthetic read failure")):
            self.assert_rejected(before_process=True)

    def test_build_directory_creation_error_is_reported_without_running_editor(self):
        with mock.patch.object(Path, "mkdir", side_effect=OSError("Synthetic mkdir failure")):
            self.assert_rejected(before_process=True)

    def test_successful_editor_without_player_is_a_failure(self):
        self.set_synthetic_editor_outputs(self.player.unlink)
        self.assert_rejected("Case095.x86_64")

    def test_empty_player_is_a_failure(self):
        self.set_synthetic_editor_outputs(lambda: self.player.write_bytes(b""))
        self.assert_rejected("Case095.x86_64")

    def test_successful_editor_without_managed_assembly_is_a_failure(self):
        self.set_synthetic_editor_outputs(self.assembly.unlink)
        self.assert_rejected("Assembly-CSharp.dll")

    def test_empty_managed_assembly_is_a_failure(self):
        self.set_synthetic_editor_outputs(lambda: self.assembly.write_bytes(b""))
        self.assert_rejected("Assembly-CSharp.dll")

    def test_artifact_directories_are_not_accepted_as_regular_files(self):
        for artifact in (self.player, self.assembly):
            with self.subTest(artifact=artifact.name):
                def replace_with_directory():
                    artifact.unlink()
                    artifact.mkdir()

                self.set_synthetic_editor_outputs(replace_with_directory)
                self.assert_rejected(artifact.name)
                artifact.rmdir()
                self.player.unlink(missing_ok=True)
                self.assembly.unlink(missing_ok=True)
                for directory in (
                    self.assembly.parent,
                    self.assembly.parent.parent,
                    self.build_directory,
                ):
                    if directory.exists():
                        directory.rmdir()
                self.run.reset_mock()

    def test_symlinked_outputs_are_rejected_after_editor(self):
        original_is_symlink = Path.is_symlink
        for artifact in (
            self.player,
            self.assembly,
            self.build_directory.joinpath("Case095_Data"),
            self.assembly.parent,
        ):
            with self.subTest(artifact=artifact.name), mock.patch.object(
                Path,
                "is_symlink",
                autospec=True,
                side_effect=lambda path: (
                    (self.run.called and path == artifact) or original_is_symlink(path)
                ),
            ):
                self.assert_rejected()
                self.player.unlink()
                self.assembly.unlink()
                self.assembly.parent.rmdir()
                self.assembly.parent.parent.rmdir()
                self.build_directory.rmdir()
                self.run.reset_mock()

    def test_output_inspection_error_is_reported_as_failure(self):
        original_stat = Path.stat

        def synthetic_stat(path, *args, **kwargs):
            if self.run.called and path == self.player:
                raise OSError("Synthetic output inspection failure")
            return original_stat(path, *args, **kwargs)

        with mock.patch.object(Path, "stat", autospec=True, side_effect=synthetic_stat):
            self.assert_rejected()

    def test_synthetic_nonempty_outputs_and_zero_exit_succeed(self):
        result, stderr = self.invoke_main()
        self.assertEqual(result, 0, stderr)
        self.run.assert_called_once()


class UnityFixtureMetadataTests(unittest.TestCase):
    project_root = BUILD_SCRIPT.parent

    def read_guid(self, meta):
        self.assertTrue(meta.is_file(), f"Missing Unity metadata: {meta}")
        guids = re.findall(
            r"^guid:\s*([0-9a-fA-F]{32})\s*$",
            meta.read_text(encoding="utf-8"),
            re.MULTILINE,
        )
        self.assertEqual(len(guids), 1, f"Expected one 32-hex GUID in {meta}")
        return guids[0].casefold()

    def enabled_scenes(self):
        settings = self.project_root.joinpath("ProjectSettings", "EditorBuildSettings.asset")
        scenes = re.findall(
            r"^\s*-\s*enabled:\s*1\s*\n"
            r"\s*path:\s*([^\r\n]+)\s*\n"
            r"\s*guid:\s*([0-9a-fA-F]{32})\s*$",
            settings.read_text(encoding="utf-8"),
            re.MULTILINE,
        )
        self.assertTrue(scenes, "The fixture must enable a scene in EditorBuildSettings.")
        return scenes

    def test_builtin_package_manifests_agree_without_external_packages(self):
        packages = self.project_root.joinpath("Packages")
        manifest = json.loads(packages.joinpath("manifest.json").read_text(encoding="utf-8"))
        lock = json.loads(packages.joinpath("packages-lock.json").read_text(encoding="utf-8"))
        self.assertEqual(set(manifest), {"dependencies"})
        self.assertEqual(set(lock), {"dependencies"})
        dependencies = manifest["dependencies"]
        self.assertTrue(dependencies)
        self.assertEqual(set(dependencies), set(lock["dependencies"]))
        for package, version in dependencies.items():
            with self.subTest(package=package):
                self.assertTrue(package.startswith("com.unity.modules."))
                self.assertRegex(version, r"^\d+\.\d+\.\d+$")
                self.assertEqual(
                    lock["dependencies"][package],
                    {
                        "version": version,
                        "depth": 0,
                        "source": "builtin",
                        "dependencies": {},
                    },
                )

    def test_project_pins_the_exact_documented_editor_version(self):
        version_file = self.project_root.joinpath("ProjectSettings", "ProjectVersion.txt")
        self.assertEqual(
            version_file.read_text(encoding="utf-8").strip(),
            f"m_EditorVersion: {EDITOR_VERSION}",
        )

    def test_enabled_scene_guid_matches_its_scene_metadata(self):
        for scene_path, guid in self.enabled_scenes():
            with self.subTest(scene=scene_path):
                relative = PurePosixPath(scene_path.strip())
                self.assertFalse(relative.is_absolute())
                self.assertNotIn("..", relative.parts)
                self.assertEqual(relative.parts[0], "Assets")
                scene = self.project_root.joinpath(*relative.parts)
                self.assertTrue(scene.is_file())
                self.assertEqual(scene.suffix, ".unity")
                self.assertEqual(self.read_guid(scene.with_suffix(".unity.meta")), guid.casefold())

    def test_scene_script_guids_resolve_to_metadata_and_include_the_panel(self):
        scripts = self.project_root.joinpath("Assets", "Scripts")
        panel_guid = self.read_guid(scripts.joinpath("Case095Panel.cs.meta"))
        script_guids = {
            self.read_guid(meta)
            for meta in self.project_root.joinpath("Assets").rglob("*.cs.meta")
        }
        for scene_path, _ in self.enabled_scenes():
            scene = self.project_root.joinpath(*PurePosixPath(scene_path.strip()).parts)
            guids = {
                guid.casefold()
                for guid in re.findall(
                    r"m_Script:\s*\{[^}\r\n]*\bguid:\s*([0-9a-fA-F]{32})\b",
                    scene.read_text(encoding="utf-8"),
                )
            }
            with self.subTest(scene=scene_path):
                self.assertIn(panel_guid, guids)
                self.assertTrue(guids.issubset(script_guids))

    def test_assets_and_folders_have_metadata_with_unique_guids(self):
        assets = self.project_root.joinpath("Assets")
        self.assertTrue(assets.is_dir())
        required = [
            path
            for path in assets.rglob("*")
            if path.is_dir() or path.suffix in {".cs", ".unity"}
        ]
        self.assertTrue(required)
        for asset in required:
            with self.subTest(asset=str(asset.relative_to(assets))):
                meta = asset.with_name(asset.name + ".meta")
                self.read_guid(meta)
                if asset.is_dir():
                    self.assertRegex(
                        meta.read_text(encoding="utf-8"), r"(?m)^folderAsset:\s*yes\s*$"
                    )
        metadata = list(assets.rglob("*.meta"))
        guids = [self.read_guid(meta) for meta in metadata]
        self.assertEqual(len(guids), len(set(guids)), "Unity asset GUIDs must be unique.")

    def test_unity_matrix_entry_uses_only_the_existing_closed_schema(self):
        matrix = json.loads(
            REPOSITORY_ROOT.joinpath("support", "project-matrix.json").read_text(encoding="utf-8")
        )
        project_path = self.project_root.relative_to(REPOSITORY_ROOT).as_posix()
        entries = [entry for entry in matrix["projects"] if entry["path"] == project_path]
        self.assertEqual(len(entries), 1)
        self.assertEqual(
            set(entries[0]),
            {
                "path",
                "project_type",
                "language",
                "build_command",
                "capture_policy",
                "compiler_artifact",
                "codeql",
                "expected_applicability",
                "coverage_artifacts",
            },
        )
        for artifact in entries[0]["coverage_artifacts"]:
            self.assertEqual(set(artifact), {"path", "format", "provenance", "source_paths"})


if __name__ == "__main__":
    unittest.main()
