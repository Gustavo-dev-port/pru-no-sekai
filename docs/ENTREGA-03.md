# PRU NO SEKAI — Entrega 03: migração para pixel art (Fase 1)

Escopo do briefing de direção de arte v0.2: **Módulo 1 (Santuário) e Módulo 2 (Oráculo) migrados para pixel art kawaii.** Os módulos 3 e 4 continuam como telas "em construção", mas já com a UI pixel, porque usam os mesmos componentes.

---

## 1. Design system da fase pixel art

### A regra de ouro: 1 pixel do jogo = 4px de CSS (`--px`)
Tudo o que é "mundo" usa essa mesma espessura de pixel:
- sprites de pombos e objetos
- o cenário
- as molduras da UI
- as sombras
- os deslocamentos das animações

O cenário de abertura é desenhado em um canvas com 1/4 do tamanho da tela e ampliado sem suavização, então cada pixel mede exatamente 4×4px, no celular e no desktop. Os espaçamentos também são múltiplos de 4.

**Exceção consciente:** ícones pequenos de interface (barra inferior, chips de categoria) usam pixel de 3px, como um HUD de jogo. Assim eles cabem no espaço sem perder a forma.

### Paleta
A fonte única é `src/pixel/palette.ts`. Os sprites e o canvas leem dali, e a UI usa os mesmos valores via `--px-*` em `tokens.css`.

| Grupo | Cores |
| --- | --- |
| Contorno/texto | ameixa `#4a3b42` (nunca preto puro), laca `#3a3036` só em detalhes do torii e do chapéu |
| Sakura | `#ffe4ec` `#ffc9d9` `#ffa3bf` `#f08fb0`; ação principal `#b03c63` (contraste AA) |
| Creme/papel | `#fffbf3` `#fdf3e1` `#ead3a8` |
| Sálvia | `#cfe0c4` `#b9cfae` `#86a878` |
| Torii | `#e0533d`, com luz `#ef7a63` e sombra `#a8352a` |
| Detalhes especiais | dourado `#e8c46a`, brilho de lanterna `#ffd98a` |
| Pombo | `#e6e1ee` peito, `#bab3c9` corpo, `#9d95b0` asa, `#6f6786` faixas, pescoço `#6cb59b`/`#9b7fc1` |

Nada de neon nem saturação alta. Degradês são feitos em **faixas com pontilhado** (dithering), como em jogos antigos.

### Tipografia
- **DotGothic16** (fonte pixel japonesa, também cobre português): títulos, botões, selos, nome do personagem e kanji do carimbo da sorte.
- **Zen Maru Gothic** (arredondada): todo texto longo, como as falas do Pombo-sama, as previsões e as descrições. Isso segue a recomendação do briefing de não usar fonte pixel em parágrafos.
- Tamanhos da fonte pixel em múltiplos da grade dela (16/32/64px) sempre que possível, para ficar nítida.

### Componentes de UI
- **Moldura pixel (`.px-box`).** Borda de 1 pixel do jogo com os **cantos em degrau**, brilho em cima, sombra embaixo e sombra dura deslocada. É feita só com `box-shadow`: não corta conteúdo nem o anel de foco. Cor, preenchimento e sombra são ajustáveis por variáveis (`--fill`, `--frame`, `--shade`). Usada em:
  - botões
  - caixa de diálogo
  - ema
  - papel da previsão
  - cartões
- **Botões:** fonte pixel e moldura. Ao apertar, afundam 1 pixel e perdem a sombra, em um único quadro.
- **Caixa de diálogo de RPG:** etiqueta com o nome "Pombo-sama", texto que entra em um quadro e rabinho em degraus (sprite).
- **Ema:** plaquinha de madeira com veios, pendurada por um nó de cordão vermelho (sprite).
- **Selos, chips e barra inferior:** bordas pixel de 2px. A aba atual tem moldura rosa.
- **Foco do teclado:** contorno tracejado de 4px, sempre por fora do elemento. Na ema, fica 12px fora da moldura.

### Movimento
Toda animação é **em quadros** (`steps()`) ou troca de sprite, nunca deslizando liso:

| Animação | Como é |
| --- | --- |
| Bob de cabeça | a camada da cabeça anda 1 pixel para a frente a cada 2 quadros (220 ms/quadro) |
| Piscada | 1 quadro a cada ~3,7 s |
| Bater asinhas + pulinho | ao cutucar o pombo: asa alterna cima/baixo e o pombo sobe 2 pixels em 3 quadros |
| Balanço das lanternas | 1 pixel para cada lado, em 4 quadros |
| Pétalas | sprites de 3×3 caindo aos trancos (48 passos) |
| Entrada no santuário | zoom em 7 quadros pelo vão do torii (continua pixelado) + clarão quadriculado |
| Oráculo | caixa sacode em trancos de 1 pixel, o palitinho sobe em 3 degraus, o papel desenrola em 6 quadros e o carimbo cai em 3 |

Com **movimento reduzido**, nada disso roda: os sprites ficam no quadro 0, as pétalas somem e as revelações são imediatas.

## 2. Sprites: decisões de consistência

