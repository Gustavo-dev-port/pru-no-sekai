# PRU NO SEKAI — Entrega 05: Módulo 3, parte 2 (refinamento visual + Auditoria 004)

A lógica aprovada na Entrega 04 foi mantida:
- invasão aos **20 grãos** com **26 pombos**;
- etapas 1 → 2 → 3 → 5 → 8;
- as mesmas falas.

O módulo não foi reescrito: as mudanças estendem os arquivos existentes e a arquitetura de sprites.

## 1. Arquivos alterados

| Arquivo | O que mudou |
| --- | --- |
| `src/pixel/sprites/pigeon.ts` | expressões (feliz, surpreso, satisfeito), asa bem aberta, "!" de susto |
| `src/pixel/sprites/props.ts` | coraçãozinho da reação de etapa |
| `src/components/Pigeon.tsx` / `.css` | poses `stand`/`tilt`/`reach`, `expression`, `exclaim`, bater de asas com fim (`flapOnMountMs`); a cabeça pode sair do quadro na bicada |
| `src/pixel/PixelSprite.tsx` | opção `crop` (recorte, usada no retrato) |
| `src/pixel/garden.ts` | exporta as funções de desenho para reuso |
| `src/pixel/plaza.ts` *(novo)* | cenário da Praça dos Pombos em pixel art |
| `src/components/PixelCanvas.tsx` *(novo)* | canvas de fundo com pixel de 4px que acompanha o tamanho do pai |
| `src/data/feedGame.ts` | posições ajustadas (longe da plaquinha e das bordas), expressão de cada invasor, `FRONT_ROW_Y` |
| `src/modules/feed/feedLogic.ts` | `pickTarget` (alvo do grão) e `announcementFor` (anúncio acessível) |
| `src/modules/feed/FeedPage.tsx` | linha do tempo da bicada, temporizadores canceláveis, anúncio único, reações da invasão, Recomeçar junto aos contadores |
| `src/modules/feed/FeedArena.tsx` | cenário em canvas, posicionamento em px, grão sob o bico, "nhac!", farelos, corações, faixa nova |
| `src/modules/feed/GuardianPortrait.tsx` *(novo)* | retrato do Pombo-sama na caixa de diálogo |
| `src/modules/feed/Feed.css` | todos os efeitos em quadros, layout compacto para telas baixas, botão principal fixo |
| `src/styles/tokens.css` | `--bottom-nav-h` |
| `src/modules/feed/*.test.*`, `src/pixel/sprites.test.ts` | testes novos (ver seção 3) |
| `docs/entrega-05/*.jpg` | capturas antes/depois |

## 2. Melhorias visuais

### Bicada (cada grão tem a sua linha do tempo; toques rápidos não esperam)
| ms | quadro |
| --- | --- |
| 0 | o grão cai 7 pixels em 2 quadros, na frente do pombo |
| 160 | o pombo **inclina a cabeça** (quadro 1) |
| 280 | **o bico chega ao grão** (quadro 2, cabeça no chão, olhinhos ^ ^), o grão some, saem **4 farelos** e **"nhac!"** sobe em 4 quadros |
| 440 | a cabeça volta a inclinar |
| 560 | o pombo fica em pé de novo |

O grão é posicionado exatamente na ponta do bico da pose de bicada: 15 pixels do sprite à frente do centro e 2 pixels acima da linha dos pés.

### Expressões (reaproveitáveis em qualquer módulo)
São remendos sobre a cabeça do mesmo pombo base (`PIGEON_EXPRESSIONS`):

| Expressão | Desenho | Onde aparece |
| --- | --- | --- |
| **normal** | olho com brilho | padrão |
| **feliz** | olhinhos ^ ^ | ao bicar |
| **surpreso** | olho arregalado 3×3 | grupo principal ao ver a invasão (com "!"), invasores, retrato do Pombo-sama |
| **satisfeito** | olho em traço + bochecha maior | parte dos invasores |

### Asas
- Novo quadro de **asa bem aberta** (`PIGEON_WING_OPEN`), além da asa levantada que já existia.
- O bater de asas tem **6 quadros de 110 ms e para sozinho**. Nenhum dos 26 pombos fica batendo asas sem parar.
- Usado:
  - na chegada de cada pombo novo;
  - na queda de cada invasor (sincronizado com o atraso de chegada);
  - no Pombo-sama quando é cutucado (mantido do santuário).

