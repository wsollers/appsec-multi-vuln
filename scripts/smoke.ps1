$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

$Case001 = Get-ChildItem "projects/cpp/case-001/build" -Recurse -Filter "case001.exe" | Select-Object -First 1
if ($Case001) {
  & $Case001.FullName sample | Out-Null
}
cargo run --quiet --manifest-path "projects/rust/case-006/Cargo.toml" -- demo | Out-Null
Push-Location "projects/go/case-008"
go run . sample | Out-Null
Pop-Location
node "projects/javascript/case-010/index.js" "1 + 1" | Out-Null
node "projects/typescript/case-013/dist/index.js" '{"name":"demo"}' | Out-Null
dotnet run --project "projects/dotnet/case-014" -- "echo sample" | Out-Null
java -cp "projects/java/case-016/src" Main sample | Out-Null
php "projects/php/case-018/index.php" home | Out-Null
pwsh -NoProfile -File "projects/powershell/case-020/run.ps1" "1+1" | Out-Null
