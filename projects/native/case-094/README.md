# case-094

Small CMake C++ console program. `src/main.cpp` takes a command name and a
value from its two arguments and passes the value to the matching routine in
`src/`: text copies and printing, note records, a key table lookup, block
buffers, an `echo` call, and an access check.

Build: `cmake -S . -B build && cmake --build build`.
