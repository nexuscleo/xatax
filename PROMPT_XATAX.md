# PROMPT MESTRE DO AGENTE: Shoot 'em up horizontal em React (web) e React Native (mobile)

> **Como usar (para o desenvolvedor, não para o agente):**
>
> 1. Salve este arquivo na raiz do repositório como `AGENTS.md`. Se o seu agente usa outro nome, copie-o também para `CLAUDE.md` (Claude Code) ou `.github/copilot-instructions.md` (GitHub Copilot).
> 2. No chat do agente, envie apenas a mensagem de início da seção 16.
> 3. A cada fim de fase o agente para e pede sua aprovação. Revise o relatório antes de liberar a próxima.

---

## 0. LEIA PRIMEIRO

Você é um agente de engenharia de software atuando dentro do VS Code, com acesso ao terminal, ao sistema de arquivos e ao Git do projeto. Este documento é sua especificação completa e sua fonte de verdade. Leia-o inteiro antes de escrever qualquer código. Em caso de dúvida, volte aqui; se a dúvida persistir, siga a seção 15.

Regras de precedência, da mais forte para a mais fraca:

1. Limites legais e de segurança (seções 2 e 13)
2. Regras invioláveis de arquitetura (seção 5)
3. Critérios de aceite de cada fase (seção 9)
4. O restante deste documento
5. Suas preferências pessoais de estilo

---

## 1. MISSÃO

Construir um **shoot 'em up de rolagem horizontal original**, jogável no navegador (React + Node), e depois portá-lo para **mobile com React Native (Expo)**, reaproveitando integralmente o mesmo núcleo de jogo. O jogo é _inspirado no gênero_ de um shareware de 1994 (Xatax), mas **com nome, arte, sons, fases, código e história próprios**.

**Resultado final esperado:**

- Versão web publicada, com 3 mundos, chefes, power-ups, menus, configurações, recorde local e ranking online
- Servidor Node com ranking que valida cada pontuação reexecutando a partida (replay)
- App mobile (Android e iOS) em orientação horizontal, com 60 FPS em celular intermediário
- Repositório limpo, testado, documentado e com CI funcionando

**Perfil do desenvolvedor que receberá seu trabalho:** programador em aprendizado de JavaScript e desenvolvimento front-end, em ambiente **Windows**. Portanto:

- Explique o **porquê** das decisões importantes, em linguagem clara, nos relatórios e nos comentários de arquitetura
- Escreva scripts multiplataforma em Node; evite comandos exclusivos de bash
- Prefira código simples e legível a soluções "espertas"
- Ao corrigir algo, diga o motivo da correção, não apenas o que mudou

---

## 2. LIMITES LEGAIS (INEGOCIÁVEIS)

O jogo de referência é protegido por direito autoral. Mecânicas e o gênero não são protegidos; o conteúdo concreto é.

**Pode fazer (o gênero em si):**

- Nave que se move livremente na tela, atira, desvia de inimigos e tiros
- Rolagem horizontal da esquerda para a direita
- Ondas de inimigos, torretas fixas, passagens estreitas no cenário
- Cápsulas de power-up que caem de inimigos (mais poder de fogo, escudo, vida extra)
- Chefe ao final de cada mundo; 3 mundos

**NÃO pode fazer:**

- Usar o nome "Xatax" ou qualquer variação reconhecível
- Copiar, extrair, converter ou imitar de perto sprites, telas, fontes, músicas, efeitos sonoros, textos ou layout exato de fases do original
- Baixar ou abrir os arquivos do jogo original para uso como referência de arte ou código
- Reproduzir a história do original; crie uma história própria (seção 6.1)
- Usar assets de terceiros sem licença clara e registrada

**Regras práticas para você:**

1. Todo asset novo é criado do zero (placeholders gerados por código) ou vem de fonte de licença livre. Registre-o em `CREDITS.md` **no mesmo commit** (autor, origem, URL, licença)
2. Se não conseguir confirmar a licença de um arquivo, **não o use**
3. Nunca invente que um asset é original se ele não for
4. O nome provisório do projeto é **"Vanguarda"** (slug `vanguarda`). Use `{{GAME_TITLE}}` em strings de interface para facilitar a troca. O desenvolvedor verificará disponibilidade (INPI e lojas) antes de publicar

---

## 3. PRINCÍPIOS DE OPERAÇÃO

1. **Trabalhe em fases, uma por vez.** Nunca comece a fase N+1 sem aprovação explícita do desenvolvedor para a fase N
2. **Planeje antes de codar.** No início de cada fase, publique um plano curto (tarefas, arquivos que serão criados ou alterados, riscos) e só então execute
3. **Pequeno e verificável.** Entregue em passos pequenos. Cada passo termina com `typecheck`, `lint` e `test` passando
4. **Núcleo primeiro.** Lógica de jogo vive em `packages/core`, pura e testada. Interface e plataforma vêm depois
5. **Não adivinhe versões nem APIs.** Antes de instalar ou usar uma biblioteca, confira a documentação oficial atual e a versão estável. Não confie na memória para versões, flags de CLI ou assinaturas de API
6. **Decisões ficam registradas.** Toda decisão de arquitetura relevante vira uma entrada curta em `docs/DECISIONS.md` (contexto, decisão, alternativas, motivo)
7. **Progresso visível.** Mantenha `docs/PROGRESS.md` atualizado (fase atual, tarefas concluídas, pendências, bloqueios)
8. **Sem escopo extra.** Não adicione funcionalidade que não esteja neste documento. Sugestões vão para `docs/IDEAS.md`, não para o código
9. **Honestidade.** Se algo falhar, não funcionar ou não puder ser verificado, diga claramente. Nunca declare "pronto" sem ter executado a verificação
10. **Reversibilidade.** Commits pequenos, mensagens claras (Conventional Commits em inglês, por exemplo `feat(core): add player movement`). Nunca reescreva histórico publicado nem apague arquivos do usuário sem pedir

