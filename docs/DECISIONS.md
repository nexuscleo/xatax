# Registro de Decisões de Arquitetura (ADR)

Este arquivo documenta as decisões estruturais do projeto Vanguarda, seu contexto, alternativas consideradas e os motivos da escolha.

---

## ADR-001: Monorepo com pnpm Workspaces e Turborepo

- **Data:** Fase 1
- **Contexto:** Necessidade de gerenciar múltiplos pacotes (`core`, `content`, `config`) e aplicações (`web`, `mobile`, `server`) em um único repositório, garantindo compartilhamento de código sem duplicação e execuções rápidas em cache.
- **Decisão:** Adotar `pnpm` como gerenciador de pacotes (via workspace) em conjunto com `Turborepo` para orquestração de tarefas de build, lint, test e typecheck.
- **Alternativas Consideradas:**
  - _npm/yarn workspaces:_ Mais lentos em cache e resolução de dependências cíclicas/isoladas.
  - _Nx:_ Mais opinativo e pesado para um projeto que prioriza simplicidade e portabilidade multiplataforma.
- **Motivo:** O `pnpm` oferece isolamento estrito de dependências (evitando dependências fantasmas) e o `Turborepo` entrega paralelismo e cache determinístico de forma simples e configurável em `turbo.json`.

---

## ADR-002: Lógica Determinística Pura em `@vanguarda/core`

- **Data:** Fase 1
- **Contexto:** O jogo precisa validar replays e pontuações online em servidores headless Node.js e rodar de maneira idêntica na web (motor V8) e no mobile (motor Hermes).
- **Decisão:** `@vanguarda/core` é uma biblioteca em TypeScript puro sem qualquer acesso a DOM, `window`, APIs de temporização assíncrona (`setTimeout`, `Date.now`, `performance.now`), `Math.random` ou bibliotecas de UI (React/React Native). Toda a simulação ocorre em um passo fixo (`STEP = 1/60`) orientado por um PRNG com semente e contador de ticks.
- **Alternativas Consideradas:**
  - _Física/tempo variável (`delta` livre):_ Causa desvios acumulados de arredondamento em taxas de quadros instáveis, quebrando completamente a reprodutibilidade de replays.
- **Motivo:** A reprodutibilidade exata (mesma semente + mesma entrada = mesmo resultado em qualquer plataforma) é requisito inegociável para a segurança do ranking contra fraudes.

---

## ADR-003: Isolamento Estrito via Regras Personalizadas de ESLint

- **Data:** Fase 1
- **Contexto:** Desenvolvedores ou agentes podem inadvertidamente importar utilitários de navegador ou runtime Node dentro de `packages/core`.
- **Decisão:** Configurar ESLint flat config em `packages/config` com regras duras de `no-restricted-imports`, `no-restricted-globals` e `no-restricted-properties` que causam erro fatal de lint caso qualquer membro de `core` toque em APIs de plataforma ou geradores não-determinísticos.
- **Alternativas Consideradas:**
  - _Apenas revisão de código / convenção:_ Propensa a erros humanos e falhas silenciosas.
- **Motivo:** Automatiza a governança arquitetural diretamente no pipeline de CI e no ambiente local de desenvolvimento.

---

## ADR-004: Alinhamento de Versão do React (18.3.x)

- **Data:** Fase 1
- **Contexto:** O projeto conta com web em React e, na Fase 6, app mobile em React Native Expo (SDK 52/53). Expo SDK 52 tem como dependência padrão estável o React 18.3.1.
- **Decisão:** Fixar `react` e `react-dom` na versão `^18.3.1` no pacote web para manter paridade absoluta de runtime com o ecossistema Expo e evitar conflitos de peer dependencies no monorepo pnpm.
- **Alternativas Consideradas:**
  - _React 19:_ Incompatível com diversas dependências estáveis atuais do Expo e React Native Skia.
- **Motivo:** Garante estabilidade e ausência de atritos de resolução de pacotes entre web e mobile.
