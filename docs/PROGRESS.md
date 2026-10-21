# Acompanhamento de Progresso do Projeto

Última atualização: Fase 1 (Preparação)

---

## Status Geral

- **Fase Atual:** FASE 2 — Protótipo do Núcleo
- **Bloqueios Atuais:** Nenhum
- **Próximo Marco:** Portão de Aceite da Fase 2 (Nave, inimigo, colisão, 60 FPS, teste de replay passando)

---

## Checklist da Fase 2: Protótipo do Núcleo

- [x] Definir os contratos da seção 5.4 (`Input`, `Renderer`, `AudioPlayer`) e `World` tipado
- [x] Implementar PRNG com semente (`mulberry32`), `world.tick`, `STEP` e ordem de `step`
- [x] Nave do jogador: movimento, limites de tela (480x270), tiro principal nível 1, vidas e invencibilidade
- [x] Drone reto, seus disparos e sistema de colisão por círculos
- [x] Pools de objetos para tiros, inimigos e partículas (sem alocação no loop quente)
- [x] Rolagem de cenário com blocos sólidos e colisão com a nave
- [x] `CanvasRenderer` na web (retângulos), loop de tempo fixo interpolado, entrada de teclado e gamepad
- [x] Gravação e reprodução de replay determinístico (RLE) e verificação com `CORE_VERSION`
- [x] Testes automatizados: colisão, pools, determinismo idêntico e teste de replay dourado
- [x] Validar portão da Fase 2

---

## Histórico de Fases

| Fase | Título                           | Status                           | Data de Conclusão |
| ---- | -------------------------------- | -------------------------------- | ----------------- |
| 1    | Preparação                       | Concluída e Aprovada             | 21/10/2026        |
| 2    | Protótipo do Núcleo              | Concluída (Aguardando Aprovação) | 21/10/2026        |
| 3    | Fatia Vertical (Portão Decisivo) | Não iniciada                     | —                 |
| 4    | Jogo Web Completo                | Não iniciada                     | —                 |
| 5    | Backend e Ranking                | Não iniciada                     | —                 |
| 6    | Port Mobile                      | Não iniciada                     | —                 |
| 7    | Polimento e Lançamento           | Não iniciada                     | —                 |
