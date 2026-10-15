# case-091

Dependency-free C-to-WebAssembly module exporting `copy_input`, which copies a
caller-supplied buffer into module memory. It pins the source language to C17
and is validated with LLVM/Clang 18.x.

Build: `./build.sh`.
