$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

Get-ChildItem "projects/cpp" -Directory | ForEach-Object {
  if (Test-Path (Join-Path $_.FullName "CMakeLists.txt")) {
    cmake -S $_.FullName -B (Join-Path $_.FullName "build")
    cmake --build (Join-Path $_.FullName "build")
  } elseif (Test-Path (Join-Path $_.FullName "Makefile")) {
    make -C $_.FullName
  } elseif (Test-Path (Join-Path $_.FullName "msbuild/case038.vcxproj")) {
    msbuild (Join-Path $_.FullName "msbuild/case038.vcxproj")
  }
}

Get-ChildItem "projects/rust" -Directory | ForEach-Object {
  cargo build --manifest-path (Join-Path $_.FullName "Cargo.toml")
}

Get-ChildItem "projects/go" -Directory | ForEach-Object {
  Push-Location $_.FullName
  go build ./...
  Pop-Location
}

Get-ChildItem "projects/javascript" -Directory | ForEach-Object {
  if (Test-Path (Join-Path $_.FullName "package.json")) {
    Push-Location $_.FullName
    npm install
    npm run build
    Pop-Location
  } else {
    node --check (Join-Path $_.FullName "index.js")
  }
}

Get-ChildItem "projects/typescript" -Directory | ForEach-Object {
  Push-Location $_.FullName
  npm install
  npm run build
  Pop-Location
}

Get-ChildItem "projects/dotnet" -Directory | ForEach-Object {
  dotnet build $_.FullName
}

Get-ChildItem "projects/java" -Directory | ForEach-Object {
  if (Test-Path (Join-Path $_.FullName "pom.xml")) {
    Push-Location $_.FullName
    mvn -q -DskipTests package
    Pop-Location
  } else {
    javac (Join-Path $_.FullName "src/*.java")
  }
}

php -l "projects/php/case-018/index.php"
bash -n "projects/bash/case-019/run.sh"
pwsh -NoProfile -File "projects/powershell/case-020/run.ps1" "1+1" | Out-Null
