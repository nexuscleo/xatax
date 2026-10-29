# Relatório da Fase 3: Fatia Vertical

- **Data:** 27/10/2026
- **Status:** Implementação principal concluída; portão pendente de evidência externa
- **Fase:** 3 de 7

## 1. O que foi entregue

- Mundo 1 validado por schema Zod, com terreno de 500 tiles, 30 ondas até o tick 10.200 e chefe no tick 10.800 (180 segundos).
- Tabelas de trajetória pré-calculadas e geração reproduzível pelo comando `pnpm --filter @vanguarda/content generate-paths`.
- Oito tipos de inimigos, sete cápsulas disponíveis nos dados do nível e ajustes de dificuldade no núcleo.
- Armas de três níveis, míssil diagonal, escudo, velocidade, bombas, vidas extras, cápsulas de pontos, combo e bônus de conclusão.
- Colisão com paredes e passagens estreitas, torretas, minas com fragmentos e chefe com dois padrões de ataque.
- HUD com chefe, escudo e bombas; telas de pausa, fim de jogo e setor concluído; desenho de inimigos distintos e cápsulas identificadas por letras.
- Áudio provisório sintetizado pela Web Audio API após interação do usuário; os eventos do núcleo são encaminhados à camada web.
- Registro persistente de dano para impedir o bônus de conclusão sem dano após uma recuperação longa.
- Testes adicionais de gameplay e documentação do protocolo de playtest. Créditos e decisões foram atualizados.

## 2. Como verificar

Os comandos são iguais no PowerShell, Bash e shells compatíveis:

```text
pnpm --filter @vanguarda/content generate-paths
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
pnpm --filter @vanguarda/web dev
```

Para jogar localmente, abra `http://localhost:3000` após iniciar o servidor web. O roteiro para três sessões sem instruções está em [`docs/PLAYTEST.md`](../PLAYTEST.md).

## 3. Resultado dos critérios de aceite

| Critério                                                                              | Status                        | Evidência                                                                                                                                                 |
| ------------------------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mundo 1 inclui oito inimigos, todas as cápsulas, cenário, armas e chefe de duas fases | **Cumprido na implementação** | Dados validados e regras verificadas pelos testes de conteúdo e gameplay. A conclusão de uma partida completa ainda não foi observada em playtest humano. |
| Testes de dano, drops, armas, bomba, dificuldade, combo, chefe e replay               | **Cumprido**                  | 6 testes de conteúdo e 38 testes do núcleo passam, incluindo o replay dourado.                                                                            |
| Typecheck, lint, formatação e build                                                   | **Cumprido**                  | `pnpm typecheck`, `pnpm lint`, `pnpm format:check` e `pnpm build` concluíram com sucesso.                                                                 |
| Três pessoas concluem sessões sem instruções e avaliam a diversão por cinco minutos   | **Não cumprido**              | Nenhum participante foi testado. Não há resultados humanos; as fichas estão em branco em `docs/PLAYTEST.md`.                                              |
| 60 FPS estáveis por cinco minutos, sem quedas durante a sessão                        | **Não verificável**           | Não foi feito benchmark sustentado em navegador-alvo. Uma leitura isolada de 53 FPS no navegador headless não é evidência válida para este critério.      |
| **Portão decisivo da Fase 3**                                                         | **Pendente**                  | Depende dos playtests reais, da medição de desempenho e da revisão do balanceamento com os resultados.                                                    |

O portão não está aprovado e a Fase 4 não deve começar até a revisão dessas evidências.

## 4. Decisões tomadas e o porquê

- [ADR-007](../DECISIONS.md#adr-007-conteúdo-de-mundo-1-com-duração-alvo-e-áudio-procedural): o cronograma foi ampliado para 180 segundos e o áudio provisório é sintetizado, evitando arquivos de terceiros.
- [ADR-008](../DECISIONS.md#adr-008-registro-persistente-de-dano-na-partida): um sinal persistente registra qualquer dano para que o bônus de conclusão seja correto.
- A versão do núcleo foi avançada para `0.5.0`, pois as alterações de regras afetam resultados de replay.

## 5. Medições

- **Testes:** 44 passaram (6 de conteúdo e 38 do núcleo).
- **Build web:** bundle principal de 250,94 kB; 72,95 kB comprimido com gzip.
- **FPS, tempo de `step` e memória por cinco minutos:** não medidos em condições representativas. O contador de FPS do navegador headless não foi usado como benchmark.

## 6. Problemas conhecidos e dívidas técnicas

- Falta realizar e registrar os três playtests e a medição de desempenho sustentada.
- Os valores principais de gameplay estão em `balance.ts`; uma revisão final deve identificar eventuais constantes de balanceamento ainda embutidas na lógica.
- Os elementos visuais e o áudio são placeholders procedurais, conforme o escopo da Fase 3.
- O smoke test de navegador observou uma requisição 404 para `favicon.ico`; isso não impediu a partida.
- O Graphify atualizou o grafo de código, mas não extraiu nós de `world1.json` nem de `paths.json`; os arquivos continuam acessíveis diretamente e os testes validam os dados.

## 7. Próximos passos propostos

1. Realizar três sessões individuais usando o protocolo de [`docs/PLAYTEST.md`](../PLAYTEST.md) e registrar as respostas sem dados pessoais desnecessários.
2. Medir a sessão por cinco minutos em navegador-alvo, guardando FPS, quedas visíveis, erros de console e memória.
3. Ajustar o balanceamento conforme os dados coletados e repetir typecheck, lint, testes e build.
4. Revisar este relatório e solicitar aprovação explícita antes de iniciar a Fase 4.
