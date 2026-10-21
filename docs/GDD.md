# Game Design Document (GDD) — Vanguarda

> Documento de Especificação Resumida do Jogo (Fases 1 a 4)

---

## 1. Visão Geral e Conceito

- **Gênero:** Shoot 'em up horizontal retrô de rolagem contínua (side-scroller arcade).
- **Título Provisório:** Vanguarda (`{{GAME_TITLE}}`).
- **Público-alvo:** Jogadores casuais e entusiastas de arcades retrô dos anos 90, em navegadores e dispositivos móveis.
- **Premissa:** Uma estação orbital de defesa foi dominada por uma inteligência artificial rebelde que sintetiza enxames autônomos de drones. O jogador assume o controle do protótipo caça "Vanguarda" em incursão por três setores críticos até aniquilar o núcleo da IA.

---

## 2. Parâmetros de Tela e Câmera

- **Orientação:** Paisagem (horizontal), rolagem automática da esquerda para a direita.
- **Resolução Lógica Interna:** **480 × 270** pixels (formato 16:9). Todos os cálculos de física, colisão e coordenadas operam nessa escala.
- **Renderização e Escala:** Ampliação por inteiros (_pixel-perfect integer scaling_) com _letterbox_ escuro. Amostragem _nearest neighbor_ (sem bilinear/suavização). No mobile, rotação travada em paisagem respeitando _safe areas_ (notch).

---

## 3. Nave do Jogador e Mecânicas

- **Hitbox:** Círculo de precisão de raio 5 unidades (centralizado no sprite de ~24 × 16).
- **Velocidade Máxima:** 140 unidades/segundo nos eixos X e Y.
- **Vidas e Dano:** 3 vidas iniciais (Fácil: 4). Escudo absorve 1 impacto. Sem escudo, o impacto destrói a nave, consome 1 vida, reduz o nível de arma em 1 (mínimo 1) e concede 2 segundos de invencibilidade com piscar visual.
- **Vida Extra:** Concedida a cada 50.000 pontos.

---

## 4. Arsenal e Power-ups

Cápsulas caem de inimigos designados e derivam para a esquerda. Cada uma exibe cor e letra única:

- **Tiro Principal (Níveis 1 a 3):** Simples, duplo paralelo e triplo em leque (cadência de 6 tiros/s).
- **Míssil Diagonal:** Disparo simultâneo a 45° superior e inferior.
- **Escudo [S]:** Absorve 1 dano frontal/colisão (máximo 1 ativo).
- **Velocidade [V]:** +10% de velocidade (máximo 3 acúmulos).
- **Bomba [B]:** Dano em área e eliminação de projéteis inimigos na tela (máximo 3).
- **Vida Extra [L]:** +1 vida adicional.
- **Pontos [P]:** Bônus fixo imediato de pontuação.

---

## 5. Inimigos Base (8 Tipos Originais)

1. **Drone Reto:** Avança linearmente em linha reta (1 HP).
2. **Drone Ondulante:** Trajetória em onda via tabela de pontos pré-calculados (1 HP).
3. **Zigue-zague:** Movimenta-se alternando degraus verticais (2 HP).
4. **Atirador:** Estaciona em posição estratégica e dispara projéteis mirados (3 HP).
5. **Kamikaze:** Acelera em perseguição direta à nave com giro angular limitado (2 HP).
6. **Esquadrão em Formação:** Grupo de 5 drones entrando em fila e dispersando em arco (1 HP cada).
7. **Torreta de Cenário:** Fixada em tetos/pisos sólidos com mira angular (4 HP).
8. **Mina Flutuante:** Estática no espaço; fragmenta-se em tiros radiais ao ser destruída (3 HP).

---

## 6. Cenário e Passagens Estreitas

- Mapa de blocos (_tiles_) de 16 × 16 rolando horizontalmente.
- **Colisão com Paredes:** Tocar em superfícies sólidas causa dano imediato (mesma penalidade de projétil inimigo).
- Fundo em paralaxe com 2 a 3 camadas independentes sem colisão.

---

## 7. Mundos e Chefes

1. **Mundo 1 (Setor de Docas):** Metal azul, estaleiros espaciais, passagens largas. Chefe com 2 fases de ataque.
2. **Mundo 2 (Setor de Reatores):** Tons quentes, passagens estreitas e dutos industriais. Chefe com 3 fases de ataque.
3. **Mundo 3 (Núcleo da IA):** Roxo e verde neon, biologia cibernética. Chefe final com 3 fases e padrões compostos.

---

## 8. Controles e Acessibilidade

- **Web:** Setas/WASD (mover), Espaço/Z (atirar contínuo), X (bomba), P/Esc (pausar). Suporte a Gamepad analógico com _deadzone_ de 15%.
- **Mobile:** Toque relativo na metade esquerda (movimento), disparo automático padrão, botão de bomba e pausa na metade direita.
- **Acessibilidade:** Suporte a `prefers-reduced-motion` (desativa tremores de tela/flashes), alto contraste e letras indicativas nas cápsulas.
