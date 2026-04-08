# Checklist De Validacao Full-Stack (Ambiente Externo)

Use este checklist apos subir backend e frontend em ambiente externo.

## Precondicoes

- backend no ar
- frontend no ar
- migracoes aplicadas
- seed opcional aplicado quando for ambiente controlado

## Validacao Automatizada Recomendada

```bash
FULLSTACK_FRONTEND_BASE_URL=https://app.example.com \
FULLSTACK_BACKEND_BASE_URL=https://api.example.com \
npm run smoke:fullstack
```

O script valida:

- home/listagem/produto no frontend
- health/readiness no backend
- login, `/auth/me` e refresh
- favoritos/lista/watches autenticados
- sync visitante -> usuario
- redirect/tracking via `/api/redirect/{offerId}`
- carregamento de `/admin` (status da pagina)
- login admin (API)

## Validacao Manual Obrigatoria

1. Navegar em `https://app.example.com/`.
2. Fazer busca em `/buscar` e abrir um produto.
3. Confirmar comparacao de ofertas e melhor oferta.
4. Logar como `user@linkshop.dev` (ou usuario real do ambiente).
5. Favoritar um item, adicionar na lista e acompanhar preco.
6. Recarregar a pagina e confirmar persistencia.
7. Abrir uma oferta e confirmar redirecionamento para loja.
8. Fazer logout/login novamente e validar estado sincronizado.
9. Logar como admin e abrir `/admin`.
10. Confirmar cards de cliques/alertas e health/readiness no admin.

## Sinais De Falha E Diagnostico Rapido

- Falha no login/refresh:
  - validar `AUTH_SECRET_KEY`, TTLs e relogio do servidor.
- Falha no frontend consumir backend:
  - validar `NEXT_PUBLIC_API_BASE_URL`.
  - validar `CORS_ORIGINS` no backend.
- Falha em SSR/route handler:
  - usar `BACKEND_INTERNAL_API_BASE_URL` quando houver rede interna.
- Falha em redirect/tracking:
  - validar endpoint `/api/redirect/{offer_id}` no frontend e `/api/redirect/{offer_id}` no backend.

## Resultado Esperado

- smoke automatizado com exit code `0`
- checklist manual completo sem bloqueios criticos
- `/health` e `/health/ready` com status saudavel
