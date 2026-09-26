#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

for case_dir in projects/cpp/case-*; do
  cmake -S "$case_dir" -B "$case_dir/build"
  cmake --build "$case_dir/build"
done

for case_dir in projects/rust/case-*; do
  cargo build --manifest-path "$case_dir/Cargo.toml"
done

for case_dir in projects/go/case-*; do
  (cd "$case_dir" && go build ./...)
done

for case_dir in projects/javascript/case-*; do
  node --check "$case_dir/index.js"
done

for case_dir in projects/typescript/case-*; do
  (cd "$case_dir" && npm install && npm run build)
done

for case_dir in projects/dotnet/case-*; do
  dotnet build "$case_dir"
done

for case_dir in projects/java/case-*; do
  javac "$case_dir"/src/*.java
done

php -l projects/php/case-018/index.php
bash -n projects/bash/case-019/run.sh
pwsh -NoProfile -File projects/powershell/case-020/run.ps1 "1+1" >/dev/null
