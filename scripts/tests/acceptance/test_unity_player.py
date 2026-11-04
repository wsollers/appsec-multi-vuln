"""Opt-in artifact inspection only: this suite never runs Unity or its player."""

import os
from pathlib import Path
import re
import unittest


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
PROJECT_ROOT = REPOSITORY_ROOT.joinpath("projects", "unity", "case-095")


@unittest.skipUnless(
    os.environ.get("RUN_UNITY_ACCEPTANCE") == "1",
    "Set RUN_UNITY_ACCEPTANCE=1 to inspect existing real Unity build artifacts.",
)
class UnityPlayerAcceptanceTests(unittest.TestCase):
    def assert_nonempty_file(self, path):
        self.assertFalse(path.is_symlink(), f"Artifact must not be a symlink: {path}")
        self.assertTrue(path.is_file(), f"Build the fixture first; missing artifact: {path}")
        self.assertGreater(path.stat().st_size, 0, f"Artifact is empty: {path}")

    def test_linux_player_artifact_is_present_and_nonempty(self):
        player = PROJECT_ROOT.joinpath("build", "Case095.x86_64")
        self.assert_nonempty_file(player)
        with player.open("rb") as stream:
            header = stream.read(20)
        self.assertEqual(len(header), 20, "The ELF header must not be truncated.")
        self.assertEqual(header[:5], b"\x7fELF\x02", "Expected a real 64-bit ELF player.")
        self.assertEqual(header[5], 1, "Expected a little-endian Linux player.")
        self.assertEqual(header[18:20], b"\x3e\x00", "Expected an x86-64 player.")

    def test_managed_game_assembly_is_present_and_nonempty(self):
        data = PROJECT_ROOT.joinpath("build", "Case095_Data")
        self.assertFalse(data.is_symlink())
        self.assertFalse(data.joinpath("Managed").is_symlink())
        assembly = data.joinpath("Managed", "Assembly-CSharp.dll")
        self.assert_nonempty_file(assembly)
        content = assembly.read_bytes()
        self.assertEqual(content[:2], b"MZ", "Expected a real managed PE assembly.")
        self.assertIn(b"BSJB", content, "Expected CLR metadata in the managed assembly.")

    def test_project_settings_pin_the_documented_editor_version(self):
        version_file = PROJECT_ROOT.joinpath("ProjectSettings", "ProjectVersion.txt")
        self.assert_nonempty_file(version_file)
        versions = re.findall(
            r"^m_EditorVersion:\s*(\S+)\s*$",
            version_file.read_text(encoding="utf-8"),
            re.MULTILINE,
        )
        self.assertEqual(versions, ["2022.3.62f1"])

    def test_editor_build_settings_are_present(self):
        settings = PROJECT_ROOT.joinpath("ProjectSettings", "EditorBuildSettings.asset")
        self.assert_nonempty_file(settings)
        content = settings.read_text(encoding="utf-8")
        self.assertIn("EditorBuildSettings:", content)
        self.assertIn("m_Scenes:", content)

    def test_editor_build_log_records_success(self):
        log_file = PROJECT_ROOT.joinpath("build", "unity-editor.log")
        self.assert_nonempty_file(log_file)
        log = log_file.read_text(encoding="utf-8", errors="replace").casefold()
        self.assertIn("build", log)
        self.assertIn("succeeded", log, "The existing editor log must report build success.")


if __name__ == "__main__":
    unittest.main()
