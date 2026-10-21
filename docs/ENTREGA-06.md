# PRU NO SEKAI — Entrega 06: Módulo 4, Correio Pombo do Amor

**Status: Módulo 4 implementado.** Com ele, **os quatro módulos do briefing estão prontos**, e nenhuma tela mostra mais "Em construção".

O módulo é um **álbum de cartinhas colecionáveis**:
- as cartas novas chegam pelo pombo-carteiro;
- a carta final é entregue pelo Rei Pombo.

## 1. Como funciona

1. **Primeira visita:** o pombo-carteiro chega voando (batendo asas) e entrega a carta 1, "Entrega especial". O álbum mostra **1 / 10 cartas encontradas**, e as outras 9 aparecem bloqueadas, cada uma com uma dica.
2. **Abrir uma carta:** a janela abre com o envelope pulando, a aba abrindo, o papel subindo e o texto completo aparecendo. A carta passa a "lida" (envelope aberto, botão "Ler de novo").
3. **Ao fechar a carta:** se a leitura desbloqueou cartas novas, o carteiro chega de novo trazendo-as. Elas aparecem com o selo **"Nova!"**.
4. **Filtros:** Todas / Comuns / Raras / Lendárias, cada um com a contagem ("Raras 1/3").
5. **Carta final:** quando as outras 9 estão encontradas, **o Rei Pombo chega** (coroa, moldura dourada, raios dourados) e entrega "A carta mais importante", que abre com moldura dourada dupla.

### Regras de descoberta (exatamente as da Coleção 01)

| Carta | Raridade | Condição | Dica mostrada no álbum |
| --- | --- | --- | --- |
| 1 Entrega especial | comum | primeiro acesso | Chega na primeira visita ao correio. |
| 2 Meu lugar favorito | comum | abrir 1 carta | Abra 1 carta. |
| 4 Florzinha | comum | abrir 2 cartas | Abra 2 cartas. (x/2) |
| 8 Confissão criminosa | comum | cutucar pombo 3 vezes | Cutuque um pombo 3 vezes (qualquer pombo do site). (x/3) |
| 3 Samurai do amor | rara | abrir 3 comuns | Abra 3 cartas comuns. (x/3) |
| 6 Decreto real | rara | visitar o Oráculo | Visite o Oráculo dos Pombos. |
| 9 Para os dias difíceis | rara | abrir 5 cartas | Abra 5 cartas. (x/5) |
| 5 Em qualquer universo | lendária | abrir 2 raras | Abra 2 cartas raras. (x/2) |
| 7 Nosso ninho | lendária | abrir 7 cartas | Abra 7 cartas. (x/7) |
| 10 A carta mais importante | lendária | desbloquear as outras 9 | Encontre todas as outras cartas. O Rei Pombo está observando. (x/9) |

- **Cutucar:** vale tanto o Pombo-sama no Santuário quanto o pombo-carteiro no próprio Correio.
- **Coleção completável:** um teste confirma que dá para completar a coleção só jogando (abrir o que chega, cutucar, visitar o Oráculo).
- **Carta final:** sem visitar o Oráculo ou sem cutucar, ela nunca chega. É de propósito: ela exige explorar o site inteiro.

## 2. Decisões tomadas (para a auditoria avaliar)

- **Progresso salvo só no aparelho** (`localStorage`, chave `pru:correio:v1`). Um álbum que zera a cada visita não funcionaria como coleção.
  - **O que fica guardado:** quais cartas foram abertas e vistas, quantas cutucadas houve e quais módulos foram visitados.
  - **O que não existe:** nada pessoal, nada enviado a servidor, nenhum login.
  - **Sem armazenamento disponível** (ex.: aba privada): funciona igual, mas o progresso vale só até fechar a página.
