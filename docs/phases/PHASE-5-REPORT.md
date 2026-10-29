# Relatório da Fase 5 — Backend e Ranking

## O que foi entregue

- Criação do app servidor em `apps/server` com Fastify, CORS, Helmet e rate limiting.
- Persistência real de jogadores, sessões, saves e leaderboard em SQLite local com `better-sqlite3`.
- Autenticação anônima de jogador com token por sessão.
- Endpoint `POST /scores` com validação forte de payload e replay.
- `GET /leaderboard` para listar scores validados.
- `GET /me/save` e `PUT /me/save` para persistência de save por sessão.
- Reexecução headless do replay usando o mesmo `@vanguarda/core` e validação de `CORE_VERSION`.
- Cliente web em `apps/web/src/api/leaderboard.ts` para consumir a API do servidor.
- Integração do envio de pontuação ao fim da partida no fluxo web com sessão persistida em `localStorage`.
- Testes de servidor cobrindo autenticação e rejeição de score incompatível.
- Arquivo de ambiente `apps/server/.env.example` com configuração básica.

## Como verificar

Em PowerShell:

```powershell
cd C:\Users\clrtj\Desktop\xatax
pnpm --filter @vanguarda/server test
pnpm typecheck
pnpm build
```

Em shell genérico:

```bash
cd /caminho/para/xatax
pnpm --filter @vanguarda/server test
pnpm typecheck
pnpm build
```

## Resultado dos critérios de aceite

- [x] `apps/server` foi criado com Fastify e configuração mínima de ambiente.
- [x] O servidor autentica jogadores anônimos.
- [x] O ranking valida a pontuação reexecutando o replay headless.
- [x] As entradas são validadas estritamente com Zod.
- [x] Há testes para rotas principais e rejeição de trapaça.
- [x] Persistência em banco local SQLite foi implementada para jogadores, sessões, saves e leaderboard.
- [x] Integração de submissão de score ao fim da partida no web foi conectada ao fluxo da sessão do jogador.
- [ ] Política de privacidade e deployment real do backend ainda não foram concluídos.

## Decisões tomadas e porquê

- A decisão principal foi manter o servidor enxuto e validar a pontuação no backend por replay, porque a pontuação do cliente não pode ser considerada confiável.
- O contrato de API foi implementado com SQLite local como persistência de sessão e leaderboard inicial, para reduzir a distância entre a lógica de ranking e a parte operativa sem abrir um ambiente de produção completo.
- A sessão do jogador continua persistida no navegador (`localStorage`) e a sessão autenticada do servidor é controlada por token, o que oferece uma base estável para evoluir para PostgreSQL e deploy em produção.

## Problemas conhecidos e dívidas técnicas

- A persistência real de dados já está em SQLite local, mas ainda não existe um banco PostgreSQL de produção nem migrações gerenciadas em ambiente de deploy.
- O cliente web usa o ranking local como fallback e também dispara a submissão online quando a sessão do jogador existe, mas a UX de ranking online pode ser refinada após testar em ambiente real.
- Falta pipeline de deploy, supervisão e política de privacidade/segurança para ambiente de produção.

## Próximos passos propostos

1. Evoluir a persistência para PostgreSQL em produção, mantendo o mesmo contrato de API.
2. Adicionar deploy, logs estruturados, health checks e ambiente de testes separado.
3. Revisar a UX e a experiência de ranking online após validação real do fluxo de sessão.
4. Preparar a Fase 6 com o port mobile, mantendo o mesmo core determinístico e a API de ranking consistente.