---

## 4. STACK TECNOLÓGICA

Use versões **estáveis atuais** (LTS quando existir) e fixe-as no repositório. Valide cada item na documentação oficial antes de instalar.

| Camada        | Tecnologia                                                | Papel                                       |
| ------------- | --------------------------------------------------------- | ------------------------------------------- |
| Linguagem     | TypeScript em modo `strict`                               | Todo o código (core, web, mobile, servidor) |
| Gerenciador   | pnpm (via Corepack) + workspaces                          | Monorepo                                    |
| Orquestração  | Turborepo                                                 | Cache e execução de tarefas                 |
| Núcleo        | TypeScript puro                                           | Lógica do jogo, sem DOM, React ou Node API  |
| Web           | Vite + React                                              | Aplicação web, interface e menus            |
| Render web    | Canvas 2D                                                 | Desenho do jogo                             |
| Áudio web     | Web Audio API (ou Howler.js, se simplificar)              | Efeitos e música                            |
| Mobile        | Expo + React Native                                       | App Android e iOS (fase 6)                  |
| Render mobile | `@shopify/react-native-skia`                              | Desenho do jogo no celular                  |
| Gestos        | `react-native-gesture-handler`, `react-native-reanimated` | Entrada por toque                           |
| Áudio mobile  | `expo-audio`                                              | Efeitos e música                            |
| Servidor      | Node (LTS) + Fastify                                      | API                                         |
| Validação     | Zod                                                       | Entradas da API e formato de fases          |
| Banco         | PostgreSQL (SQLite permitido em desenvolvimento)          | Ranking, jogadores, saves                   |
| Testes        | Vitest; Supertest; Playwright; Maestro                    | Núcleo e servidor; API; web e2e; mobile     |
| Qualidade     | ESLint (flat config), Prettier, `tsc --noEmit`            | Estilo e tipos                              |
| CI            | GitHub Actions                                            | Lint, tipos, testes e build a cada push     |

Se encontrar incompatibilidade ou uma alternativa claramente melhor, **não troque por conta própria**: registre em `docs/DECISIONS.md`, explique o impacto e peça aprovação.

---

## 5. ARQUITETURA E REGRAS INVIOLÁVEIS

### 5.1 Estrutura do monorepo

```text
vanguarda/
├── apps/
│   ├── web/          # Vite + React + Canvas 2D
│   ├── mobile/       # Expo + React Native + Skia (fase 6)
│   └── server/       # Node + Fastify + banco (fase 5)
├── packages/
│   ├── core/         # lógica do jogo em TypeScript puro
│   ├── content/      # fases em JSON, balanceamento, textos
│   └── config/       # tsconfig, ESLint e Prettier compartilhados
├── assets/           # arte, áudio, manifest e CREDITS.md
├── docs/             # GDD, DECISIONS, PROGRESS, IDEAS, relatórios de fase
├── AGENTS.md         # este arquivo
├── CREDITS.md
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

### 5.2 Regras de dependência (violá-las é bug)

1. `packages/core` **não importa** nada de `apps/`, nem `window`, `document`, `localStorage`, React, React Native, APIs do Node, `fs`, `fetch` ou relógio do sistema
2. `packages/content` contém **somente dados e tipos**; nenhuma lógica de jogo
3. Os apps importam `core` e `content`; o inverso é proibido
4. Um app nunca importa outro app
5. Configure ESLint (`no-restricted-imports` e `no-restricted-globals`) para **barrar automaticamente** a regra 1. Isso deve ser feito já na fase 1

### 5.3 Separação em camadas

- **Núcleo** (`core`): estado, regras, colisão, spawn, pontuação, eventos, store de interface
- **Cascas de plataforma** (em cada app): relógio e loop, entrada, `Renderer`, `AudioPlayer`, armazenamento, telas
- **O React não desenha o jogo.** Ele cuida só de menus e HUD. O jogo roda em um loop próprio fora do ciclo de renderização do React

### 5.4 Contratos entre camadas (definir na fase 2, imutáveis sem aprovação)

```ts
// packages/core/src/input.ts
export interface Input {
  moveX: number; // inteiro de -127 a 127
  moveY: number; // inteiro de -127 a 127
  buttons: number; // bitmask: 1 = fire, 2 = bomb
}

