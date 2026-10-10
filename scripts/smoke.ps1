$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

$Native = Get-ChildItem "projects/native/case-083/build" -Recurse -Filter "case083.exe" | Select-Object -First 1
if ($Native) { & $Native.FullName sample | Out-Null }
cargo run --quiet --manifest-path "projects/rust/case-006/Cargo.toml" -- demo | Out-Null
Push-Location "projects/go/case-008"; go run . sample | Out-Null; Pop-Location
node "projects/javascript/case-010/index.js" "1 + 1" | Out-Null
node "projects/typescript/case-013/dist/index.js" '{"name":"demo"}' | Out-Null
dotnet run --project "projects/dotnet/case-014" -- "echo sample" | Out-Null
java -cp "projects/java/case-016/src" Main sample | Out-Null
php "projects/php/case-018/index.php" home | Out-Null
python "projects/python/case-074/main.py" sample | Out-Null
pwsh -NoProfile -File "projects/powershell/case-020/run.ps1" "1+1" | Out-Null
python scripts/validate-matrix.py
