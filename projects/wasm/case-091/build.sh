#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$root/build"
clang --target=wasm32 -std=c17 -Oz -nostdlib \
  -Wl,--no-entry -Wl,--export=copy_input -Wl,--strip-all \
  -o "$root/build/case091.wasm" "$root/src/case091.c"
