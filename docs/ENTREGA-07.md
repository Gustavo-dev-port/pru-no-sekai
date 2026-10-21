# PRU NO SEKAI — Entrega 07: Economia e Fazendinha (Parte 1)

**Status:** a Fazendinha e a estrutura de inventário estão implementadas. **Nenhum módulo existente cobra alimentos**: essa integração fica para depois da auditoria desta base, como pedido.

## 1. Arquitetura

```
src/data/crops.ts        CONFIGURAÇÃO — tempos, produção, sementes iniciais,
                         devolução de semente, saquinho grátis, nº de canteiros
        │
src/economy/farm.ts      REGRAS PURAS — plantar, crescimento, colher,
                         saquinho grátis, validação de dados salvos.
                         Recebem (estado, agora) e devolvem estado novo.
                         Sem React, sem relógio, sem armazenamento.
        │
src/economy/store.ts     LIGAÇÃO — aplica as regras sobre o save e devolve
                         { ok, erro } para a tela.
        │
src/lib/save.ts          SALVAMENTO ÚNICO VERSIONADO (localStorage)
                         { schemaVersion: 2, mail, economy } + migração v1→v2
        │
src/modules/farm/*       INTERFACE — FarmPage, PlotButton, FarmTutorial,
                         textos (farmText.ts) e estilos.
```

- **Crescimento pelo horário real:**
  - Cada canteiro guarda só `{ planta, plantadoEm }` (epoch ms).
  - O estágio e o "pronto" são **calculados** na hora: `agora − plantadoEm`.
  - Não existe temporizador de crescimento, então com o site fechado o tempo passa igual.
  - A tela só tem um relógio de 1 s para atualizar a contagem regressiva.
- **Proteção contra relógio mexido:**
  - Relógio voltando: o crescimento conta como 0, nunca negativo.
  - Plantio salvo "no futuro": ao carregar, conta a partir de agora.
- **Duas abas abertas:**
  - Toda alteração relê o armazenamento antes de aplicar, então uma aba não sobrescreve a outra nem colhe a mesma plantação duas vezes.
  - Um evento `storage` atualiza a outra aba.

## 2. Proteção do progresso do Correio (migração)

| Versão | Onde | Conteúdo |
| --- | --- | --- |
| v1 (Entrega 06) | `pru:correio:v1` | progresso do Correio |
| **v2 (esta)** | **`pru:save`** | `{ schemaVersion: 2, mail, economy }` |

- **Primeiro acesso depois da atualização:** não existe `pru:save`, então o Correio é **copiado** de `pru:correio:v1` para `mail`, e a fazenda começa do zero. A migração é gravada na hora.
- **A chave antiga nunca é apagada nem alterada.** Ela fica como cópia de segurança, e um teste garante isso, inclusive depois de usar a fazenda.
- **Dados corrompidos** (JSON inválido, campos estranhos): são ignorados e consertados, sem derrubar o site e sem apagar nada.
- **O Correio continua com a mesma API** (`progress.ts`), agora lendo e gravando a seção `mail` do save único. Os 84 testes anteriores passaram sem mudar a lógica, só o nome da chave nos testes que conferem o armazenamento.
- **Verificado no navegador:** com só a chave antiga salva ("3 cartas lidas, 4 encontradas"), o Correio abriu mostrando **4 / 10 encontradas · 3 lidas**. O `pru:save` foi criado com `schemaVersion: 2` e os mesmos dados, e a chave antiga ficou intacta.

## 3. Regras da economia

| Planta | Cresce em | Colheita | Volta de semente |
| --- | --- | --- | --- |
| Milho | 30 s | 5 milho | +1 semente de milho |
| Arroz | 60 s | 10 arroz | +1 semente de arroz |
| Girassol | 120 s | 20 sementes de girassol (alimento) | +1 semente de girassol |

- **Início:** 4 canteiros vazios e sementes **4 milho, 2 arroz, 1 girassol**. Alimentos começam em 0.
- **Plantar:** custa 1 semente da planta escolhida.
  - Não funciona sem semente ("sem-sementes"), em canteiro ocupado ou em canteiro inexistente.
  - Em caso de erro, o estado não muda.
