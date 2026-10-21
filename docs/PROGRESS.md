# Acompanhamento de Progresso do Projeto

Última atualização: Fase 1 (Preparação)

---

## Status Geral

- **Fase Atual:** FASE 1 — Preparação
- **Bloqueios Atuais:** Nenhum
- **Próximo Marco:** Portão de Aceite da Fase 1

---

## Checklist da Fase 1: Preparação

- [x] Inicializar repositório Git, `.gitignore`, `.editorconfig`, `.nvmrc` e `README.md`
- [x] Configurar pnpm workspace, `pnpm-workspace.yaml`, Turborepo e scripts raiz (`dev`, `build`, `test`, `lint`, `typecheck`)
- [x] Criar `packages/config` com tsconfig base estrito, ESLint flat config e Prettier
- [x] Criar pacotes vazios `core` e `content` e aplicação `apps/web` com tela "Olá"
- [x] Configurar ESLint com regras duras barrando imports e globais proibidos em `core`
- [x] Configurar Vitest com testes unitários em `core`
- [x] Configurar fluxo de CI no GitHub Actions (`.github/workflows/ci.yml`)
- [x] Criar documentação base: `docs/GDD.md`, `docs/DECISIONS.md`, `docs/PROGRESS.md`, `docs/IDEAS.md` e `CREDITS.md`
- [x] Executar e validar portão da Fase 1 (`pnpm install && pnpm typecheck && pnpm lint && pnpm test && pnpm build`)
- [x] Testar falha deliberada da regra de lint em `core`

---

## Histórico de Fases

| Fase | Título                           | Status                           | Data de Conclusão |
| ---- | -------------------------------- | -------------------------------- | ----------------- |
| 1    | Preparação                       | Concluída (Aguardando Aprovação) | 21/10/2026        |
| 2    | Protótipo do Núcleo              | Não iniciada                     | —                 |
| 3    | Fatia Vertical (Portão Decisivo) | Não iniciada                     | —                 |
| 4    | Jogo Web Completo                | Não iniciada                     | —                 |
| 5    | Backend e Ranking                | Não iniciada                     | —                 |
| 6    | Port Mobile                      | Não iniciada                     | —                 |
| 7    | Polimento e Lançamento           | Não iniciada                     | —                 |
