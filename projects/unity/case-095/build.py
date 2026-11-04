#!/usr/bin/env python3
"""Explicit, opt-in local Unity player build; never installs or licenses Unity."""
import os
from pathlib import Path
import subprocess
import sys

EDITOR_VERSION = "2022.3.62f1"
BUILD_METHOD = "AppSecCorpus.Editor.CorpusBuild.Build"
PROJECT_ROOT = Path(__file__).resolve().parent


def build_command(editor, project_root=PROJECT_ROOT):
    root = Path(project_root).resolve()
    return [
        str(editor), "-batchmode", "-nographics", "-quit",
        "-projectPath", str(root), "-buildTarget", "Linux64",
        "-executeMethod", BUILD_METHOD,
        "-corpusBuildOutput", str(root / "build" / "Case095.x86_64"),
        "-logFile", str(root / "build" / "unity-editor.log"),
    ]


def main():
    editor_value = os.environ.get("UNITY_EDITOR", "")
    editor = Path(editor_value)
    if not editor_value or not editor.is_absolute() or not editor.is_file():
        print("UNITY_EDITOR must name an absolute, existing Unity editor executable.", file=sys.stderr)
        return 2
    try:
        version_file = PROJECT_ROOT / "ProjectSettings" / "ProjectVersion.txt"
        if version_file.read_text(encoding="utf-8").strip() != f"m_EditorVersion: {EDITOR_VERSION}":
            print(f"ProjectVersion.txt must pin Unity {EDITOR_VERSION}.", file=sys.stderr)
            return 2
        build_dir = PROJECT_ROOT / "build"
        player = build_dir / "Case095.x86_64"
        data_dir = build_dir / "Case095_Data"
        if build_dir.is_symlink() or player.exists() or player.is_symlink() or data_dir.exists() or data_dir.is_symlink():
            print("Refusing existing or symlinked player output; use a fresh isolated checkout.", file=sys.stderr)
            return 2
        build_dir.mkdir(exist_ok=True)
    except OSError as error:
        print(f"Unity build setup failed: {error}", file=sys.stderr)
        return 2
    try:
        result = subprocess.run(build_command(editor), check=False, timeout=900)
    except (OSError, subprocess.TimeoutExpired) as error:
        print(f"Unity editor invocation failed: {error}; see build/unity-editor.log.", file=sys.stderr)
        return 1
    if result.returncode != 0:
        print(f"Unity editor exited {result.returncode}; see build/unity-editor.log.", file=sys.stderr)
        return 1
    assembly = data_dir / "Managed" / "Assembly-CSharp.dll"
    try:
        for artifact in (player, assembly):
            if artifact.is_symlink() or not artifact.is_file() or artifact.stat().st_size == 0:
                print(f"Unity did not produce a nonempty regular artifact: {artifact}", file=sys.stderr)
                return 1
        if data_dir.is_symlink() or assembly.parent.is_symlink():
            print("Unity output data directories must not be symlinks.", file=sys.stderr)
            return 1
    except OSError as error:
        print(f"Unity output inspection failed: {error}", file=sys.stderr)
        return 1
    print(f"Unity player build completed: {player}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
