# case-083

Small CMake C console program (`src/main.c`) that copies its first argument
into a label and prints it. `lcov.info` is a recorded LCOV coverage fixture for
`src/main.c`; it is corpus data, not the output of a live test run.

Build: `cmake -S . -B build && cmake --build build`.
