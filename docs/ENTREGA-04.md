# PRU NO SEKAI — Entrega 04: Módulo 3, Alimente o Pombo (parte 1: base funcional)

Seguindo a recomendação do auditor, o Módulo 3 vem em duas partes:
1. **Esta entrega:** lógica, progressão, invasão, reinício e acessibilidade. Já usa os sprites pixel art existentes, com animações simples.
2. **Próxima entrega:** refinamento visual e animações.

## Como funciona
1. A pessoa toca em **"▶ Jogar grãozinho"**. O grão cai na frente do bico de um pombo sorteado, que abaixa a cabeça e fecha os olhinhos (^ ^) para bicar.
2. O contador **Grãos oferecidos** sobe a cada toque. **Pombos reunidos** mostra quantos pombos estão na praça.
3. Os pombos chegam em etapas, cada uma com uma fala nova do Pombo-sama:

| Grãos | Pombos | Fala |
| --- | --- | --- |
| 0 | 1 | "Um pombo solitário te observa. Ele parece ter fome. E opiniões." |
| 1 | 1 | "Ele gostou. Ele gostou MUITO. Os olhinhos até fecharam." |
| 3 | 2 | "Chegou um amigo. Coincidência? Pombos não acreditam em coincidências." |
| 6 | 3 | "Agora são três. Eles estão fazendo uma reunião sobre você." |
| 10 | 5 | "Um pequeno grupo se formou. Alguém trouxe um banquinho." |
| 15 | 8 | "Aglomeração! A notícia do milho grátis se espalhou pelo bairro." |
| **20** | **26** | **INVASÃO!** Uma de 5 frases, nunca a mesma da invasão anterior |

As 5 frases da invasão:
- "Você chamou reforços."
- "Agora não há mais volta."
- "Os pombos avisaram os primos."
- "Pru, você agora é líder espiritual de uma revolta de pombos."
- "Os pombos declararam este jardim território da Grande Pru."

4. **Invasão:** 18 pombos extras caem do céu, um atrás do outro, e uma faixa **"INVASÃO!"** aparece sobre a praça. Se a pessoa continuar alimentando, aos 25 grãos o Pombo-sama avisa que "os pombos exigem mais milho".
5. **"↺ Recomeçar"** zera o contador, manda os pombos embora e mostra "Todos os pombos foram embora. Por enquanto.". Depois da invasão, o botão ganha moldura cheia para chamar atenção.

Nada é salvo. Ao sair e voltar, o jogo recomeça do zero.

## Visual (base)
- **Praça dos pombos (鳩の広場):**
  - chão de ladrilhos em xadrez
  - faixa de céu rosado
  - plaquinha de madeira
  - duas lanternas de papel (vermelha e rosa)
  - moldura pixel
- **Pombos comuns:** o mesmo pombo base dos módulos 1 e 2, em 4 cores:

  | Cor | Penas |
  | --- | --- |
  | clássico | cinza |
  | shiro | branco |
  | canela | marrom |
  | sumi | cinza-escuro |

  Também variam a direção (esquerda/direita), a posição e o ritmo do balanço de cabeça, para não mexerem em sincronia. A pose de bicar troca a expressão para olhinhos felizes.
- **Grão:** sprite de milho 3×3, que cai em 2 quadros.
- **Animações, todas em quadros (`steps()`):**
  - chegada do pombo com pulinho
  - invasores caindo do céu
  - faixa "INVASÃO!" entrando
  - bob de cabeça e piscada dos pombos do grupo principal

  Os 18 invasores ficam parados para manter a tela leve.
- **Movimento reduzido:** sem chegadas animadas, sem bob nem piscada. O jogo funciona igual.

## Acessibilidade
- Botões reais, com foco visível e funcionando com toque, mouse e teclado (Enter/Espaço).
- O balão do Pombo-sama é `aria-live="polite"` e **só muda quando algo importante acontece**: nova etapa, invasão ou reinício. Assim o leitor de tela não anuncia cada grão.
- Os contadores são texto real, numa lista de definições (`dl`).
- A praça é decorativa (`aria-hidden`): todo o estado do jogo também é dito em texto.
- "Recomeçar" com 0 grãos fica `aria-disabled` em vez de `disabled`, para o foco não se perder depois de recomeçar.

## Organização
| Arquivo | Papel |
| --- | --- |
| `src/data/feedGame.ts` | etapas, falas, limite da invasão, frases, posições e cores dos pombos (tudo editável) |
| `src/modules/feed/feedLogic.ts` | regras puras, sem React: etapa atual, pombos presentes, o que anunciar |
| `src/modules/feed/FeedPage.tsx` | estado do jogo e tela |
| `src/modules/feed/FeedArena.tsx` | a praça (desenho) |
| `src/modules/feed/Feed.css` | estilos do módulo |
| `src/pixel/sprites/pigeon.ts` | + olhinhos felizes e as 4 variações de cor |
| `src/pixel/sprites/props.ts` | + grão |
| `src/components/Pigeon.tsx` | + props `variant`, `flip`, `pecking` e `phase` (reaproveitáveis no Módulo 4) |

## Verificação
- `npm test`: **49 testes, todos passando**. São 15 novos, em `feedLogic.test.ts` e `FeedPage.test.tsx`:
  - progressão 1 → 2 → 3 → 5 → 8 → 26
  - invasão no limite
  - eventos anunciados
  - pombos dentro da praça
  - estado inicial e foco
  - contador
  - falas por etapa
  - invasão com faixa e frase
  - recomeçar, com foco mantido
  - toques em rajada
  - uso só com teclado
  - praça decorativa
- `npm run build`: sem erros. O módulo carrega sob demanda: ~2,4 KB de JS + 1,2 KB de CSS gzip.
- Jogado no Chromium em 375×812: estado inicial, 5 pombos, invasão com 26 pombos e reinício.
- **Bug encontrado e corrigido na verificação:** toques muito rápidos, antes de a tela atualizar, eram contados como um só, porque o contador lia um valor desatualizado. Agora o valor certo fica guardado em uma referência, e um teste cobre o caso.

## Pendente: parte 2 (refinamento visual)
- [ ] Bicada mais expressiva (cabeça descendo até o chão em 2 quadros, grão sumindo com "nhac")
- [ ] Bater asinhas rápido na chegada de cada pombo e na queda dos invasores (sprite de asa aberta)
- [ ] Partículas pixeladas (farelinhos, pétalas) ao jogar o grão
- [ ] Cenário da praça mais rico (cerejeira, lanterna de pedra, cantinho dos pombos)
- [ ] Expressões extras (surpreso, satisfeito) e uma reação especial na invasão
- [ ] Na invasão, alguns pombos ficam parcialmente cortados nas bordas da praça (é intencional, mas vale ajustar no refinamento)
- [ ] Teste em celular real
