#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$root/build"
kotlinc "$root/src/main/kotlin/Case084.kt" \
  -language-version 2.0 -api-version 2.0 \
  -include-runtime -d "$root/build/case-084.jar"
