# case-083

Small CMake C vulnerability case. `strcpy` in `src/main.c` is an intentional
CWE-120 fixture; do not reuse it in production.

Build: `cmake -S . -B build && cmake --build build`.
