#!/usr/bin/env python3
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
matrix_path = root / "support" / "project-matrix.json"
data = json.loads(matrix_path.read_text(encoding="utf-8"))
required = {
    "path", "project_type", "language", "build_command", "capture_policy",
    "compiler_artifact", "codeql", "vulnerability_ids", "expected_applicability",
}
seen = set()
for project in data["projects"]:
    missing = required - project.keys()
    if missing:
        raise SystemExit(f"{project.get('path', '<unknown>')}: missing {sorted(missing)}")
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
print(f"validated {len(seen)} project matrix entries")
