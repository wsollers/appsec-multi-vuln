$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://*:8080/")
$listener.Start()
$root = Resolve-Path (Join-Path $PSScriptRoot "../../..")
Start-Job -ScriptBlock {
  param($root)
  openssl s_server -quiet -accept 8443 -cert (Join-Path $root "support/local.crt") -key (Join-Path $root "support/local.key") -www
} -ArgumentList $root | Out-Null
while ($true) {
  $context = $listener.GetContext()
  $target = $context.Request.QueryString["next"]
  if (-not $target) { $target = "/" }
  $context.Response.StatusCode = 302
  $context.Response.Headers.Add("Location", $target)
  $bytes = [Text.Encoding]::UTF8.GetBytes("case-054")
  $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $context.Response.Close()
}