- **Ícones em pixel art:** o campo `icon` continua com o emoji exatamente como entregue, e a tela desenha uma versão pixel 8×8 de cada um (💌 🏡 ⚔️ 🌸 🌙 👑 🪺 🍟 💕 ❤️). Emoji destoaria do estilo. Se um emoji novo não tiver desenho, ele aparece como texto.
- **Texto das cartas:** sem nenhuma alteração. O ❤️ no fim da carta 10 faz parte do texto e aparece como emoji.
- **Cartas bloqueadas:** título escondido ("???"), envelope cinza com "?", e raridade **visível**. É a opção "parcialmente visível" do briefing: ajuda a criar expectativa ("tem uma lendária aí!").
- **Sem botão de "zerar coleção":** para a Pru não perder as cartas sem querer. Para recomeçar em testes, basta limpar os dados do site no navegador.

## 3. Visual (pixel art, mesmo universo dos módulos 1–3)

- **Agência do correio:** caixa de correio japonesa vermelha (〒) e o **pombo-carteiro** (o mesmo pombo base, com boné e bolsa), sobre um chão de tábuas e com a caixa de diálogo "Pombo-carteiro". Ele pode ser cutucado e tem 6 falas. Ao entregar, chega voando em 6 quadros batendo asas.
- **Envelopes 16×17**, com o lacre na cor da raridade:

  | Raridade | Lacre | Moldura e papel |
  | --- | --- | --- |
  | comum | rosa | moldura escura, papel creme |
  | rara | violeta | moldura e papel lilás |
  | lendária | dourado | moldura dourada, papel creme-dourado, brilhinhos piscando nos cantos |

  Bloqueadas ficam em cinza. Lidas mostram o envelope com a aba aberta e o papel aparecendo.
- **Selos de raridade:** "Comum", "★ Rara", "★★ Lendária".
- **Carta aberta:**
  - papel pautado com moldura pixel;
  - ícone, selo, título em fonte pixel e "De: remetente";
  - texto longo em fonte arredondada;
  - **carimbo "鳩便"** com frase de rodapé, por exemplo "Carta entregue com 3 bicadas de urgência.", "Confidencial. Não mostrar para gatos." ou "Correio certificado do Reino dos Pombos.";
  - a carta 10 tem rodapé próprio: "Entregue em mãos (e asas) pelo próprio Rei Pombo."
- **Rei Pombo:** novo acessório **coroa** (`HAT_KING`) no mesmo pombo base. Ele cai do alto batendo asas, entre raios dourados.
- **Animações em quadros (`steps()`):** chegada do carteiro, envelope pulando, aba abrindo, papel subindo, selo "Nova!" pulando, brilho das lendárias e entrada do Rei Pombo. Com movimento reduzido, tudo aparece direto.

## 4. Acessibilidade

- **Cartas:**
  - cada carta disponível é um botão com nome completo, por exemplo `Abrir: carta "Entrega especial" (comum), nova`;
  - as bloqueadas são texto lido como "Carta bloqueada. Comum. Dica: Abra 1 carta.".
- **Janelas da carta e do Rei Pombo:** `role="dialog"` + `aria-modal`.
  - o foco vai para o título da carta (ou para "Receber a carta");
  - Tab fica preso dentro da janela;
  - Esc fecha;
  - o foco volta para a carta que abriu;
  - a página de trás fica `inert` e não rola.
- **Filtros:** botões com `aria-pressed`, num grupo rotulado.
- **Anúncios:** uma região `role="status"` anuncia as entregas ("O pombo-carteiro trouxe 1 carta nova: Meu lugar favorito.") e o Rei Pombo. Ela fica fora da área que vira `inert`, então continua anunciando com uma janela aberta.
- **Entregas:** nunca acontecem com uma carta aberta. O carteiro espera a leitura terminar.

## 5. Arquivos

