# PRU NO SEKAI — Entrega 02: Módulo 2, Oráculo dos Pombos

**Status: Módulo 2 implementado.** Os Módulos 3 e 4 continuam "em construção".

## Como funciona
1. A pessoa toca em **"Tirar um omikuji"**.
2. A caixa vermelha de omikuji (御籤) é sacudida, vira de cabeça para baixo e solta um palitinho. A animação dura 1 s, e o pombo vidente diz "Os pombos estão consultando os astros…".
3. O papelzinho **desenrola** de cima para baixo e o carimbo do nível de sorte (大吉, 中吉…) cai sobre ele.
4. A previsão **fica na tela até a próxima consulta**. O botão vira "Tirar outra previsão".

Nada é salvo: não há histórico, armazenamento nem dados pessoais.

## Conteúdo
- **Coleção 01**: as 30 previsões entregues pelo dono do projeto, sem nenhuma alteração de texto, em `src/data/fortunes.json`.
- `src/data/fortunes.ts` tipa os dados e extrai o nível de sorte do kanji do campo `type`. Uma classificação desconhecida gera erro, em vez de falhar em silêncio.
- **Para adicionar previsões:** inclua novos objetos no JSON, no mesmo formato. Níveis aceitos: 大吉, 中吉, 吉, 小吉, 末吉, 凶.

## Regras atendidas
| Regra | Implementação |
| --- | --- |
| Sorteio sem repetir a anterior | `pickIndexAvoiding()` (a mesma do pombo guardião) |
| Carta omikuji revelada com animação | caixa sacudindo + palitinho + papel desenrolando + carimbo |
| Variação visual por nível de sorte, sem cores alarmantes | cada nível tem uma cor de destaque e uma faixa no topo do papel (veja abaixo); 凶 usa **azul calmo**, nunca vermelho |
| Previsão visível até a próxima consulta | ela só é substituída ao tocar de novo |
| Má sorte leve e engraçada | os textos já são leves; 凶 ainda ganha o aviso "(nível de perigo: fofo)" |
| Sem histórico nem dados pessoais | estado só em memória |

Cores por nível de sorte:
- 大吉: dourado + rosa
- 中吉: ameixa
- 吉: sálvia
- 小吉: madeira
- 末吉: lavanda
- 凶: azul calmo

## Acessibilidade
- Durante o sacode, o botão mantém o foco (`aria-disabled`, cliques ignorados) e uma região `role="status"` anuncia a consulta.
- Ao revelar, o foco vai para o título da previsão (`h2`). Assim, o leitor de tela lê a previsão, e o próximo Tab volta ao botão.
- O papel é um `article` com o nível de sorte por extenso. O kanji decorativo fica oculto para leitores de tela.
- Com movimento reduzido, a previsão aparece na hora, sem sacode nem desenrolar.
- As cores de destaque foram escolhidas para contraste AA sobre o papel creme, mas ainda não foram medidas com ferramenta.

## Testes
`npm test`: **31 testes em 4 arquivos, todos passando**. Os 7 testes novos estão em `src/modules/oracle/OraclePage.test.tsx`:
- a coleção tem 30 previsões, ids únicos, todos os campos preenchidos e os 6 níveis reconhecidos;
- classificação desconhecida gera erro;
- estado inicial;
- foco, `aria-disabled` e `status` durante o sacode, clique repetido ignorado e foco no título ao revelar;
- 40 consultas seguidas sem repetir a anterior, com a previsão visível até a próxima;
- 凶 com a classe calma e o aviso brincalhão.

`npm run build`: sem erros. O Oráculo é carregado sob demanda, em um arquivo de ~4,9 KB de JS gzip + 1,5 KB de CSS gzip.

## Ainda não verificado
- Inspeção visual em navegador real e em celular: fica para a versão publicada na Vercel.
