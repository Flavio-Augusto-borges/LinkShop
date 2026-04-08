# Smoke Checks Pos-Deploy

Este documento separa a verificacao operacional pos-deploy da suite de testes de desenvolvimento.

## Objetivo

Validar rapidamente se um ambiente ja subido responde nos fluxos essenciais:

- liveness
- readiness
- autenticacao basica
- leitura de produto
- redirect com tracking
- sync visitante -> usuario
- endpoints internos de desenvolvimento, quando habilitados

## Arquivos

- [post_deploy_smoke.py](/c:/Users/flavi/Desktop/LinkShop/backend/post_deploy_smoke.py)
- [DEPLOY.md](/c:/Users/flavi/Desktop/LinkShop/backend/DEPLOY.md)

## Quando usar

Use este smoke check:

- apos subir um ambiente local containerizado
- apos um deploy inicial controlado
- apos migracoes importantes
- antes de liberar validacao manual do produto

Nao use isso como substituto da suite de testes de CI.

## Requisitos

O ambiente precisa estar:

- com banco acessivel
- com migracoes aplicadas
- com API no ar
- com dados controlados disponiveis

Para os defaults atuais, o smoke assume o seed do projeto.

## Variaveis suportadas

- `SMOKE_BASE_URL`
- `SMOKE_AUTH_EMAIL`
- `SMOKE_AUTH_PASSWORD`
- `SMOKE_PRODUCT_ID`
- `SMOKE_OFFER_ID`
- `SMOKE_INCLUDE_DEV_ENDPOINTS`

Defaults atuais:

- `SMOKE_BASE_URL=http://127.0.0.1:8000`
- `SMOKE_AUTH_EMAIL=user@linkshop.dev`
- `SMOKE_AUTH_PASSWORD=123456`
- `SMOKE_PRODUCT_ID=product-iphone-15-128`
- `SMOKE_OFFER_ID=offer-iphone-mercado-livre`
- `SMOKE_INCLUDE_DEV_ENDPOINTS=false`

## Como executar

Host local:

```bash
python backend/post_deploy_smoke.py
```

Com endpoints internos de desenvolvimento:

```bash
SMOKE_INCLUDE_DEV_ENDPOINTS=true python backend/post_deploy_smoke.py
```

Quando essa flag esta ativa, o script valida tambem:

- `POST /api/dev/evaluate-alerts`
- `GET /api/admin/analytics/clicks`
- `GET /api/admin/operations/summary`

Via Docker Compose local:

```bash
docker compose run --rm -e SMOKE_BASE_URL=http://backend:8000 backend python backend/post_deploy_smoke.py
```

## Ordem de validacao

1. `/health`
2. `/health/ready`
3. `POST /api/auth/login`
4. `GET /api/auth/me`
5. `GET /api/products`
6. `GET /api/products/{product_id}`
7. `GET /api/redirect/{offer_id}`
8. `POST /api/sync/anonymous`
9. endpoints internos opcionais

## Como interpretar falhas

- falha em `/health`
  - processo da API nao subiu corretamente
- falha em `/health/ready`
  - banco/config/integracoes nao estao prontos
- falha em login
  - seed ausente, credenciais erradas ou problema em auth
- falha em produto
  - seed ausente ou leitura principal quebrada
- falha em redirect
  - oferta inexistente, problema de tracking ou rota quebrada
- falha em sync
  - persistencia do usuario ou merge com backend com problema
- falha em endpoints internos
  - esperado quando `APP_DEBUG=false` e a checagem opcional foi ativada

## Saida

O script imprime JSON com:

- `base_url`
- lista de checks
- status `ok` ou `failed`
- detalhes ou erro

O exit code e:

- `0` quando tudo passa
- `1` quando qualquer check falha

## Limites Atuais

- depende de dados controlados para validar fluxos
- nao substitui observabilidade real
- nao mede performance
- nao cobre todo o produto

Ele existe para responder a pergunta mais importante pos-subida:

"o ambiente esta funcional o suficiente para seguir com validacao?"
