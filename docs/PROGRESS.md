# Acompanhamento de Progresso do Projeto

Última atualização: 28/10/2026 — Fase 5 em progresso com backend validado por replay, persistência SQLite e integração do envio de pontuação no fluxo web

---

## Status Geral

- **Fase Atual:** FASE 5 em progresso, com o backend de ranking validado por replay e com persistência de sessão, saves e leaderboard em SQLite local dentro do app servidor.
- **Bloqueios Atuais:** A validação humana da Fase 3 continua pendente, bem como a medição de benchmark de desempenho do navegador. O portão da fase 3 segue aberto até evidência de usabilidade e FPS reais.
- **Último avanço:** A fase 5 foi aprofundada com a criação do banco SQLite em `apps/server/data/vanguarda.db`, persistência de jogadores/sessões/saves e leaderboard real, além da autenticação anônima e da validação de pontuação reexecutando o replay headless. A web foi integrada para manter uma sessão de jogador, consumir o ranking online e enviar a pontuação ao fim da partida quando o jogador está autenticado.
- **Verificações recentes:** 8 testes de conteúdo, 39 testes do núcleo e 2 testes do servidor passaram; `pnpm typecheck`, `pnpm lint`, `pnpm test` e `pnpm build` passaram no monorepo.
- **Próximo Marco:** Finalizar a etapa de produção da fase 5 com deploy, logs e hardening do servidor, além de fechar os itens pendentes da validação da Fase 3 e dos benchmarks do navegador.

## O que ainda falta concluir

### Critérios críticos da Fase 3
- [ ] Realizar e registrar playtests com três pessoas sem instruções, documentando feedback e problemas percebidos.
- [ ] Medir a estabilidade de 60 FPS por cinco minutos em navegador alvo e registrar resultados comparativos.
- [ ] Revisar e centralizar os parâmetros de balanceamento remanescentes em `balance.ts`.
- [ ] Validar formalmente o portão da Fase 3 conforme os critérios de aceite do projeto.

### Avanços pendentes da Fase 4
- [x] Finalizar tela de créditos e identidade visual complementar do jogo.
- [x] Refinar overlays de pause, fim de partida e world clear com ações mais completas.
- [x] Consolidar o ranking local com melhor UX e visibilidade de melhores pontuações.
- [x] Preparar a camada de integração com a Fase 5 (backend e ranking online).

---

---

## Checklist da Fase 3: Fatia Vertical

- [x] Gerar tabelas de trajetórias pré-calculadas (`packages/content/src/paths.json`) e formatá-las no comando de geração
- [x] Implementar os 8 tipos de inimigos (reto, ondulante, zigue-zague, atirador, kamikaze, esquadrão, torreta, mina)
- [x] Implementar armas de níveis 1 a 3, míssil diagonal e cápsulas de power-up identificadas por letras
- [x] Implementar bomba (limpeza de tiros e dano em área) e combo
- [x] Implementar torretas e passagens estreitas no mapa de tiles
- [x] Definir schema Zod `LevelData`, validar o JSON e carregar terreno/ondas/chefe do Mundo 1 a partir de dados
- [x] Implementar o Chefe do Mundo 1 com 2 fases de ataque, padrões e barra de vida
- [x] Integrar Web Audio API procedural na aplicação web consumindo `world.events`
- [x] Atualizar HUD (barra de chefe, bombas, escudo, armas) e implementar telas de Pausa e World Clear
- [x] Resolver o problema do favicon da web (`/favicon.svg` + link no `index.html`)
- [ ] Revisar e centralizar todos os parâmetros de balanceamento em `balance.ts` (os principais estão centralizados; constantes de gameplay remanescentes precisam de revisão)
- [x] Completar cobertura automatizada das regras de dano, drops, armas, chefe, combo, dificuldade, bomba, trajetórias e replay
- [x] Elaborar `docs/PLAYTEST.md` com protocolo e campos de resultados
- [ ] Realizar e registrar playtests com três pessoas sem instruções
- [ ] Medir estabilidade de 60 FPS por cinco minutos em navegador-alvo
- [ ] Validar critérios de aceite do Portão da Fase 3

---

## Desenvolvimento do Próximo Nível

- [x] Criar o protótipo inicial do Mundo 2 em `packages/content/src/levels/world2.json`
- [x] Integrar `world-2` ao registro de níveis em `packages/content/src/level-data.ts`
- [x] Adicionar a faixa temática `world2-theme` no player de áudio da web
- [x] Expandir o conteúdo do Mundo 2 com padrões mais diversos de cenário e suporte de boss em 3 fases
- [x] Validar o mundo 2 em testes automatizados de conteúdo e em execução da simulação
- [x] Criar o protótipo inicial do Mundo 3 em `packages/content/src/levels/world3.json`
- [x] Integrar `world-3` ao registro de níveis em `packages/content/src/level-data.ts`
- [x] Adicionar a faixa temática `world3-theme` no player de áudio da web
- [x] Concluir a base da Fase 4 com a identidade visual dos mundos e a estrutura de conteúdo em evolução
- [x] Criar a tela de configurações com volume, alto contraste e redução de efeitos
- [x] Criar a tela de créditos e identidade visual complementar do menu principal
- [x] Integrar pausa e ações de menu no jogo web com persistência das preferências
- [x] Implementar ranking local por `localStorage` com salvamento no fim da partida
- [x] Adicionar ações de pós-partida: reinício, menu principal e acesso rápido às configurações

---

## Histórico de Fases

| Fase | Título                           | Status                                                        | Data de Conclusão |
| ---- | -------------------------------- | ------------------------------------------------------------- | ----------------- |
| 1    | Preparação                       | Concluída e aprovada                                          | 21/10/2026        |
| 2    | Protótipo do Núcleo              | Concluída e aprovada                                          | 21/10/2026        |
| 3    | Fatia Vertical (Portão Decisivo) | Em execução — funcional, mas pendente de validação humana e benchmark | —                 |
| 4    | Jogo Web Completo                | Em progresso — menu, seleção, configurações e ranking local ativos | —                 |
| 5    | Backend e Ranking                | Em progresso — servidor Fastify funcionando e validando replay | —                 |
| 6    | Port Mobile                      | Não iniciada                                                  | —                 |
| 7    | Polimento e Lançamento           | Não iniciada                                                  | —                 |