### Praça dos Pombos (鳩の広場)
Desenhada em canvas, com a mesma regra de 4px e a mesma paleta do santuário:
- faixa de céu com pontilhado e **cerca de bambu**;
- **cerejeira** no canto esquerdo;
- **lanterna de pedra** acesa no canto direito;
- **cantinho de descanso:** banquinho com almofada de sakura e tigelinha d'água;
- **canteiros** de madeira com arbustos e florzinhas nos cantos de baixo;
- **ladrilhos de pedra** em fileiras desencontradas, com rejunte, brilho e musguinho, além de grama nas laterais;
- pétalas caídas no chão e **3 pétalas** caindo devagar.

Tudo isso é **fundo**: pombos, grãos, efeitos e a faixa ficam sempre por cima. Nenhum pombo fica sobre a plaquinha (y ≥ 55%).

### Partículas e reações
- **Farelos + "nhac!"** a cada bicada.
- **Nova etapa:** 3 coraçõezinhos e um selo "+1 pombo!" (ou "+2 pombos!") sobre quem chegou. Se as etapas mudarem muito rápido, só a reação mais recente fica na tela.
- **Invasão:**
  - os invasores chegam um a um (a cada 90 ms), caindo do céu e batendo asas, com caras variadas;
  - o grupo principal se assusta (olho arregalado + "!" piscando) por 1,6 s;
  - a faixa **"INVASÃO! / 26 pombos!"** entra em 4 quadros e balança 2 vezes;
  - **reação especial do Pombo-sama:** o retrato dele na caixa de diálogo arregala os olhos, ganha fundo dourado e "!", pula, e a caixa treme.

Com movimento reduzido: sem pétalas, farelos ou corações voando. As poses mudam sem animação e o jogo funciona igual.

## 3. Testes automatizados
`npm test`: **58 testes em 7 arquivos, todos passando** (eram 49; nenhum teste antigo foi removido).

Um teste antigo foi ajustado de propósito. Ele exigia `aria-live` no balão; agora exige que o balão **não** tenha `aria-live`, porque o anúncio passou para uma região de status própria (AUD-004-03).

Novos testes:

| Teste | Cobre |
| --- | --- |
| bicada: o grão cai, some quando o bico chega (com "nhac!") e o pombo volta ao normal | bicada |
| recomeçar no meio de várias animações cancela todos os temporizadores (`vi.getTimerCount() === 0`) | AUD-004-01 |
| a invasão é anunciada em texto, com a quantidade de pombos | AUD-004-03 |
| cliques seguidos sem mudança de etapa não geram novos anúncios | AUD-004-03 |
| nova etapa mostra corações e "+1 pombo!" | partículas |
| na invasão, o grupo se assusta, depois volta ao normal, e o retrato reage | invasão |
| na invasão, os grãos só vão para a fileira da frente | AUD-004-02 |
| prefere pombo livre; se todos estiverem ocupados, usa um visível | AUD-004-02 |
| o anúncio diz a fala e a quantidade de pombos | AUD-004-03 |
| todos os pombos ficam dentro da praça e abaixo da plaquinha | AUD-004-04 |
| grades das expressões, da asa aberta e do "!" | consistência de sprites |

## 4. Build de produção
`npm run build`: **sem erros**.

| Pacote | JS gzip | CSS gzip |
| --- | --- | --- |
| Pacote inicial | 78,4 KB (era 77,6) | — |
| Módulo 3 (carregado sob demanda) | 4,5 KB (era 2,4) | 2,0 KB |

Nenhuma dependência nova: o cenário e os efeitos são canvas, SVG e CSS.

## 5. Antes × depois

| | Antes (Entrega 04) | Depois (Entrega 05) |
| --- | --- | --- |
| Grupo / início | `entrega-05/antes-375-grupo.jpg` | `entrega-05/depois-375-inicio.jpg` |
| Bicada | (cabeça descia só 2 pixels, sem efeito) | `entrega-05/depois-375-bicada-nhac.jpg` |
| Invasão | `entrega-05/antes-375-invasao.jpg` | `entrega-05/depois-390x844-invasao.jpg` |

Diferenças visíveis:
- **Antes:**
  - chão em xadrez liso;
  - pombos cortados nas bordas e cobrindo a plaquinha;
  - nenhuma reação ao grão além de 2 pixels de cabeça;
  - faixa simples.
- **Depois:**
  - praça com cenário próprio;
  - todos os pombos inteiros;
  - bicada completa com "nhac!" e farelos;
  - corações nas etapas;
  - invasão com caras, asas e o Pombo-sama reagindo.