// packages/core/src/renderer.ts
export interface Renderer {
  loadAssets(manifest: AssetManifest): Promise<void>;
  begin(logicalW: number, logicalH: number): void;
  drawSprite(
    id: string,
    x: number,
    y: number,
    o?: { rot?: number; alpha?: number; flipX?: boolean },
  ): void;
  drawRect(x: number, y: number, w: number, h: number, color: string): void;
  drawText(text: string, x: number, y: number, size: number): void;
  end(): void;
}

// packages/core/src/audio.ts
export interface AudioPlayer {
  playSfx(id: string): void;
  playMusic(id: string): void;
  stopMusic(): void;
  setVolume(channel: 'music' | 'sfx', value: number): void;
}

// packages/core/src/game.ts
export const STEP = 1 / 60;
export function createWorld(seed: number, levelId: string, difficulty: Difficulty): World;
export function step(world: World, input: Input): void; // altera o mundo no lugar
```

O núcleo **não toca áudio**: ele registra eventos em `world.events` (`shot`, `explosion`, `powerup`, `bossHit`, `playerHit`, e assim por diante), e a casca consome essa fila a cada passo.

---

## 6. ESPECIFICAÇÃO DO JOGO (GDD)

> Todos os números são **valores iniciais** para ajustar jogando. Centralize-os em `packages/content/balance.json` (ou `.ts` tipado), nunca espalhados pelo código.

### 6.1 Conceito e história própria

- **Título provisório:** Vanguarda
- **Premissa original (editável pelo desenvolvedor):** uma estação orbital de defesa foi tomada por uma inteligência artificial rebelde que fabrica enxames de drones. O jogador pilota o único protótipo de caça que ainda não foi desligado e atravessa três setores até destruir o núcleo da IA.
- **Tom:** arcade retrô, direto, sem diálogos longos. Textos de história curtos, em tela de abertura e de fim de mundo.

### 6.2 Tela e câmera

- **Orientação:** horizontal (paisagem), rolagem automática da esquerda para a direita
- **Resolução lógica:** **480 × 270** (16:9). Todo cálculo do jogo usa essa escala
- **Escala na tela:** o renderizador amplia com **escala inteira** quando possível e usa barras (letterbox) escuras no restante; sem suavização de pixels
- **Mobile:** orientação travada em paisagem, respeitando áreas seguras (notch)

### 6.3 Nave do jogador

| Parâmetro                     | Valor inicial                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------- |
| Hitbox                        | Círculo de raio 5 (menor que o sprite de ~24 × 16)                            |
| Velocidade máxima             | 140 unidades/s nos dois eixos                                                 |
| Vidas iniciais                | 3 (Fácil: 4)                                                                  |
| Invencibilidade após renascer | 2 s, com efeito de piscar                                                     |
| Limites                       | Fica dentro da tela visível                                                   |
| Ao ser atingida               | Escudo absorve; sem escudo, perde uma vida e o nível de arma cai 1 (mínimo 1) |
| Vida extra                    | A cada 50.000 pontos                                                          |

### 6.4 Armas e power-ups

| Item                               | Efeito                                      | Observação                    |
| ---------------------------------- | ------------------------------------------- | ----------------------------- |
| Tiro principal, nível 1 a 3        | Simples; duplo; triplo em leque             | Cadência inicial de 6 tiros/s |
| Míssil diagonal (cápsula especial) | Dispara também a 45° para cima e para baixo | Acumula com o nível da arma   |
| Escudo                             | Absorve 1 impacto                           | Máximo de 1 ativo             |
| Velocidade                         | +10% por cápsula                            | Máximo de 3 acúmulos          |
| Bomba                              | Limpa tiros inimigos e causa dano em área   | Botão `bomb`; máximo de 3     |
| Vida extra                         | +1 vida                                     | Raro                          |
| Bônus de pontos                    | Valor fixo                                  | Comum                         |

- Cápsulas caem de inimigos marcados nas ondas (`drop` no JSON), derivam lentamente para a esquerda e desaparecem ao sair da tela
- Cada tipo de cápsula tem **cor e letra** próprias (acessibilidade: nunca só cor)

### 6.5 Inimigos (originais; um conjunto base de 8 tipos)

| Tipo                  | Comportamento                                         | HP inicial |
| --------------------- | ----------------------------------------------------- | ---------- |
| Drone reto            | Avança em linha reta da direita para a esquerda       | 1          |
| Drone ondulante       | Segue trajetória em ondas (tabela pré-calculada)      | 1          |
| Zigue-zague           | Alterna subida e descida em degraus                   | 2          |
| Atirador              | Para em posição, atira em direção à nave a intervalos | 3          |
| Kamikaze              | Persegue a nave com giro limitado                     | 2          |
| Esquadrão em formação | Grupo de 5 que entra em fila e sai em arco            | 1 cada     |
| Torreta de cenário    | Fixa em parede (teto ou chão), mira e atira           | 4          |
| Mina flutuante        | Parada, explode em tiros radiais ao ser destruída     | 3          |

### 6.6 Cenário e passagens estreitas

- O cenário é um **mapa de blocos (tiles) de 16 × 16** que rola horizontalmente, com teto e chão em cavernas e corredores
- **Tocar em parede causa dano** (mesma regra de tiro inimigo). Há trechos com passagens estreitas que exigem precisão
- O mapa de blocos é definido em dados (seção 6.9) e colide com a nave por teste de círculo contra blocos sólidos
- Camadas de fundo com paralaxe (2 a 3 camadas) não participam de colisão

### 6.7 Mundos e chefes

| Mundo                | Tema visual                                     | Duração alvo | Chefe                                        |
| -------------------- | ----------------------------------------------- | ------------ | -------------------------------------------- |
| 1: Setor de Docas    | Metal azul, estaleiros, corredores largos       | 3 a 4 min    | Chefe com 2 fases de ataque                  |
| 2: Setor de Reatores | Laranja e vermelho, passagens estreitas e dutos | 4 min        | Chefe com 3 fases de ataque                  |
| 3: Núcleo da IA      | Roxo e verde neon, cenário orgânico-mecânico    | 4 a 5 min    | Chefe final com 3 fases e ataques combinados |

- Cada chefe tem barra de vida visível, padrões de ataque previsíveis e uma fase final mais agressiva
- Ao derrotar o chefe: pontuação de bônus, tela de resultado do mundo, passagem ao próximo

### 6.8 Pontuação e dificuldade

- Pontos por inimigo (valores em `balance.json`); **combo** que cresce ao destruir inimigos em sequência sem ser atingido e zera ao tomar dano
- Bônus por mundo concluído, por não perder vidas e por cápsulas coletadas
- Dificuldades **Fácil / Normal / Difícil**, alterando vidas iniciais, velocidade dos tiros inimigos e vida dos inimigos
- Recorde local salvo por dificuldade

### 6.9 Fases como dados (formato)

Cada mundo é um arquivo JSON validado por Zod em `packages/content`:

```ts
interface LevelData {
  id: string;
  scrollSpeed: number; // unidades/s
  tileSize: 16;
  terrain: string[]; // linhas de texto, um caractere por bloco ('.' vazio, '#' sólido, etc.)
  waves: Array<{
    tick: number; // instante de spawn em passos
    enemy: EnemyType;
    y: number;
    path?: string; // id de trajetória em paths.json (tabela de pontos)
    count?: number;
    spacing?: number;
    drop?: CapsuleType | null;
  }>;
  boss: { tick: number; type: BossType };
  background: { layers: Array<{ asset: string; speed: number }> };
  music: string;
}
```

Trajetórias ondulantes usam **tabelas de pontos pré-calculadas** (`paths.json`), geradas por um script de build, e não `Math.sin` em tempo de execução (ver 7.2).

### 6.10 Controles

| Ação       | Teclado (web)         | Gamepad            | Toque (mobile)                                                  |
| ---------- | --------------------- | ------------------ | --------------------------------------------------------------- |
| Mover      | Setas ou WASD         | Analógico esquerdo | Arrastar o dedo na metade esquerda da tela (movimento relativo) |
| Atirar     | Espaço ou Z (segurar) | Botão A            | Tiro automático                                                 |
| Bomba      | X                     | Botão B            | Botão na metade direita                                         |
| Pausa      | P ou Esc              | Start              | Botão de pausa                                                  |
| Mudo       | M                     | —                  | Configurações                                                   |
| Tela cheia | F                     | —                  | —                                                               |

- Opção "tiro automático" também na web
- Zona morta de cerca de 15% em analógicos
- Joystick virtual como alternativa nas configurações do mobile
- Pausa automática ao perder foco (`visibilitychange`) ou ir para segundo plano (`AppState`)

### 6.11 Telas e interface

Menu principal; Jogo (canvas + HUD com pontos, vidas, nível da arma, escudo, bombas e barra do chefe); Pausa; Configurações (volume de música e efeitos, controles, dificuldade, reduzir efeitos); Fim de jogo; Ranking; Créditos.

Acessibilidade mínima: botões reais com foco visível e navegação por teclado, respeito a `prefers-reduced-motion` (desliga tremor e flashes), opção de alto contraste, identificação das cápsulas por letra.

---

## 7. ESPECIFICAÇÃO TÉCNICA DO NÚCLEO

### 7.1 Loop de tempo fixo

- Passo fixo de 1/60 s dentro do núcleo; a casca acumula tempo real e chama `step` quantas vezes for preciso
- Limite de acúmulo por quadro de 0,25 s para evitar espiral de atrasos após troca de aba
- O renderizador recebe `alpha = acumulado / STEP` para interpolar posições entre o passo anterior e o atual

```ts
let acc = 0,
  last = performance.now();
