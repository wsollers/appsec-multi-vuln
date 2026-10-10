# case-085

Python package with a real CPython C-extension build. The extension contains an
intentional `strcpy` pattern (CWE-120).

Build: `python3 -m pip wheel . --no-deps --wheel-dir dist`.