## 6. Evidências em viewport mobile (Chromium, emulação)
Medições feitas com o próprio navegador. "Pombos fora" = sprites passando da borda da praça.

| Tela | Pombos fora | Botão "Jogar grãozinho" | Recomeçar e contadores | Captura |
| --- | --- | --- | --- | --- |
| 390×844 | 0 | visível (termina em 684px; a barra começa em 762px) | visíveis | `depois-390x844-invasao.jpg` |
| 375×812 | 0 | visível | visíveis | `depois-375-bicada-nhac.jpg` |
| 375×667 | 0 | visível (550px / barra em 585px) | visíveis | `depois-375x667-invasao.jpg` |
| 320×568 | 0 | **sempre visível** (fica fixo acima da barra) | aparecem rolando um pouco a página | `depois-320x568-invasao.jpg` |

Nenhuma rolagem horizontal em 320px. Também confirmado que o Pombo-sama do santuário continua pulando e batendo asas ao ser cutucado.

## 7. Resolução da Auditoria 004

**AUD-004-01 — Temporizadores. RESOLVIDO.**
- Todo temporizador do jogo passa por `schedule()`: fases da bicada, remoção do grão, efeitos e fim do susto.
- "Recomeçar" chama `cancelAllTimers()`, que cancela tudo de uma vez, e limpa grãos, efeitos e susto.
- Grãos antigos não disparam mais nada depois do reinício.
- Teste: 20 grãos, avança 200 ms (bicadas e invasão no meio), recomeça → `vi.getTimerCount()` é 0. Avançando mais 5 s, nada reaparece.

**AUD-004-02 — Alimentação na invasão. RESOLVIDO.**
- `pickTarget()`: durante a invasão, só pombos da **fileira da frente** (pés abaixo de 72% da altura) recebem grão, porque não ficam escondidos atrás dos outros. Fora da invasão, prefere um pombo **que não esteja bicando**, para cada grão ter a sua bicada visível.
- Grão fora da área útil: a posição de pombos, grãos e efeitos usa `clamp()` em **pixels**. Assim o pombo inteiro, e o grão na ponta do bico, ficam sempre dentro da praça, em qualquer largura. Os slots também foram ajustados (x de 12 a 89, y de 55 a 97).
- Bicada associada ao grão: o grão cai exatamente onde o bico chega no quadro "reach", com a mesma camada de profundidade do pombo dono do grão.

**AUD-004-03 — Acessibilidade. RESOLVIDO.**
- Uma **única** região `role="status"` (`aria-atomic`) anuncia, por exemplo:
  - "Invasão dos pombos! Você chamou reforços. Agora são 26 pombos reunidos."
  - "Chegou um amigo… 2 pombos reunidos."
  - "Todos os pombos foram embora. Por enquanto. 1 pombo reunido."
- O balão visível deixou de ser `aria-live`, para não haver anúncio duplicado.
- Só há anúncio em mudança de etapa, na invasão e no reinício. Grãos dentro da mesma etapa não anunciam nada (teste dedicado).
- Teclado, foco visível, `aria-disabled` no Recomeçar e movimento reduzido foram mantidos. A praça continua `aria-hidden`.

**AUD-004-04 — Responsividade. RESOLVIDO.**
- Sprites completos: medido 0 pombos fora da praça em 320, 375 e 390px.
- A altura da praça acompanha a tela (248–340px).
- Em telas baixas, o layout fica mais compacto: título menor e linha de cima escondida.
- "Recomeçar" foi para o lado dos contadores, e "Jogar grãozinho" fica fixo acima da barra inferior quando a tela é muito baixa.
- Sobreposições: os efeitos de etapa não se empilham mais, e nenhum pombo cobre a plaquinha.

## 8. Pendências
- [ ] **Celular real:** tudo foi verificado em emulação no Chromium. Falta testar em iPhone e Android de verdade, principalmente a fluidez com 26 pombos.
- [ ] **320×568:** os contadores ficam logo abaixo do botão fixo e aparecem rolando um pouco. Em telas a partir de 375×667 cabe tudo sem rolar.
- [ ] **Invasão:** com 26 pombos de 96px numa praça de 280px (celular estreito), a multidão se sobrepõe bastante. É de propósito ("caos engraçado"), mas fica mais densa que em 390px.
- [ ] Os invasores não balançam a cabeça nem piscam depois de pousar, por desempenho. As caras variadas ficam paradas.
- [ ] Ainda sem efeitos sonoros (não pedidos).