- **Colher:** só quando está pronto.
  - Soma a produção ao estoque, devolve 1 semente e **esvazia o canteiro na mesma operação**.
  - Por isso é impossível colher duas vezes ("canteiro-vazio" na segunda tentativa).
- **Sem bloqueio permanente:**
  1. Cada colheita devolve a semente, então quem joga nunca perde sementes.
  2. **Saquinho grátis do Pombo-sama** (+2 milho, +1 arroz, +1 girassol), disponível de novo a cada **3 minutos**. É também a forma de conseguir mais girassol.
- **Ajustes:** todos os números estão em `src/data/crops.ts`.

## 4. Interface

- **Ordem da tela, pensada para celular:**
  1. diálogo do Pombo-sama
  2. escolha da semente
  3. canteiros
  4. saquinho e "Como jogar"
  5. estoque
- **Escolha da semente:** 3 botões (`aria-pressed`) com ícone, nome, quantidade e tempo.
- **Canteiros:** 4 botões de terra arada em pixel art.
  - Estados: vazio ("+ Plantar milho"), crescendo (planta no estágio 0–3, barra de crescimento em 8 degraus e contagem) e pronto (moldura dourada, brilho, planta balançando, "★ Colher!").
  - Ao colher, sobe um "+5" em quadros.
- **Plantas em pixel art:** semente → broto → crescendo → pronto, com o pronto diferente para cada uma (espiga de milho, cachos de arroz, girassol). Ícones do estoque e o saquinho também são pixel art.
- **Cenário em canvas:** céu, colinas, cerca, galpãozinho, sakura e grama com florzinhas. Mesma regra de 4px e mesma paleta.
- **Tutorial curto** na primeira visita, com 4 passos e uma dica do saquinho. Pode ser reaberto em "Como jogar".
- **Navegação:**
  - novo módulo **5 — Fazendinha da Pru** (`#/fazenda`, kanji 畑);
  - barra inferior com 5 itens, com o rótulo menor em telas abaixo de 400px;
  - 4ª ema no pátio do santuário, agora em grade 2×2 a partir de 560px.

## 5. Acessibilidade

- **Botões reais:** canteiros, sementes, saquinho e tutorial funcionam com toque, mouse e teclado.
- **Nomes completos nos canteiros**, por exemplo "Canteiro 1: milho crescendo, pronto em 30 s" ou "Canteiro 2: arroz pronto. Colher".
- **Região `role="status"`:** anuncia cada ação (plantou, colheu, falta tempo, sem sementes, saquinho). Também avisa **uma vez** quando uma plantação fica pronta com a tela aberta: "Pronto para colher: Milho no canteiro 1.".
- **Estoque em tabela** com cabeçalhos de linha e coluna.
- **Tutorial modal:** foco preso, Esc fecha, a página atrás fica `inert`. Ao fechar na primeira visita, o foco vai para o título.
- **Bug encontrado pelos testes e corrigido:**
  - **Problema:** na primeira visita, a página tirava o foco do tutorial (o título recebia foco depois do botão do tutorial).
  - **Correção:** `useFocusOnMount` ganhou o parâmetro `enabled`.
- **Movimento reduzido:** sem brilho piscando nem planta balançando.

## 6. Arquivos

**Novos:**
- `src/data/crops.ts`
- `src/economy/farm.ts`, `farm.test.ts`
- `src/economy/store.ts`
- `src/lib/save.ts`, `save.test.ts`
- `src/modules/farm/` (`FarmPage.tsx`, `PlotButton.tsx`, `FarmTutorial.tsx`, `farmText.ts`, `Farm.css`, `FarmPage.test.tsx`)
- `src/pixel/farmScene.ts`
- `src/pixel/sprites/farm.ts`

**Alterados:**

