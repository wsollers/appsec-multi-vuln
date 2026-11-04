"""Opt-in real-editor integration tests; never selected by the unit-test pattern."""

import os
from pathlib import Path
import subprocess
import sys
import unittest


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
PROJECT_ROOT = REPOSITORY_ROOT.joinpath("projects", "unity", "case-095")
BUILD_SCRIPT = PROJECT_ROOT.joinpath("build.py")


@unittest.skipUnless(
    os.environ.get("RUN_UNITY_INTEGRATION") == "1",
    "Set RUN_UNITY_INTEGRATION=1 and UNITY_EDITOR to opt into real-editor builds.",
)
class UnityEditorIntegrationTests(unittest.TestCase):
    def run_wrapper(self, environment):
        return subprocess.run(
            [sys.executable, str(BUILD_SCRIPT)],
            cwd=str(PROJECT_ROOT),
            env=environment,
            check=False,
            capture_output=True,
            text=True,
            timeout=960,
        )

    def test_configured_editor_builds_real_nonempty_artifacts(self):
        configured_editor = os.environ.get("UNITY_EDITOR", "")
        self.assertTrue(configured_editor, "Set UNITY_EDITOR to the installed Unity executable.")
        editor = Path(configured_editor)
        self.assertTrue(editor.is_absolute(), "UNITY_EDITOR must be an absolute path.")
        self.assertTrue(editor.is_file(), f"UNITY_EDITOR is not an executable file: {editor}")
        for output in (
            PROJECT_ROOT.joinpath("build", "Case095.x86_64"),
            PROJECT_ROOT.joinpath("build", "Case095_Data"),
        ):
            self.assertFalse(
                output.exists() or output.is_symlink(),
                f"Use a fresh isolated checkout; stale output is refused: {output}",
            )
        result = self.run_wrapper(os.environ.copy())
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        for artifact in (
            PROJECT_ROOT.joinpath("build", "Case095.x86_64"),
            PROJECT_ROOT.joinpath(
                "build", "Case095_Data", "Managed", "Assembly-CSharp.dll"
            ),
        ):
            with self.subTest(artifact=artifact.name):
                self.assertFalse(artifact.is_symlink())
                self.assertTrue(artifact.is_file(), f"Missing real build artifact: {artifact}")
                self.assertGreater(artifact.stat().st_size, 0)
        self.assertFalse(PROJECT_ROOT.joinpath("build", "Case095_Data").is_symlink())
        self.assertFalse(
            PROJECT_ROOT.joinpath("build", "Case095_Data", "Managed").is_symlink()
        )
        with PROJECT_ROOT.joinpath("build", "Case095.x86_64").open("rb") as player:
            header = player.read(20)
        self.assertEqual(len(header), 20, "The ELF header must not be truncated.")
        self.assertEqual(header[:5], b"\x7fELF\x02", "Expected a real 64-bit ELF player.")
        self.assertEqual(header[5], 1, "Expected a little-endian Linux player.")
        self.assertEqual(header[18:20], b"\x3e\x00", "Expected an x86-64 player.")
        assembly = PROJECT_ROOT.joinpath(
            "build", "Case095_Data", "Managed", "Assembly-CSharp.dll"
        ).read_bytes()
        self.assertEqual(assembly[:2], b"MZ", "Expected a real managed PE assembly.")
        self.assertIn(b"BSJB", assembly, "Expected CLR metadata in the managed assembly.")
        log_file = PROJECT_ROOT.joinpath("build", "unity-editor.log")
        self.assertFalse(log_file.is_symlink())
        self.assertTrue(log_file.is_file(), "The real editor must produce a build log.")
        self.assertIn(
            "succeeded",
            log_file.read_text(encoding="utf-8", errors="replace").casefold(),
            "The real editor log must report build success.",
        )

    def test_unconfigured_wrapper_returns_nonzero_with_an_actionable_error(self):
        environment = os.environ.copy()
        environment.pop("UNITY_EDITOR", None)
        result = self.run_wrapper(environment)
        self.assertEqual(result.returncode, 2)
        self.assertIn("UNITY_EDITOR", result.stderr)


if __name__ == "__main__":
    unittest.main()
