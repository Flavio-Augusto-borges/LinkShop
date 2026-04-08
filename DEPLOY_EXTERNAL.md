# Primeiro Deploy Externo Full-Stack (Controlado)

Este guia cobre a primeira subida real do sistema completo (frontend + backend) sem infraestrutura complexa.

## Estrategia Recomendada

- backend containerizado (compose de release)
- banco gerenciado preferencialmente
- frontend separado (Node/SSR ou plataforma de frontend)
- validacao com smoke backend + smoke full-stack

Objetivo: previsibilidade operacional com baixo retrabalho.

## Ordem De Deploy

1. Subir backend e banco.
2. Aplicar migracoes.
3. Seed opcional em ambiente controlado.
4. Validar backend (`/health`, `/health/ready`, smoke backend).
5. Publicar frontend com variaveis de producao.
6. Rodar smoke full-stack.
7. Rodar checklist manual final (inclui fluxo admin autenticado).

## Configuracao De Ambiente

### Frontend

Arquivo base: [`.env.production.example`](/c:/Users/flavi/Desktop/LinkShop/.env.production.example)

Variaveis:

- `NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api` (obrigatoria para browser)
- `BACKEND_INTERNAL_API_BASE_URL=http://backend:8000/api` (opcional, server-side only)

Use `BACKEND_INTERNAL_API_BASE_URL` quando o servidor do frontend acessa o backend por rede interna.

### Backend

Arquivo base: [backend/.env.production.example](/c:/Users/flavi/Desktop/LinkShop/backend/.env.production.example)

Campos obrigatorios:

- `APP_ENV=production`
- `APP_DEBUG=false`
- `DATABASE_URL`
- `AUTH_SECRET_KEY`
- `CORS_ORIGINS` (incluindo dominio do frontend)
- `ACCESS_TOKEN_TTL_MINUTES`
- `REFRESH_TOKEN_TTL_DAYS`

### Compose De Release

Arquivo base: [`.env.deploy.example`](/c:/Users/flavi/Desktop/LinkShop/.env.deploy.example)

Campos principais:

- `BACKEND_IMAGE`
- `BACKEND_ENV_FILE`
- `RUN_MIGRATIONS_ON_STARTUP=false` (recomendado no primeiro deploy)

## Backend: Subida E Validacao

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\release-backend.ps1 up
powershell -ExecutionPolicy Bypass -File .\scripts\release-backend.ps1 migrate
```

Seed opcional:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\release-backend.ps1 seed
```

Smoke backend:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\release-backend.ps1 smoke -SmokeBaseUrl https://api.example.com
```

## Frontend: Build E Runtime

Build:

```bash
npm ci
npm run build
```

Runtime:

```bash
npm run start
```

Checklist rapido de frontend:

- home responde (`/`)
- busca responde (`/buscar`)
- pagina de produto responde (`/ofertas/{slug}`)

## Smoke Full-Stack Externo

Script:

- [scripts/fullstack-smoke.mjs](/c:/Users/flavi/Desktop/LinkShop/scripts/fullstack-smoke.mjs)

Execucao:

```bash
FULLSTACK_FRONTEND_BASE_URL=https://app.example.com \
FULLSTACK_BACKEND_BASE_URL=https://api.example.com \
npm run smoke:fullstack
```

Opcional (endpoints internos de dev):

```bash
FULLSTACK_INCLUDE_DEV_ENDPOINTS=true npm run smoke:fullstack
```

## Checklist Manual Final (Pos-Smoke)

1. Home carrega.
2. Busca/listagem funciona com filtros.
3. Pagina de produto mostra ofertas e historico.
4. Login com usuario comum funciona.
5. Sessao renova (refresh) sem logout inesperado.
6. Favoritos/lista/watches persistem apos reload.
7. Sync visitante -> usuario ocorre apos login.
8. Redirect/tracking leva para loja.
9. Login com admin funciona.
10. `/admin` carrega com dados internos quando autenticado como admin.

## Rollback Simples

Rollback por imagem do backend:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\release-backend.ps1 rollback -RollbackImage linkshop-backend:TAG_ANTIGA
```

Para frontend, manter pelo menos uma build/tag estavel anterior.

## Limites Atuais

- sem pipeline de deploy automatizado completo
- sem monitoramento externo forte (metricas/alerting)
- sem WAF/rate-limit avancado
- rotas internas admin/dev ainda sem hardening completo

Este setup e suficiente para um primeiro deploy real controlado com validacao full-stack.
