#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

projects/native/case-083/build/case083 sample >/dev/null
cargo run --quiet --manifest-path projects/rust/case-006/Cargo.toml -- demo >/dev/null
(cd projects/go/case-008 && go run . sample >/dev/null)
node projects/javascript/case-010/index.js "1 + 1" >/dev/null
node projects/typescript/case-013/dist/index.js '{"name":"demo"}' >/dev/null
dotnet run --project projects/dotnet/case-014 -- "echo sample" >/dev/null
java -cp projects/java/case-016/src Main sample >/dev/null
php projects/php/case-018/index.php home >/dev/null
python3 projects/python/case-074/main.py sample >/dev/null
bash projects/bash/case-019/run.sh "printf sample" >/dev/null
if command -v pwsh >/dev/null 2>&1; then
  pwsh -NoProfile -File projects/powershell/case-020/run.ps1 "1+1" >/dev/null
fi
python3 scripts/validate-matrix.py
