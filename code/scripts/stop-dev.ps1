$ErrorActionPreference = "Stop"

function Stop-Port($Port, $Name) {
  $lines = netstat -ano -p tcp | Select-String ":$Port\s+.*LISTENING\s+(\d+)"
  if (-not $lines) {
    Write-Host "$Name is not listening on port $Port"
    return
  }

  $lines | ForEach-Object {
    $processId = [int]$_.Matches[0].Groups[1].Value
    Write-Host "Stopping $Name process $processId"
    Stop-Process -Id $processId -Force
  }
}

Stop-Port 5173 "frontend"
Stop-Port 3000 "backend"

$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker) {
  $Root = Resolve-Path (Join-Path $PSScriptRoot "..")
  Push-Location $Root
  try {
    docker compose stop mysql
  } finally {
    Pop-Location
  }
}