| Arquivo | Mudança |
| --- | --- |
| `src/lib/progress.ts` | Correio passa a usar o save único, com a mesma API |
| `src/data/modules.ts` | módulo 5 |
| `src/App.tsx` | rota `#/fazenda` |
| `src/components/icons.tsx` + `src/pixel/sprites/icons.ts` | ícone do broto |
| `src/components/BottomNav.css` | 5 colunas |
| `src/modules/sanctuary/Sanctuary.css` | ema em 2×2 |
| `src/hooks/useFocusOnMount.ts` | parâmetro `enabled` |
| `src/test/setup.ts` | reinicia o save entre testes |
| `src/App.test.tsx` | 4 ema e 5 links |
| `progress.test.ts`, `MailPage.test.tsx` | nova chave do save |
| `src/pixel/sprites.test.ts` | valida as grades da fazenda |

## 7. Testes automatizados

`npm test`: **117 testes em 13 arquivos, todos passando** (eram 84; nenhum removido). Os 33 novos:

| Arquivo | Cobre |
| --- | --- |
| `economy/farm.test.ts` (19) | valores aprovados; estado inicial; plantar nos 4 canteiros; **não gastar semente inexistente**; canteiro ocupado ou inválido; pronto exatamente no tempo (29,999 s não, 30 s sim); estágios; **crescimento com o site fechado**; relógio voltando; colher atualiza estoque e devolve semente; **não colher duas vezes**; não colher antes da hora; saquinho e intervalo; **sair do "zero sementes"**; dados inválidos; plantio no futuro; lixo vira estado inicial |
| `lib/save.test.ts` (7) | migração v1→v2; v2 tem prioridade; sem nada salvo; **Correio preservado e chave antiga intocada**, mesmo usando a fazenda; save corrompido; **progresso sobrevive a recarregar**; segunda aba |
| `modules/farm/FarmPage.test.tsx` (8) | tutorial (foco, fechar, foco no título); "Como jogar"; ciclo **plantar → esperar → colher** pela tela, com anúncio de pronto e sem colheita dupla; 4 canteiros com sementes diferentes; aviso sem sementes; **fechar a página, voltar 2 min depois e colher**; saquinho com intervalo; teclado |
| `pixel/sprites.test.ts` (+1) | plantas (3 × 4 estágios), ícones e saquinho |

Os testes de módulos existentes (Santuário, Oráculo, Alimentar, Correio) continuam todos passando: **nenhuma regressão**.

## 8. Build de produção

`npm run build`: **sem erros**.

| Pacote | JS gzip | CSS gzip |
| --- | --- | --- |
| Fazendinha (carregada sob demanda) | 3,9 KB | 1,8 KB |
| Pacote inicial | 73,6 KB (antes 78,8 KB) | — |

O pacote inicial ficou menor porque o empacotador passou a separar componentes compartilhados em outro arquivo. Nenhuma dependência nova.

## 9. Capturas mobile (Chromium, emulação) — `docs/entrega-07/`

| Captura | O que mostra |
| --- | --- |
| `390-tutorial.jpg` | tutorial da primeira visita (390×844) |
| `390-plantando-estoque.jpg` | três canteiros plantados, contagem, estoque e sementes descontadas |
| `390-colheita.jpg` | colheita com "+5"; arroz pronto (moldura dourada, "★ Colher!"); girassol crescendo; ordem final da tela |
| `320-canteiros.jpg` | 320×568, sem rolagem horizontal, os 5 itens da barra inferior cabendo |

Os estados "pronto" foram vistos depois de recarregar a página com a hora de plantio antiga no save. É a mesma situação de quem fecha o site e volta depois.

## 10. Pendências e próximos passos

- [ ] **Integração econômica** com Oráculo, Alimentar e Correio (gastar alimentos ou penas): **aguardando aprovação desta etapa**, como pedido.
- [ ] Teste em celular real (iPhone e Android), principalmente o `localStorage` no modo privado do Safari.
- [ ] O progresso é por aparelho; não há sincronização entre celular e computador.
- [ ] Sem notificação quando a planta fica pronta com o site fechado (exigiria permissão do navegador ou service worker; fora do escopo).
