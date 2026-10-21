# Acompanhamento de Progresso do Projeto

Última atualização: Fase 1 (Preparação)

---

## Status Geral

- **Fase Atual:** FASE 3 — Fatia Vertical (Portão Decisivo)
- **Bloqueios Atuais:** Nenhum
- **Próximo Marco:** Portão de Aceite da Fase 3 (Mundo 1 completo, 8 inimigos, chefe de 2 fases, armas/cápsulas, áudio web, HUD/pausa/vitória, testes cobrindo regras e playtests)

---

## Checklist da Fase 3: Fatia Vertical

- [ ] Gerar tabela de trajetórias pré-calculadas (`packages/content/src/paths.json`)
- [ ] Implementar os 8 tipos de inimigos (reto, ondulante, zigue-zague, atirador, kamikaze, esquadrão, torreta, mina)
- [ ] Implementar sistema completo de armas (níveis 1 a 3, míssil diagonal) e todas as cápsulas de power-up com letras indicativas
- [ ] Implementar mecânica de Bomba (limpeza de tiros na tela e dano em área) e sistema de combo aprimorado
- [ ] Implementar torretas de cenário e passagens estreitas no mapa de tiles
- [ ] Definir schema Zod `LevelData` e construir o Mundo 1 completo em dados (`packages/content/src/levels/world1.json`)
- [ ] Implementar o Chefe do Mundo 1 com 2 fases de ataque, padrões e barra de vida
- [ ] Integrar Web Audio API procedural na aplicação web consumindo `world.events`
- [ ] Atualizar HUD (barra de chefe, bombas, escudo, armas) e implementar telas de Pausa e World Clear
- [ ] Atualizar `balance.ts` com todos os parâmetros balanceados
- [ ] Criar testes unitários para todas as novas regras (danos, drops, armas, chefe, combo, replay)
- [ ] Elaborar `docs/PLAYTEST.md` com protocolo e resultados de playtest
- [ ] Validar critérios de aceite do Portão da Fase 3

---

## Histórico de Fases

| Fase | Título                           | Status                        | Data de Conclusão |
| ---- | -------------------------------- | ----------------------------- | ----------------- |
| 1    | Preparação                       | Concluída e Aprovada          | 21/10/2026        |
| 2    | Protótipo do Núcleo              | Concluída e Aprovada          | 21/10/2026        |
| 3    | Fatia Vertical (Portão Decisivo) | Em Execução                   | —                 |
| 4    | Jogo Web Completo                | Não iniciada                  | —                 |
| 5    | Backend e Ranking                | Não iniciada                  | —                 |
| 6    | Port Mobile                      | Não iniciada                  | —                 |
| 7    | Polimento e Lançamento           | Não iniciada                  | —                 |
