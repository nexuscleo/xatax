# Vanguarda

> Shoot 'em up horizontal retrô autoral em TypeScript, compartilhando lógica pura entre Web (React + Canvas 2D) e Mobile (React Native Expo + Skia), com backend Node (Fastify) e validação de ranking por replays determinísticos.

## Estrutura do Monorepo

```text
vanguarda/
├── apps/
│   ├── web/          # Aplicação Web (Vite + React + Canvas 2D)
│   ├── mobile/       # Aplicação Mobile (Expo + React Native + Skia - Fase 6)
│   └── server/       # Servidor de API e Ranking (Node + Fastify - Fase 5)
├── packages/
│   ├── core/         # Lógica pura do jogo (zero dependências de plataforma)
│   ├── content/      # Dados de fases (JSON), balanceamento e textos
│   └── config/       # Configurações compartilhadas de TypeScript, ESLint e Prettier
├── assets/           # Sprites, áudios, manifesto de assets e créditos
├── docs/             # GDD, Decisões de arquitetura, Progresso e Relatórios de fases
└── AGENTS.md         # Especificação mestra e diretrizes operacionais
```

## Requisitos

- Node.js LTS (>= 20.x ou 22.x)
- pnpm (>= 9.x ou 10.x)

## Comandos Principais

```bash
pnpm install       # Instala dependências em todos os workspaces
pnpm dev           # Inicia ambiente de desenvolvimento
pnpm build         # Gera o build de produção de todos os pacotes e apps
pnpm test          # Executa a suíte de testes automatizados com Vitest
pnpm lint          # Executa verificação de estilo e regras com ESLint
pnpm typecheck     # Executa verificação estática de tipos com TypeScript
```

## Licença e Créditos

Consulte [CREDITS.md](./CREDITS.md) para atribuições e licenças de assets.
