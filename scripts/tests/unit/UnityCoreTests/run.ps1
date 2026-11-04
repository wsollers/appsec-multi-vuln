$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..\..")).Path
$unitExe = Join-Path ([System.IO.Path]::GetTempPath()) ("appsec-unity-rule-units-" + [Guid]::NewGuid().ToString("N") + ".exe")
try {
    Add-Type -Path @(
        (Join-Path $root "projects\unity\case-095\Assets\Scripts\ProfileRules.cs"),
        (Join-Path $PSScriptRoot "Program.cs")
    ) -OutputAssembly $unitExe -OutputType ConsoleApplication
    & $unitExe
    if ($LASTEXITCODE -ne 0) { throw "Shared C# rule unit assertions failed ($LASTEXITCODE)." }
} finally {
    if (Test-Path -LiteralPath $unitExe) { Remove-Item -LiteralPath $unitExe }
}
