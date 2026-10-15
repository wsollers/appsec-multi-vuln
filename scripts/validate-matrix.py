#!/usr/bin/env python3
import json
from pathlib import Path, PurePosixPath

root = Path(__file__).resolve().parent.parent
matrix_path = root / "support" / "project-matrix.json"
data = json.loads(matrix_path.read_text(encoding="utf-8"))
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
print(f"validated {len(seen)} project matrix entries and {len(report_paths)} coverage artifacts")