- **Um único pombo base** (`src/pixel/sprites/pigeon.ts`), em grade de 24×24 pixels, sempre olhando para a esquerda. Tem cabeça redonda, olho simples de 2×2 com 1 pixel de brilho, bochecha rosada, pescoço iridescente verde/roxo, peito claro, asa com as duas faixas típicas de pombo e patinhas rosa.
- **O pombo é montado em camadas:** corpo, asa (baixa/alta), cabeça, pálpebra e acessório. Só o que mexe é animado. Por isso os pombos de todas as funções são literalmente o mesmo desenho:

  | Função | Acessório |
  | --- | --- |
  | Guardião (Pombo-sama) | eboshi, o chapéu alto laqueado dos sacerdotes xintoístas |
  | Vidente | faixa violeta com joia dourada e pontas ao vento |
  | Carteiro (já pronto para o Módulo 4) | boné azul com distintivo + bolsa a tiracolo com carta |
  | Pombo comum | sem acessório; as variações de cor ficam para o Módulo 3 |

- **Sprites escritos como texto**, um caractere por pixel (ex.: `'kbbwGGGGGGGGGGk'`). Isso facilita revisar e criar variações, e um teste automático confere que toda linha tem a largura certa e toda cor existe na paleta.
- **Objetos na mesma escala do pombo:** lanterna de papel, caixa de omikuji (16×24), palitinho, pétala, nó da ema, rabinho do balão.
- **Ícones:** módulos em 12×12 (torii, omikuji, tigela de grãos, carta com coração) e categorias do oráculo em 8×8 (coração, sol, pombinho, flor, pincel, brilhos).
- **Cenário procedural** (`src/pixel/garden.ts`): céu em faixas pontilhadas, sol, nuvens, Monte Fuji com neve serrilhada e lado sombreado, colinas, grama com pontinhos e florzinhas, caminho de pedra em ladrilhos, cerejeiras, lanternas de pedra acesas e o torii com placa dourada. **Os objetos têm tamanho fixo em pixels:** a tela maior mostra *mais* cenário (mais árvores) em vez de esticar o desenho.

## 3. O que mudou em cada módulo

**Santuário**
- Portão: todo o cenário agora é pixel art.
- Título em fonte pixel com contorno creme.
- O Pombo-sama virou sprite e a fala dele virou caixa de diálogo de RPG.
- A entrada é um zoom pixelado pelo torii.
- Pátio: chão em ladrilhos xadrez, varal de lanternas pixel e ema de madeira com nó de cordão. O Oráculo ganhou o selo "Aberto!".

**Oráculo**
- Caixa de omikuji e pombo vidente sobre uma prateleira de madeira.
- O palitinho sai da caixa e fica para fora enquanto a previsão estiver na tela.
- O papel tem moldura pixel, pauta, faixa da cor da sorte e carimbo quadrado (hanko) com o kanji em fonte pixel.
- A cor da sorte segue a mesma regra de antes: 凶 continua em azul calmo.

**Módulos 3 e 4:** só herdaram a UI pixel (cartão, selos, checklist, pombo sprite). O conteúdo segue pendente.

## 4. Verificação
- `npm test`: **34 testes em 5 arquivos, todos passando**. Novo: `src/pixel/sprites.test.ts`, que valida as grades de todos os sprites.
- `npm run build`: sem erros. A primeira carga tem ~78 KB de JS gzip, e o Oráculo carrega sob demanda (~4,6 KB). Toda a arte é código: nenhuma imagem para baixar.
- Visto em navegador real (Chromium, 375×812 e 800×600):
  - portão e diálogo
  - zoom de entrada
  - pátio com ema e lanternas
  - oráculo antes, durante e depois do sorteio
- Corrigidos durante a verificação:
  - o token `--frame` (duração) colidia com a cor da moldura e apagava a borda da caixa de diálogo;
  - o varal de lanternas encolhia no centro;
  - o palitinho voltava para dentro da caixa depois do sorteio.

## 5. Pronto × pendente

### Pronto nesta entrega
- [x] Design system pixel: regra de 4px, paleta, tipografia dupla, moldura pixel, animações em quadros
- [x] Pombo base em camadas com bob, piscada, bater asinhas e pulinho
- [x] Variações: guardião, vidente e carteiro (o carteiro já existe, mas ainda não aparece em tela)
- [x] Santuário: cenário em pixel art (torii, Fuji, sakuras, lanternas, pétalas, caminho em ladrilhos)
- [x] Santuário: caixa de diálogo de RPG, ema em madeira, entrada pixelada
- [x] Oráculo: caixa de omikuji e palitinho em pixel art, altar, papel com moldura pixel, carimbo da sorte
- [x] UI pixel: botões, cartões, caixas de texto, selos, ícones, barra inferior
- [x] Movimento reduzido respeitado em tudo
- [x] Teste automático de consistência dos sprites

### Pendente / próximas fases
- [ ] **Módulo 3 — Alimente o Pombo:** grãos, pombos comuns com variações de cor e expressão, invasão
- [ ] **Módulo 4 — Correio:** envelopes, cartas e selos em pixel art (o pombo-carteiro já está pronto)
- [ ] **Telas baixas no desktop (~600px de altura):** a caixa de diálogo cobre a parte de baixo do torii. Em monitores comuns (≥ 800px de altura) e no celular não acontece.
- [ ] Ainda não testado em iPhone/Android reais. Só em emulação de celular no Chromium.
- [ ] Fontes ainda vêm do Google Fonts; hospedá-las no projeto deixaria o carregamento mais rápido em rede móvel.
- [ ] Contraste das cores de destaque ainda não foi medido com ferramenta.
