#!/usr/bin/env python3
import json
from pathlib import Path, PurePosixPath
import re

root = Path(__file__).resolve().parent.parent
matrix_path = root / "support" / "project-matrix.json"
fields = {
    "path", "project_type", "language", "build_command", "capture_policy",
    "compiler_artifact", "codeql", "expected_applicability", "coverage_artifacts",
}
coverage_fields = {"path", "format", "provenance", "source_paths"}
coverage_formats = {"lcov", "cobertura", "jacoco", "llvm"}
coverage_provenance = {"fixture"}


def relative_path(value, label):
    """Return a normalized project-relative POSIX path or stop on an unsafe one."""
    if not isinstance(value, str) or not value or "\\" in value:
        raise SystemExit(f"{label}: path must be a non-empty POSIX string")
    path = PurePosixPath(value)
    if path.is_absolute() or any(part in {"", ".", ".."} for part in value.split("/")):
        raise SystemExit(f"{label}: unsafe path {value!r}")
    return path.as_posix()


def validate_coverage(project_path, artifacts, report_paths):
    if not isinstance(artifacts, list):
        raise SystemExit(f"{project_path}: coverage_artifacts must be an array")
    project_dir = (root / project_path).resolve()
    for index, artifact in enumerate(artifacts):
        label = f"{project_path}: coverage_artifacts[{index}]"
        if not isinstance(artifact, dict) or set(artifact) != coverage_fields:
            raise SystemExit(f"{label}: fields must be exactly {sorted(coverage_fields)}")
        if artifact["format"] not in coverage_formats:
            raise SystemExit(f"{label}: unknown format {artifact['format']!r}")
        if artifact["provenance"] not in coverage_provenance:
            raise SystemExit(f"{label}: unknown provenance {artifact['provenance']!r}")
        report = f"{project_path}/{relative_path(artifact['path'], label)}"
        if report in report_paths:
            raise SystemExit(f"{label}: duplicate coverage report path {report}")
        report_paths.add(report)
        report_file = (root / report).resolve()
        if project_dir not in report_file.parents or not report_file.is_file():
            raise SystemExit(f"{label}: report file does not exist inside the project: {report}")
        sources = artifact["source_paths"]
        if not isinstance(sources, list) or not sources:
            raise SystemExit(f"{label}: source_paths must be a non-empty array")
        normalized = [relative_path(source, label) for source in sources]
        if normalized != sorted(set(normalized)):
            raise SystemExit(f"{label}: source_paths must be unique and sorted")
        for source in normalized:
            source_file = (project_dir / source).resolve()
            if project_dir not in source_file.parents or not source_file.is_file():
                raise SystemExit(f"{label}: source path is not a file inside the project: {source}")


def validate_unity(project_dir):
    """Check committed source descriptors, not editor import or compilation."""
    for name in (
        "ProjectSettings/ProjectVersion.txt", "ProjectSettings/ProjectSettings.asset",
        "ProjectSettings/EditorBuildSettings.asset", "Packages/manifest.json",
        "Packages/packages-lock.json", "Assets/Editor/CorpusBuild.cs",
    ):
        if not (project_dir / name).is_file():
            raise SystemExit(f"{project_dir}: missing Unity descriptor {name}")
    version = (project_dir / "ProjectSettings/ProjectVersion.txt").read_text(encoding="utf-8").strip()
    if not re.fullmatch(r"m_EditorVersion: \d{4}\.\d+\.\d+f\d+", version):
        raise SystemExit(f"{project_dir}: Unity editor must have an exact release pin")
    manifest = json.loads((project_dir / "Packages/manifest.json").read_text(encoding="utf-8"))
    lock = json.loads((project_dir / "Packages/packages-lock.json").read_text(encoding="utf-8"))
    dependencies = manifest.get("dependencies")
    recorded = lock.get("dependencies")
    if not isinstance(dependencies, dict) or not dependencies or not isinstance(recorded, dict):
        raise SystemExit(f"{project_dir}: Unity dependency maps must be nonempty objects")
    if set(dependencies) != set(recorded):
        raise SystemExit(f"{project_dir}: declared and recorded builtin dependency names differ")
    for name, version in dependencies.items():
        entry = recorded[name]
        if (
            not name.startswith("com.unity.modules.") or version != "1.0.0"
            or not isinstance(entry, dict) or entry.get("version") != version
            or entry.get("source") != "builtin" or entry.get("depth") != 0
            or entry.get("dependencies") != {}
        ):
            raise SystemExit(f"{project_dir}: inconsistent builtin dependency {name}")
    assets = project_dir / "Assets"
    guids = set()
    for asset in assets.rglob("*"):
        if asset.suffix == ".meta":
            continue
        meta = Path(str(asset) + ".meta")
        if not meta.is_file():
            raise SystemExit(f"{project_dir}: missing asset metadata for {asset.name}")
        match = re.search(r"^guid: ([0-9a-f]{32})$", meta.read_text(encoding="utf-8"), re.MULTILINE)
        if not match or match[1] in guids:
            raise SystemExit(f"{project_dir}: invalid or duplicate asset GUID for {asset.name}")
        guids.add(match[1])
    settings = (project_dir / "ProjectSettings/EditorBuildSettings.asset").read_text(encoding="utf-8")
    scenes = re.findall(r"- enabled: 1\s+path: ([^\r\n]+)\s+guid: ([0-9a-f]{32})", settings)
    if len(scenes) != 1:
        raise SystemExit(f"{project_dir}: exactly one enabled Unity scene is required")
    scene_path, scene_guid = scenes[0]
    normalized = relative_path(scene_path, str(project_dir))
    scene = (project_dir / normalized).resolve()
    if assets.resolve() not in scene.parents or not scene.is_file() or scene.suffix != ".unity":
        raise SystemExit(f"{project_dir}: enabled scene must exist inside Assets")
    if f"guid: {scene_guid}\n" not in Path(str(scene) + ".meta").read_text(encoding="utf-8"):
        raise SystemExit(f"{project_dir}: enabled scene GUID does not match metadata")


def main():
    data = json.loads(matrix_path.read_text(encoding="utf-8"))
    seen = set()
    report_paths = set()
    for project in data["projects"]:
        missing = fields - project.keys()
        if missing:
            raise SystemExit(f"{project.get('path', '<unknown>')}: missing {sorted(missing)}")
        unknown = project.keys() - fields
        if unknown:
            raise SystemExit(f"{project['path']}: unknown fields {sorted(unknown)}")
        path = project["path"]
        if path in seen:
            raise SystemExit(f"duplicate project path: {path}")
        seen.add(path)
        if project["capture_policy"] not in {"required", "auto", "disabled"}:
            raise SystemExit(f"{path}: invalid capture policy")
        if not (root / path).is_dir():
            raise SystemExit(f"{path}: directory does not exist")
        if not project["build_command"].strip():
            raise SystemExit(f"{path}: empty build command")
        validate_coverage(path, project["coverage_artifacts"], report_paths)
        if project["project_type"] == "unity-player":
            validate_unity(root / path)
    print(f"validated {len(seen)} project matrix entries and {len(report_paths)} coverage artifacts")


if __name__ == "__main__":
    main()