| Arquivo | Papel |
| --- | --- |
| `src/data/loveLetters.ts` | Coleção 01 + regras (exatas), dicas, rótulos de raridade, rodapés, falas do carteiro |
| `src/lib/progress.ts` | progresso no aparelho (abertas, vistas, cutucadas, visitas) + hook `useProgress` |
| `src/modules/mail/unlocks.ts` | regras de descoberta puras: desbloqueadas, novas, progresso de cada condição |
| `src/modules/mail/MailPage.tsx` | tela: agência, entregas, contagem, filtros, álbum, janelas |
| `src/modules/mail/LetterCard.tsx` | carta no álbum (bloqueada / descoberta / lida) |
| `src/modules/mail/LetterDialog.tsx` | carta aberta com animação do envelope |
| `src/modules/mail/KingDelivery.tsx` | entrada do Rei Pombo |
| `src/modules/mail/Envelope.tsx`, `LetterIcon.tsx` | envelope e ícones pixel |
| `src/modules/mail/Mail.css` | estilos do módulo |
| `src/pixel/sprites/mail.ts` | envelopes, caixa de correio, cores dos lacres, 10 ícones das cartas |
| `src/hooks/useModal.ts` | janela modal acessível, reutilizável |
| `src/pixel/sprites/pigeon.ts`, `Pigeon.tsx` | + coroa do Rei Pombo |
| `src/components/Guardian.tsx` | cutucar o Pombo-sama conta para a carta 8 |
| `src/App.tsx` | registra visitas aos módulos (carta 6) |
| `src/data/modules.ts` | Correio marcado como pronto |

O componente `WipModulePage` ("em construção") não é mais usado por nenhum módulo. Ficou no projeto para futuras novidades.

## 6. Verificação

- **`npm test`: 84 testes em 10 arquivos, todos passando** (eram 58; nenhum removido). O teste antigo do Correio "em construção" foi trocado por um que verifica o álbum. Testes novos:
  - `unlocks.test.ts` (10):
    - coleção com 10 cartas e 4/3/3 por raridade;
    - toda carta tem regra, dica e ícone pixel;
    - cada regra de desbloqueio;
    - a carta 10 só com as outras 9;
    - a coleção inteira é alcançável jogando;
    - cálculo das "novas".
  - `progress.test.ts` (4): começa vazio, grava no `localStorage`, não duplica, recomeça.
  - `MailPage.test.tsx` (9):
    - primeira visita com a entrega da carta 1 e as dicas;
    - abrir carta: foco no título, Esc fecha e devolve o foco;
    - a próxima carta só chega depois de fechar;
    - Tab preso na janela;
    - filtros;
    - cutucar o carteiro 3× traz a carta 8;
    - visitar o Oráculo traz a carta 6;
    - Rei Pombo + carta final;
    - progresso salvo.
  - `App.test.tsx` (+2): Correio abre o álbum; o pátio não tem mais nada "em construção"; cutucar o Pombo-sama e visitar módulos ficam registrados.
  - `sprites.test.ts`: valida envelopes, caixa de correio, coroa e os 10 ícones.
- **`npm run build`: sem erros.** O Correio é carregado sob demanda (6,6 KB de JS + 2,5 KB de CSS gzip). O pacote inicial ficou em 78,8 KB gzip. Nenhuma dependência nova.
- **Visto no Chromium (emulação)** em 390×844 e 320×568, sem rolagem horizontal, com as 4 fichas de filtro numa linha e 2 colunas de cartas até em 320px. Capturas em `docs/entrega-06/`:

  | Captura | O que mostra |
  | --- | --- |
  | `390-primeira-visita.jpg` | carteiro, 1/10, "Nova!", carta bloqueada com dica |
  | `390-album-filtros.jpg` | cartas lidas e bloqueadas com progresso das dicas |
  | `390-carta-aberta.jpg` | carta comum aberta |
  | `390-rei-pombo.jpg` | entrada do Rei Pombo |
  | `390-carta-final.jpg` | carta 10 com moldura dourada |
  | `320-album.jpg` | carta rara (lilás) em 2 colunas |

- **Ajustes feitos durante a verificação:**
  - o carteiro olhava para o lado oposto da caixa de correio;
  - os filtros quebravam em duas linhas em 390px;
  - o álbum caía para 1 coluna em 320px.

## 7. Pendências

- [ ] Teste em celular real (iPhone e Android), principalmente o `localStorage` em modo privado do Safari.
- [ ] O progresso é por aparelho: se a Pru abrir no celular e depois no computador, cada um tem o seu álbum. Sincronizar exigiria backend, fora do escopo.
- [ ] Sem efeitos sonoros (não pedidos).
- [ ] Coleções futuras (Coleção 02…): basta acrescentar cartas e regras em `src/data/loveLetters.ts`. Condições novas exigem uma linha em `unlocks.ts`.