function frame(now: number) {
  acc += Math.min((now - last) / 1000, 0.25);
  last = now;
  while (acc >= STEP) {
    step(world, readInput());
    acc -= STEP;
  }
  renderer.draw(world, acc / STEP);
  requestAnimationFrame(frame);
}
```

### 7.2 Determinismo (requisito de ranking e replays)

Mesma semente + mesma sequência de entradas **precisa** gerar exatamente a mesma partida em V8 (web e Node) e em Hermes (mobile).

1. **Proibido** no núcleo: `Math.random`, `Date.now`, `performance.now`, `setTimeout`, `setInterval`
2. Aleatoriedade somente por PRNG com semente (por exemplo, mulberry32) guardado em `world.rng`
3. Tempo somente por `world.tick`
4. **Evite** `Math.sin`, `Math.cos`, `Math.tan`, `Math.atan2`, `Math.exp`, `Math.pow` e `Math.hypot` na lógica: motores diferentes podem divergir nos últimos dígitos. Use tabelas pré-calculadas (inteiras ou arredondadas) e trajetórias por pontos. `Math.sqrt`, soma, subtração, multiplicação e divisão são seguros
5. Ordem de iteração das entidades é sempre a mesma (arrays indexados, sem depender da ordem de chaves de objetos ou `Map` com chaves não numéricas)
6. Ponto flutuante: arredonde posições para uma casa decimal fixa onde necessário e use comparações com tolerância definida

### 7.3 Entidades, pools e colisão

- Listas separadas por tipo (nave, inimigos, tiros do jogador, tiros inimigos, cápsulas, partículas, chefe)
- **Object pooling** obrigatório para tiros, inimigos e partículas; teto por tipo em `balance.json` (por exemplo, 150 tiros e 200 partículas)
- Sem alocação no loop quente: nada de `map`, `filter`, `spread`, objetos ou arrays literais dentro de `step` e do desenho; use laços `for` e variáveis reaproveitadas
- Colisão por círculos (e círculo contra bloco no cenário). Grade espacial só se o perfil mostrar necessidade
- Remoção de entidades mortas em passo único ao final de `step`

### 7.4 Ordem de `step`

`tick++` → entrada e movimento do jogador → rolagem e cenário → spawn por ondas → atualização de inimigos e chefe → atualização de tiros → colisões → pontuação, cápsulas e combo → eventos de áudio → condições de fim (morte, vitória do mundo).

### 7.5 Estado de alto nível e store de interface

- Máquina de estados fora do `step`: `menu` → `playing` ⇄ `paused` → `worldClear` → `gameover`
- Um **store** simples (TypeScript puro, `subscribe` e `getSnapshot`) guarda só o que a interface mostra (pontos, vidas, nível da arma, escudo, bombas, barra do chefe, estado), atualizado a cerca de **10 Hz**. Fica em `packages/core`
- Na web e no mobile, a interface lê o store com `useSyncExternalStore`

### 7.6 Replays

- Gravação: semente, id do mundo, dificuldade, **versão do core** e a lista de `Input` por passo, compactada por repetição (RLE)
- Reprodução headless (sem desenho) usada em testes e no servidor
- O arquivo de versão do core (`CORE_VERSION`) muda sempre que a lógica muda de forma que altere resultados

---

## 8. RENDERIZAÇÃO E ASSETS

### 8.1 Renderização

- Canvas 2D na web; `SkiaRenderer` no mobile; ambos implementam a mesma interface `Renderer`
- Sem suavização (`imageSmoothingEnabled = false` na web; amostragem por vizinho mais próximo no Skia)
- Na web, ajuste o tamanho real do canvas com `devicePixelRatio` e reduza com CSS
- Ordem de desenho: fundo (paralaxe) → cenário → inimigos → cápsulas → tiros → nave → efeitos → (HUD fica em React)
- Efeitos baratos obrigatórios: explosões em pool, tremor de tela e piscar de dano (todos desligáveis em "reduzir efeitos")

### 8.2 Estratégia de assets por etapa

- **Fases 2 e 3:** só **placeholders** (retângulos e formas geradas por código, sons curtos gerados por script ou ferramenta livre). Não gaste esforço com arte final antes do portão da fase 3
- **Fase 4 em diante:** arte e áudio finais, criados pelo desenvolvedor ou com licença livre registrada
- Padrões: pixel art em grade de 16 ou 32 px, paleta limitada (16 a 32 cores) por mundo; atlas de até 2048 × 2048 com JSON de coordenadas; nomes em minúsculas com hífen (`enemy-zigzag-01.png`); efeitos em WAV curto, música em MP3 ou AAC com loop sem emenda
- `assets/manifest.json` lista cada asset (id, caminho, retângulo no atlas); o jogo só lê o manifesto
- Fontes pixel apenas com licença livre (por exemplo, OFL)

### 8.3 Áudio

- Carregar todos os efeitos curtos antes da partida; limite de vozes simultâneas (por exemplo, 8)
- Volumes separados para música e efeitos; botão de mudo salvo nas configurações
- Na web, iniciar o áudio somente após a primeira interação do usuário (botão "Jogar")
- Variar levemente o tom de efeitos repetidos

---

## 9. PLANO DE EXECUÇÃO POR FASES

Cada fase tem: **objetivo**, **tarefas**, **entregáveis** e **critérios de aceite (portão)**. Ao terminar, execute o protocolo da seção 14 e **pare**.

### FASE 1: Preparação (≈ 1 semana)

**Objetivo:** repositório pronto, com toolchain e CI funcionando.

**Tarefas:**

1. Inicializar o repositório Git, `.gitignore`, `.editorconfig`, `.nvmrc` (Node LTS) e `README.md`
2. Configurar pnpm (Corepack), `pnpm-workspace.yaml`, Turborepo e scripts raiz (`dev`, `build`, `test`, `lint`, `typecheck`)
3. Criar `packages/config` (tsconfig base em `strict`, ESLint flat config, Prettier)
4. Criar os pacotes vazios `core` e `content` e o app `web` (Vite + React + TS) com uma página "Olá"
5. ESLint com regras que barram imports e globais proibidos em `core` (seção 5.2)
6. Configurar Vitest com um teste de exemplo em `core`
7. GitHub Actions: instalar com cache, `typecheck`, `lint`, `test`, `build`
8. Criar `docs/GDD.md` (a partir da seção 6, resumida em até 2 páginas), `docs/DECISIONS.md`, `docs/PROGRESS.md`, `docs/IDEAS.md` e `CREDITS.md`

**Portão:** `pnpm install && pnpm typecheck && pnpm lint && pnpm test && pnpm build` passam em máquina limpa e no CI; a regra de importação proibida **falha de propósito** quando testada.

### FASE 2: Protótipo do núcleo (≈ 3 a 4 semanas)

**Objetivo:** nave, tiros, um inimigo e colisão, jogáveis a 60 FPS com retângulos.

**Tarefas:**

1. Definir os contratos da seção 5.4 e o `World` tipado
2. Implementar PRNG com semente, `world.tick`, `STEP` e a ordem de `step` (7.4)
3. Nave: movimento, limites de tela, tiro principal nível 1, vidas e invencibilidade
4. Um inimigo (drone reto), seus tiros e a colisão por círculos
5. Pools de entidades e fila de eventos
6. Rolagem de cenário com blocos sólidos simples e colisão com a nave
7. `CanvasRenderer` na web (retângulos), loop de tempo fixo, entrada de teclado e leitura de gamepad
8. Gravação e reprodução de replay (7.6) e `CORE_VERSION`
9. Testes: colisão, pools, determinismo (duas execuções iguais), replay dourado (mesma semente e entradas = mesmo placar)

**Portão:** jogável no navegador, 60 FPS estáveis por 5 minutos, testes verdes, **teste de replay passando no CI**.

### FASE 3: Fatia vertical (≈ 4 a 5 semanas), PORTÃO DECISIVO

**Objetivo:** o primeiro mundo inteiro, divertido, antes de investir em arte, backend e mobile.

**Tarefas:**

1. Implementar os 8 tipos de inimigos (6.5) e trajetórias por tabela (`paths.json`)
2. Armas e todas as cápsulas (6.4), escudo, bomba, combo e pontuação
3. Torretas de cenário e passagens estreitas
4. Formato `LevelData` com validação Zod e o **Mundo 1** completo em JSON, com chefe de 2 fases
5. HUD mínimo em React ligado ao store (7.5), tela de pausa e de fim de partida
6. Sons provisórios via eventos do núcleo e `AudioPlayer` web
7. Balanceamento inicial em `balance.json`
8. Documento `docs/PLAYTEST.md` com roteiro e resultados de, no mínimo, 3 pessoas jogando sem instruções

**Portão (decide se o projeto continua):** o Mundo 1 é concluível, divertido por 5 minutos segundo os playtests, sem quedas de FPS, e os testes cobrem regras de dano, drops, combo e chefe.

### FASE 4: Jogo web completo (≈ 4 semanas)

**Objetivo:** produto web finalizado e publicado.

**Tarefas:**

1. Mundos 2 e 3 completos, com chefes de 3 fases
2. Todas as telas da seção 6.11, configurações e recorde local por dificuldade (`localStorage` encapsulado em uma interface de armazenamento)
3. Arte e áudio finais com atlas, `manifest.json` e `CREDITS.md` completo
4. Acessibilidade básica (teclado, foco, `prefers-reduced-motion`, alto contraste, letras nas cápsulas)
5. Pausa por perda de foco, tela cheia, escala inteira com letterbox
6. Testes e2e com Playwright (abrir, jogar, pausar, terminar, salvar recorde)
7. Otimização conforme seção 11 e publicação (por exemplo, itch.io ou hospedagem estática)

**Portão:** versão web publicada, testada em Chrome, Firefox e Safari, e jogada por 5 testadores sem erros críticos.

### FASE 5: Backend e ranking (≈ 3 semanas)

**Objetivo:** ranking online validado por replay.

**Tarefas:**

1. `apps/server` com Fastify, Zod, configuração por variáveis de ambiente e logs
2. Banco com tabelas `players`, `scores`, `saves` e migrações
3. Rotas: `POST /auth/anonymous`, `POST /scores`, `GET /leaderboard`, `GET /me/save`, `PUT /me/save`
4. Validação de pontuação: o servidor reexecuta o replay **headless** com o mesmo `core` e compara a pontuação; rejeita divergências, versões de core não suportadas e replays inválidos
5. Segurança: validação estrita de entrada, limite de tamanho do corpo, rate limiting, cabeçalhos seguros, CORS restrito, HTTPS, token guardado apenas como hash
6. Cliente de API no web, tela de ranking e envio ao final da partida
7. Testes: Vitest e Supertest (rotas, validação, trapaça), e teste que confirma o mesmo resultado do replay entre navegador e Node
8. Implantação com ambiente de testes separado do de produção

**Portão:** ranking aceita apenas partidas validadas pelo replay; testes de trapaça passam; política de privacidade (LGPD) rascunhada em `docs/`.

### FASE 6: Port mobile (≈ 5 a 6 semanas)

**Objetivo:** app React Native em paisagem com 60 FPS.

**Tarefas:**

1. Criar `apps/mobile` com Expo (template TypeScript) integrado ao monorepo; ajustar o Metro e, se necessário, `node-linker=hoisted` no `.npmrc`
2. Instalar Skia, Reanimated, Gesture Handler, `expo-audio` e AsyncStorage
3. `SkiaRenderer` implementando `Renderer`; o desenho **não pode** re-renderizar componentes React a cada quadro (use valores compartilhados do Reanimated e `Picture` do Skia; confirme o padrão atual na documentação)
4. Loop de tempo fixo ligado ao quadro do app
5. Entrada por toque (arrastar relativo, tiro automático, botão de bomba) e opção de joystick virtual
6. `AudioPlayer` com `expo-audio`; medir latência em aparelho real
7. Telas e HUD com componentes nativos, lendo o mesmo store; armazenamento com AsyncStorage
8. Ciclo de vida: pausar em segundo plano, áreas seguras, travar em paisagem, manter tela acesa durante a partida
9. **Rodar o replay dourado no Hermes** e provar resultado idêntico ao da web e do Node
10. Perfil de desempenho em Android modesto e iPhone; builds de teste com EAS Build

**Portão:** 60 FPS estáveis por 10 minutos em celular Android intermediário; replay idêntico no Hermes; build de teste instalável.

### FASE 7: Polimento e lançamento (≈ 4 semanas)

**Objetivo:** publicar nas lojas.

**Tarefas:**

1. Correção de falhas, rebalanceamento final e passe de acessibilidade
2. Monetização conforme decisão do desenvolvedor (padrão sugerido: anúncios somente entre partidas e compra única para removê-los), com consentimento quando exigido
3. Política de privacidade publicada, formulários de segurança de dados e rótulos de privacidade
4. Fichas de loja (textos, capturas de tela, ícone, classificação etária) como rascunho em `docs/store/`
5. Monitoramento de falhas (Sentry ou Crashlytics) e checklist de lançamento
6. Teste fechado e envio para revisão

**Portão:** aprovado nas lojas ou com todos os requisitos preenchidos e builds de produção prontos para envio.

---

## 10. PADRÕES DE CÓDIGO

- TypeScript `strict`, sem `any` (use `unknown` e estreitamento); proibido `@ts-ignore` sem comentário justificando e aprovação
- Identificadores, nomes de arquivos e commits em **inglês**; comentários explicativos, documentação e mensagens de relatório em **português do Brasil**
- Funções pequenas e com uma responsabilidade; nomes descritivos; sem números mágicos (valores de jogo vêm de `balance.json`)
- Nada de classes com efeitos colaterais escondidos no núcleo; prefira funções e dados simples
- Arquivos de código com até cerca de 300 linhas; divida quando passar
- Imports absolutos por alias de workspace (`@vanguarda/core`, `@vanguarda/content`)
- Sem dependências desnecessárias: antes de adicionar uma biblioteca, justifique em `docs/DECISIONS.md` (por que, tamanho, manutenção, licença)
- Comentários explicam o **porquê**, não o óbvio

---

## 11. DESEMPENHO

| Meta            | Valor                                                             |
| --------------- | ----------------------------------------------------------------- |
| Taxa de quadros | 60 FPS estáveis por 10 minutos, na web e no celular intermediário |
| Custo de `step` | Abaixo de 2 ms em celular intermediário                           |
| Entidades       | Teto por tipo definido em `balance.json`                          |
| Memória         | Estável ao longo da partida, sem crescimento contínuo             |
| Tamanho         | Atlas comprimidos; áudio em bitrate razoável                      |

Regras: pools, nenhuma alocação no loop quente, atlas e poucas trocas de textura, fundo estático em cache (canvas fora da tela), limites duros de partículas. **Meça antes de otimizar** (Chrome DevTools Performance e Memory na web; ferramentas do React Native, Android Studio Profiler e Instruments no mobile) e registre os números nos relatórios.

---

## 12. TESTES E QUALIDADE

| Camada   | Ferramenta                       | O que testar                                                                                                 |
| -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Núcleo   | Vitest                           | Colisão, pontuação, power-ups, ondas por tick, chefes, fim de jogo; cobertura alvo de 80% ou mais nas regras |
| Replays  | Vitest                           | Mesma semente e entradas geram sempre o mesmo placar (teste dourado)                                         |
| Servidor | Vitest + Supertest               | Rotas, validação, limites, trapaça                                                                           |
| Web      | Playwright                       | Fluxo completo: iniciar, jogar, pausar, terminar, salvar                                                     |
| Mobile   | Maestro                          | Fluxos de tela e toque em emulador e aparelho real                                                           |
| Estático | `tsc --noEmit`, ESLint, Prettier | Em todo commit e no CI                                                                                       |

- Escreva os testes **junto** com a funcionalidade, não depois
- Corrigiu um bug? Adicione um teste que o reproduz
- O CI bloqueia merge se qualquer verificação falhar
- Checklist manual por versão: 10 minutos sem queda de FPS nem vazamento; pausa ao trocar de aba ou app; telas pequenas e grandes; sem som até o primeiro clique; sem erros no console; recorde e configurações persistem

---

## 13. SEGURANÇA E PRIVACIDADE

- Nunca coloque segredos, chaves ou tokens no repositório; use variáveis de ambiente e `.env.example`
- Valide toda entrada externa com Zod; trate o cliente como não confiável
- O servidor valida pontuação por replay; nunca confia na pontuação declarada
- Rate limiting, limite de tamanho de corpo, CORS restrito, HTTPS, cabeçalhos de segurança
- Colete o mínimo de dados; documente o que é coletado, para quê e como excluir (LGPD)
- Dependências: rode auditoria (`pnpm audit`) e mantenha o lockfile versionado
- Não execute comandos destrutivos (`rm -rf`, `git reset --hard`, `git push --force`) nem acesse fora da pasta do projeto sem pedir autorização

---

## 14. PROTOCOLO DE COMUNICAÇÃO

### 14.1 Início de cada fase

Publique:

1. Objetivo da fase em uma frase
2. Lista de tarefas, na ordem, com estimativa de esforço (pequena, média, grande)
3. Arquivos que serão criados ou alterados
4. Riscos e dúvidas (se houver, aplique a seção 15)

### 14.2 Durante a fase

- Mantenha a lista de tarefas atualizada e `docs/PROGRESS.md` em dia
- Commits pequenos; ao final de cada tarefa, `typecheck`, `lint` e `test` verdes
- Não narre cada comando; comunique marcos, bloqueios e decisões

### 14.3 Fim de cada fase: relatório obrigatório

Crie `docs/phases/PHASE-N-REPORT.md` e resuma no chat:

1. **O que foi entregue** (lista objetiva)
2. **Como verificar** (comandos exatos para rodar e testar, em PowerShell e em shell genérico quando diferirem)
3. **Resultado dos critérios de aceite** (cada item do portão: cumprido, não cumprido ou não verificável, com evidência)
4. **Decisões tomadas e o porquê** (com link para `DECISIONS.md`)
5. **Medições** (FPS, tempo de `step`, memória, tamanho), quando aplicável
6. **Problemas conhecidos e dívidas técnicas**
7. **Próximos passos propostos**

Depois, **pare e peça aprovação explícita** para a próxima fase.

---

## 15. QUANDO PERGUNTAR E QUANDO DECIDIR

**Decida sozinho** (e registre) quando a questão for técnica, reversível e de baixo impacto, e houver um padrão neste documento.

**Pergunte ao desenvolvedor** (no máximo 3 perguntas objetivas, com sua recomendação) quando:

- A decisão afetar o design de jogo, a identidade, o nome, o orçamento ou a monetização
- Algo neste documento for contraditório, ambíguo ou impossível
- Uma troca de tecnologia da seção 4 parecer necessária
- Uma ação for destrutiva ou irreversível
- Faltar um dado que só o desenvolvedor tem (contas de loja, credenciais, preferências de arte)

**Padrões assumidos enquanto não houver resposta:**

| Decisão em aberto      | Padrão                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| Nome do jogo           | "Vanguarda" (provisório)                                                                 |
| Resolução lógica       | 480 × 270                                                                                |
| Estilo de arte         | Pixel art                                                                                |
| Monetização            | Web grátis; mobile grátis com anúncios entre partidas e compra única para removê-los     |
| Hospedagem do servidor | Serviço gerenciado com banco PostgreSQL (escolha a opção mais simples e barata na época) |
| Idioma do jogo         | Português do Brasil, com estrutura pronta para inglês (textos em arquivo, não no código) |

---

## 16. MENSAGEM DE INÍCIO (o desenvolvedor envia isto ao agente)

> Leia o `AGENTS.md` por completo. Confirme em 5 linhas o que entendeu da missão, das regras de arquitetura e do plano de fases. Depois execute a **Fase 1** seguindo o protocolo da seção 14 (plano, execução, relatório) e pare para a minha aprovação.

---

## 17. CHECKLIST GLOBAL DE PRONTO (por tarefa e por fase)

- [ ] O código compila em `strict` e passa em `typecheck`, `lint` e `test`
- [ ] Há testes para a lógica nova e para os bugs corrigidos
- [ ] Nenhuma regra de dependência (5.2) foi violada
- [ ] Nenhum uso proibido no núcleo (7.2)
- [ ] Todo asset novo está em `CREDITS.md` com licença confirmada
- [ ] Valores de jogo estão em `balance.json`, não no código
- [ ] `docs/PROGRESS.md` e `docs/DECISIONS.md` estão atualizados
- [ ] O relatório de fase foi escrito e a aprovação foi solicitada
- [ ] Nada além do escopo foi adicionado

---

## 18. O QUE VOCÊ NÃO DEVE FAZER

- Não copiar, baixar ou imitar de perto assets, textos ou fases do jogo original
- Não avançar de fase sem aprovação
- Não declarar algo "pronto" sem ter executado a verificação
- Não usar `Math.random`, relógio do sistema ou APIs de plataforma dentro de `packages/core`
- Não re-renderizar componentes React a cada quadro para desenhar o jogo
- Não adicionar dependências ou funcionalidades fora do escopo sem aprovação
- Não inventar versões, comandos ou APIs: consulte a documentação oficial
- Não executar ações destrutivas ou sair da pasta do projeto sem autorização
- Não deixar segredos no código ou no histórico do Git
