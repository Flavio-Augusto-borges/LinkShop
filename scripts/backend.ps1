param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("up", "down", "logs", "migrate", "seed", "test", "compile", "ci-check", "ps", "smoke", "smoke-dev")]
    [string]$Action
)

$ErrorActionPreference = "Stop"

function Invoke-Compose {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Args
    )

    & docker compose @Args
}

switch ($Action) {
    "up" {
        Invoke-Compose up --build -d
    }
    "down" {
        Invoke-Compose down
    }
    "logs" {
        Invoke-Compose logs -f backend
    }
    "migrate" {
        Invoke-Compose run --rm backend alembic -c backend/alembic.ini upgrade head
    }
    "seed" {
        Invoke-Compose run --rm backend python backend/seed.py
    }
    "test" {
        Invoke-Compose run --rm backend pytest backend/tests
    }
    "compile" {
        Invoke-Compose run --rm backend python -m compileall backend/app backend/tests
    }
    "ci-check" {
        Invoke-Compose run --rm backend python -m compileall backend/app backend/tests
        Invoke-Compose run --rm backend alembic -c backend/alembic.ini upgrade head
        Invoke-Compose run --rm backend python backend/seed.py
        Invoke-Compose run --rm backend pytest backend/tests
    }
    "ps" {
        Invoke-Compose ps
    }
    "smoke" {
        Invoke-Compose run --rm -e SMOKE_BASE_URL=http://backend:8000 backend python backend/post_deploy_smoke.py
    }
    "smoke-dev" {
        Invoke-Compose run --rm -e SMOKE_BASE_URL=http://backend:8000 -e SMOKE_INCLUDE_DEV_ENDPOINTS=true backend python backend/post_deploy_smoke.py
    }
}
