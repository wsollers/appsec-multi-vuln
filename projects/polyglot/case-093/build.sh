#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$root"
python="${PYTHON:-python3}"

cmake -S . -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
cmake --build build

mvn -q -DskipTests -f apps/jvm/pom.xml package

"$python" -m pip wheel apps/py --no-deps --wheel-dir dist
"$python" -m pip wheel apps/py/ext --no-deps --wheel-dir dist

mkdir -p build/go
(cd apps/go && CGO_ENABLED=1 go build -buildvcs=false -o ../../build/go/gateway ./gateway)
