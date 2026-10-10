$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

if (Test-Path "projects/native") {
  Get-ChildItem "projects/native" -Directory -Filter "case-*" | ForEach-Object {
    cmake -S $_.FullName -B (Join-Path $_.FullName "build")
    cmake --build (Join-Path $_.FullName "build")
  }
}

Get-ChildItem "projects/rust" -Directory | ForEach-Object { cargo build --manifest-path (Join-Path $_.FullName "Cargo.toml") }
Get-ChildItem "projects/go" -Directory | ForEach-Object { Push-Location $_.FullName; go build ./...; Pop-Location }
Get-ChildItem "projects/javascript" -Directory | ForEach-Object {
  if (Test-Path (Join-Path $_.FullName "package.json")) { Push-Location $_.FullName; npm install; npm run build; Pop-Location }
  else { node --check (Join-Path $_.FullName "index.js") }
}
Get-ChildItem "projects/typescript" -Directory | ForEach-Object { Push-Location $_.FullName; npm install; npm run build; Pop-Location }
@("projects/javascript-bundler", "projects/node-addon", "projects/node-lifecycle") | ForEach-Object {
  if (Test-Path $_) { Get-ChildItem $_ -Directory | ForEach-Object { Push-Location $_.FullName; npm ci; npm run build; Pop-Location } }
}
Get-ChildItem "projects/dotnet" -Directory | ForEach-Object { dotnet build $_.FullName }
Get-ChildItem "projects/java" -Directory | ForEach-Object {
  if (Test-Path (Join-Path $_.FullName "pom.xml")) { Push-Location $_.FullName; mvn -q -DskipTests package; Pop-Location }
  else { javac (Join-Path $_.FullName "src/*.java") }
}
if (Get-Command kotlinc -ErrorAction SilentlyContinue) {
  Get-ChildItem "projects/kotlin" -Directory | ForEach-Object {
    $output = Join-Path $_.FullName "build/case-084.jar"
    New-Item -ItemType Directory -Force -Path (Split-Path $output) | Out-Null
    kotlinc (Join-Path $_.FullName "src/main/kotlin/Case084.kt") -language-version 2.0 -api-version 2.0 -include-runtime -d $output
  }
} else { Write-Host "kotlinc not found; skipping Kotlin/JVM builds" }
Get-ChildItem "projects/php" -Recurse -Filter "*.php" | ForEach-Object { php -l $_.FullName }
Get-ChildItem "projects/python" -Recurse -Filter "*.py" | ForEach-Object { python -m py_compile $_.FullName }
Get-ChildItem "projects/python-package" -Directory | ForEach-Object { Push-Location $_.FullName; python -m pip wheel . --no-deps --wheel-dir dist; Pop-Location }
if (Get-Command clang -ErrorAction SilentlyContinue) {
  Get-ChildItem "projects/wasm" -Directory | ForEach-Object {
    $output = Join-Path $_.FullName "build/case091.wasm"
    New-Item -ItemType Directory -Force -Path (Split-Path $output) | Out-Null
    clang --target=wasm32 -std=c17 -Oz -nostdlib '-Wl,--no-entry' '-Wl,--export=copy_input' '-Wl,--strip-all' -o $output (Join-Path $_.FullName "src/case091.c")
  }
}
if ($env:INCLUDE_SPECIALIZED -eq "1") {
  Get-ChildItem "projects/php-composer" -Directory | ForEach-Object { Push-Location $_.FullName; composer install --no-interaction; composer run build; Pop-Location }
  Get-ChildItem "projects/php-extension" -Directory | ForEach-Object { bash (Join-Path $_.FullName "build.sh") }
  Get-ChildItem "projects/android" -Directory | ForEach-Object { Push-Location $_.FullName; gradle --no-daemon :app:assembleDebug; Pop-Location }
} else { Write-Host "specialized Composer, phpize, and Android builds skipped; set INCLUDE_SPECIALIZED=1 to enable" }
Get-ChildItem "projects/powershell" -Recurse -Filter "*.ps1" | ForEach-Object {
  $tokens = $null; $errors = $null
  [System.Management.Automation.Language.Parser]::ParseFile($_.FullName, [ref]$tokens, [ref]$errors) | Out-Null
  if ($errors.Count -gt 0) { throw $errors[0].Message }
}
python scripts/validate-matrix.py
