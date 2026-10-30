from pathlib import Path

from setuptools import Extension, setup

CORE = Path(__file__).resolve().parents[3] / "native" / "core"

setup(
    ext_modules=[
        Extension(
            "c093ext",
            sources=["src/c093ext.c", str(CORE / "src" / "record.c")],
            include_dirs=[str(CORE / "include")],
        )
    ]
)
