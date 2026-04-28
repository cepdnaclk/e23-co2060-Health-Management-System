$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$Logs = Join-Path $Root ".dev-logs"

New-Item -ItemType Directory -Force -Path $Logs | Out-Null

function Test-Port($Port) {
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $result = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    if (-not $result.AsyncWaitHandle.WaitOne(500)) {
      return $false
    }
    $client.EndConnect($result)
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function Wait-Port($Port, $Name, $Seconds = 30) {
  $deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-Port $Port) {
      Write-Host "$Name is listening on port $Port"
      return $true
    }
    Start-Sleep -Seconds 1
  }
  Write-Host "$Name did not open port $Port within $Seconds seconds"
  return $false
}

function Start-Npm($Name, $Directory, $Arguments, $Port) {
  if (Test-Port $Port) {
    Write-Host "$Name already appears to be running on port $Port"
    return
  }

  $stdout = Join-Path $Logs "$Name.out.log"
  $stderr = Join-Path $Logs "$Name.err.log"

  Write-Host "Starting $Name..."
  Start-Process -FilePath "npm.cmd" -ArgumentList $Arguments -WorkingDirectory $Directory -RedirectStandardOutput $stdout -RedirectStandardError $stderr -WindowStyle Hidden | Out-Null
  Wait-Port $Port $Name 20 | Out-Null
}

Write-Host "Starting Invex dev stack..."

$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker) {
  Write-Host "Starting MySQL with Docker Compose..."
  Push-Location $Root
  try {
    docker compose up -d mysql
    Wait-Port 3306 "MySQL" 60 | Out-Null
  } catch {
    Write-Host "Docker Compose could not start MySQL: $($_.Exception.Message)"
    Write-Host "The API will still start, and it will connect automatically once MySQL is available."
  } finally {
    Pop-Location
  }
} elseif (Test-Port 3306) {
  Write-Host "MySQL already appears to be running on port 3306"
} else {
  Write-Host "Docker is not installed and MySQL is not listening on port 3306."
  Write-Host "The API will still start, and it will connect automatically once MySQL is available."
}

Start-Npm "backend" $Backend @("start") 3000
Start-Npm "frontend" $Frontend @("run", "dev", "--", "--host", "127.0.0.1") 5173

Write-Host ""
Write-Host "Frontend: http://127.0.0.1:5173/"
Write-Host "Backend:  http://localhost:3000"
Write-Host "Health:   http://localhost:3000/health"
Write-Host "Logs:     $Logs"
