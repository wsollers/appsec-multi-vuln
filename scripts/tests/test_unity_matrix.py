import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("validate_matrix", ROOT / "scripts" / "validate-matrix.py")
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


class UnityMatrixTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.project = Path(self.temporary.name) / "case-095"
        shutil.copytree(ROOT / "projects" / "unity" / "case-095", self.project,
                        ignore=shutil.ignore_patterns("__pycache__", "build", "Library"))

    def test_committed_unity_descriptors(self):
        VALIDATOR.validate_unity(self.project)

    def test_required_descriptors(self):
        (self.project / "ProjectSettings" / "ProjectSettings.asset").unlink()
        with self.assertRaisesRegex(SystemExit, "missing Unity descriptor"):
            VALIDATOR.validate_unity(self.project)

    def test_exact_release_pin(self):
        (self.project / "ProjectSettings" / "ProjectVersion.txt").write_text("m_EditorVersion: 2022.3\n")
        with self.assertRaisesRegex(SystemExit, "exact release pin"):
            VALIDATOR.validate_unity(self.project)

    def test_recorded_dependency_must_match_declaration(self):
        path = self.project / "Packages" / "packages-lock.json"
        data = json.loads(path.read_text())
        data["dependencies"]["com.unity.modules.imgui"]["version"] = "2.0.0"
        path.write_text(json.dumps(data))
        with self.assertRaisesRegex(SystemExit, "inconsistent builtin dependency"):
            VALIDATOR.validate_unity(self.project)

    def test_no_unrecorded_dependency(self):
        path = self.project / "Packages" / "packages-lock.json"
        path.write_text('{"dependencies": {}}')
        with self.assertRaisesRegex(SystemExit, "dependency names differ"):
            VALIDATOR.validate_unity(self.project)

    def test_metadata_required(self):
        (self.project / "Assets" / "Scripts" / "Case095Panel.cs.meta").unlink()
        with self.assertRaisesRegex(SystemExit, "missing asset metadata"):
            VALIDATOR.validate_unity(self.project)

    def test_unique_guids(self):
        path = self.project / "Assets" / "Scripts" / "Case095Panel.cs.meta"
        path.write_text(path.read_text().replace("09500000000000000000000000000003",
                                                "09500000000000000000000000000002"))
        with self.assertRaisesRegex(SystemExit, "duplicate asset GUID"):
            VALIDATOR.validate_unity(self.project)

    def test_scene_guid_must_match_metadata(self):
        path = self.project / "ProjectSettings" / "EditorBuildSettings.asset"
        path.write_text(path.read_text().replace("09500000000000000000000000000005",
                                                "09500000000000000000000000000009"))
        with self.assertRaisesRegex(SystemExit, "scene GUID"):
            VALIDATOR.validate_unity(self.project)

    def test_enabled_scene_required(self):
        path = self.project / "ProjectSettings" / "EditorBuildSettings.asset"
        path.write_text(path.read_text().replace("enabled: 1", "enabled: 0"))
        with self.assertRaisesRegex(SystemExit, "one enabled Unity scene"):
            VALIDATOR.validate_unity(self.project)

    def test_scene_path_cannot_escape(self):
        path = self.project / "ProjectSettings" / "EditorBuildSettings.asset"
        path.write_text(path.read_text().replace("Assets/Scenes/Case095.unity", "../Case095.unity"))
        with self.assertRaisesRegex(SystemExit, "unsafe path"):
            VALIDATOR.validate_unity(self.project)


if __name__ == "__main__":
    unittest.main()
