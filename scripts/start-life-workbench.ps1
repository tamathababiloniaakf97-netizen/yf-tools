param([switch]$SkipBrowser)

$ErrorActionPreference = 'Stop'
$AppUrl = 'http://localhost:3000/investment'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

function Test-AppReady {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $AppUrl -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
  } catch {
    return $false
  }
}

if (Test-AppReady) {
  if (-not $SkipBrowser) { Start-Process $AppUrl }
  Write-Output 'already-running'
  exit 0
}

Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'dev', '--', '--port', '3000') -WorkingDirectory $ProjectRoot -WindowStyle Hidden

for ($attempt = 1; $attempt -le 30; $attempt++) {
  Start-Sleep -Seconds 1
  if (Test-AppReady) {
    if (-not $SkipBrowser) { Start-Process $AppUrl }
    Write-Output 'started'
    exit 0
  }
}

Add-Type -AssemblyName System.Windows.Forms
$utf8 = [System.Text.Encoding]::UTF8
$message = $utf8.GetString([System.Convert]::FromBase64String('5Lq655Sf5bel5L2c5Y+w5pyq6IO95ZyoIDMwIOenkuWGheWQr+WKqOOAguivt+ajgOafpSBOb2RlLmpz44CB6aG555uu5L6d6LWW77yM5oiW56Gu6K6kIDMwMDAg56uv5Y+j5pyq6KKr5YW25LuW56iL5bqP5Y2g55So44CC'))
$title = $utf8.GetString([System.Convert]::FromBase64String('5Lq655Sf5bel5L2c5Y+w5ZCv5Yqo5aSx6LSl'))
[System.Windows.Forms.MessageBox]::Show(
  $message,
  $title,
  [System.Windows.Forms.MessageBoxButtons]::OK,
  [System.Windows.Forms.MessageBoxIcon]::Error
) | Out-Null
exit 1
