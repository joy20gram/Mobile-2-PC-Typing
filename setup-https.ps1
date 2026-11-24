$ErrorActionPreference = "Stop"

$mkcert = Get-Command mkcert -ErrorAction SilentlyContinue
$mkcertPath = if ($mkcert) { $mkcert.Source } else {
  Get-ChildItem (Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages\FiloSottile.mkcert*") `
    -Filter "mkcert.exe" -Recurse -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName
}

if (-not $mkcertPath) {
  Write-Error "mkcert is missing. Install it first with: winget install FiloSottile.mkcert"
  exit 1
}

$wifiAddress = Get-NetIPAddress -AddressFamily IPv4 -AddressState Preferred |
  Where-Object { $_.InterfaceAlias -eq "Wi-Fi" -and $_.IPAddress -notlike "169.254.*" } |
  Select-Object -First 1 -ExpandProperty IPAddress

if (-not $wifiAddress) {
  Write-Error "No active Wi-Fi IPv4 address found. Connect the PC to Wi-Fi and try again."
  exit 1
}

$certDir = Join-Path $PSScriptRoot "certs"
New-Item -ItemType Directory -Path $certDir -Force | Out-Null

& $mkcertPath -install
if ($LASTEXITCODE -ne 0) { throw "mkcert could not install its local certificate authority." }

& $mkcertPath `
  -cert-file (Join-Path $certDir "server-cert.pem") `
  -key-file (Join-Path $certDir "server-key.pem") `
  localhost 127.0.0.1 $wifiAddress
if ($LASTEXITCODE -ne 0) { throw "mkcert could not create the HTTPS certificate." }

$caDirectory = (& $mkcertPath -CAROOT).Trim()
if ($LASTEXITCODE -ne 0) { throw "Could not locate the mkcert certificate authority." }
Copy-Item (Join-Path $caDirectory "rootCA.pem") (Join-Path $certDir "mobile-ca.crt") -Force

Write-Host ""
Write-Host "HTTPS certificate created for this PC's current Wi-Fi address: $wifiAddress"
Write-Host "Next: follow the Android certificate steps in README.md, then restart with npm start."
