param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("up", "up-with-db", "down", "logs", "migrate", "seed", "smoke", "smoke-dev", "rollback", "ps")]
    [string]$Action,

    [string]$RollbackImage = "",
    [string]$SmokeBaseUrl = ""
)

$ErrorActionPreference = "Stop"

$composeArgs = @("-f", "docker-compose.prod.yml")
if (Test-Path ".env.deploy") {
    $composeArgs += @("--env-file", ".env.deploy")
}

function Invoke-ReleaseCompose {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Args
    )

    & docker compose @composeArgs @Args
}

switch ($Action) {
    "up" {
        Invoke-ReleaseCompose up --build -d backend
    }
    "up-with-db" {
        Invoke-ReleaseCompose --profile with-db up --build -d db backend
    }
    "down" {
        Invoke-ReleaseCompose down
    }
    "logs" {
        Invoke-ReleaseCompose logs -f backend
    }
    "migrate" {
        Invoke-ReleaseCompose run --rm backend alembic -c backend/alembic.ini upgrade head
    }
    "seed" {
        Invoke-ReleaseCompose run --rm backend python backend/seed.py
    }
    "smoke" {
        $target = if ($SmokeBaseUrl) { $SmokeBaseUrl } elseif ($env:SMOKE_BASE_URL) { $env:SMOKE_BASE_URL } else { "http://127.0.0.1:8000" }
        Invoke-ReleaseCompose run --rm -e SMOKE_BASE_URL=$target backend python backend/post_deploy_smoke.py
    }
    "smoke-dev" {
        $target = if ($SmokeBaseUrl) { $SmokeBaseUrl } elseif ($env:SMOKE_BASE_URL) { $env:SMOKE_BASE_URL } else { "http://127.0.0.1:8000" }
        Invoke-ReleaseCompose run --rm -e SMOKE_BASE_URL=$target -e SMOKE_INCLUDE_DEV_ENDPOINTS=true backend python backend/post_deploy_smoke.py
    }
    "rollback" {
        if (-not $RollbackImage) {
            throw "Use -RollbackImage with a previously published image tag."
        }
        $env:BACKEND_IMAGE = $RollbackImage
        Invoke-ReleaseCompose up -d backend
    }
    "ps" {
        Invoke-ReleaseCompose ps
    }
}
