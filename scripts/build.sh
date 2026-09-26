#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

for case_dir in projects/cpp/case-*; do
  if [[ -f "$case_dir/CMakeLists.txt" ]]; then
    cmake -S "$case_dir" -B "$case_dir/build"
    cmake --build "$case_dir/build"
  elif [[ -f "$case_dir/configure.ac" ]]; then
    (cd "$case_dir" && autoreconf -fi && ./configure && make)
  elif [[ -f "$case_dir/Makefile" ]]; then
    make -C "$case_dir"
  fi
done

for case_dir in projects/rust/case-*; do
  cargo build --manifest-path "$case_dir/Cargo.toml"
done

for case_dir in projects/go/case-*; do
  (cd "$case_dir" && go build ./...)
done

for case_dir in projects/javascript/case-*; do
  if [[ -f "$case_dir/package.json" ]]; then
    (cd "$case_dir" && npm install && npm run build)
  else
    node --check "$case_dir/index.js"
  fi
done

for case_dir in projects/typescript/case-*; do
  (cd "$case_dir" && npm install && npm run build)
done

for case_dir in projects/dotnet/case-*; do
  dotnet build "$case_dir"
done

for case_dir in projects/java/case-*; do
  if [[ -f "$case_dir/pom.xml" ]]; then
    (cd "$case_dir" && mvn -q -DskipTests package)
  else
    javac "$case_dir"/src/*.java
  fi
done

for file in projects/php/case-*/*.php; do
  php -l "$file"
done

for file in projects/bash/case-*/*.sh projects/php/case-*/*.sh; do
  [[ -e "$file" ]] && bash -n "$file"
done

if command -v pwsh >/dev/null 2>&1; then
  for file in projects/powershell/case-*/*.ps1; do
    pwsh -NoProfile -Command "\$tokens=\$null; \$errors=\$null; [System.Management.Automation.Language.Parser]::ParseFile('$file', [ref]\$tokens, [ref]\$errors) | Out-Null; if (\$errors.Count -gt 0) { \$errors | ForEach-Object { Write-Error \$_ }; exit 1 }"
  done
else
  echo "pwsh not found; skipping PowerShell parse checks"
fi
