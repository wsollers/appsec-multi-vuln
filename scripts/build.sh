#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

for case_dir in projects/native/case-*; do
  cmake -S "$case_dir" -B "$case_dir/build"
  cmake --build "$case_dir/build"
done

if [[ "${INCLUDE_CALIBRATION:-0}" == "1" ]]; then
  (cd projects/native/linux-calibration && cmake --preset baseline && cmake --build --preset baseline)
fi

for case_dir in projects/rust/case-*; do cargo build --manifest-path "$case_dir/Cargo.toml"; done
for case_dir in projects/go/case-*; do (cd "$case_dir" && go build ./...); done

for case_dir in projects/javascript/case-*; do
  if [[ -f "$case_dir/package.json" ]]; then (cd "$case_dir" && npm install && npm run build); else node --check "$case_dir/index.js"; fi
done
for case_dir in projects/typescript/case-*; do (cd "$case_dir" && npm install && npm run build); done
for case_dir in projects/javascript-bundler/case-* projects/node-addon/case-* projects/node-lifecycle/case-*; do
  (cd "$case_dir" && npm ci && npm run build)
done

for case_dir in projects/dotnet/case-*; do dotnet build "$case_dir"; done
for case_dir in projects/java/case-*; do
  if [[ -f "$case_dir/pom.xml" ]]; then (cd "$case_dir" && mvn -q -DskipTests package); else javac "$case_dir"/src/*.java; fi
done
if command -v kotlinc >/dev/null 2>&1; then
  for case_dir in projects/kotlin/case-*; do "$case_dir/build.sh"; done
else
  echo "kotlinc not found; skipping Kotlin/JVM builds"
fi

for file in projects/php/case-*/*.php; do php -l "$file"; done
for file in projects/python/case-*/*.py; do python3 -m py_compile "$file"; done
for case_dir in projects/python-package/case-*; do (cd "$case_dir" && python3 -m pip wheel . --no-deps --wheel-dir dist); done
for file in projects/bash/case-*/*.sh projects/php/case-*/*.sh; do bash -n "$file"; done

if command -v clang >/dev/null 2>&1; then
  for case_dir in projects/wasm/case-*; do "$case_dir/build.sh"; done
else
  echo "clang not found; skipping WebAssembly builds"
fi

if [[ "${INCLUDE_SPECIALIZED:-0}" == "1" ]]; then
  for case_dir in projects/php-composer/case-*; do (cd "$case_dir" && composer install --no-interaction && composer run build); done
  for case_dir in projects/php-extension/case-*; do "$case_dir/build.sh"; done
  for case_dir in projects/android/case-*; do (cd "$case_dir" && gradle --no-daemon :app:assembleDebug); done
else
  echo "specialized Composer, phpize, and Android builds skipped; set INCLUDE_SPECIALIZED=1 to enable"
fi

if command -v pwsh >/dev/null 2>&1; then
  for file in projects/powershell/case-*/*.ps1; do
    pwsh -NoProfile -Command "\$tokens=\$null; \$errors=\$null; [System.Management.Automation.Language.Parser]::ParseFile('$file', [ref]\$tokens, [ref]\$errors) | Out-Null; if (\$errors.Count -gt 0) { \$errors | ForEach-Object { Write-Error \$_ }; exit 1 }"
  done
else
  echo "pwsh not found; skipping PowerShell parse checks"
fi

python3 scripts/validate-matrix.py
