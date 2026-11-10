# Pru no Sekai — Arquitetura

Resumo de como o site é montado, com foco no salvamento e na Fazendinha. Os detalhes de cada decisão estão nas entregas (`docs/ENTREGA-*.md`).

## Visão geral

- **Aplicação de página única**, sem servidor. Rotas por hash (`src/router.ts`).
- **Módulos sob demanda:** o Santuário vem no pacote inicial; Oráculo, Alimentar, Correio e Fazendinha são carregados quando abertos (`src/App.tsx`).
- **Falha ao carregar um módulo:** `src/components/ErrorBoundary.tsx` mostra o Pombo-sama com um botão de recarregar, em vez de tela em branco. Trocar de módulo também tira a tela de erro.
- **Pixel art:** sprites são grades de texto (`src/pixel/sprites/`) desenhadas como SVG por `PixelSprite`; cenários são canvas (`src/pixel/garden.ts`, `plaza.ts`, `farmScene.ts`).

## Camadas

| Camada | Onde | Regra |
| --- | --- | --- |
| Conteúdo e números ajustáveis | `src/data/` | sem lógica |
| Regras puras | `src/economy/farm.ts`, `src/modules/feed/feedLogic.ts`, `src/modules/mail/unlocks.ts` | sem React, relógio ou armazenamento; recebem o estado e o horário |
| Salvamento | `src/lib/save.ts` | único ponto que lê e grava o `localStorage` do jogo |
| Ligação regras ↔ save | `src/economy/store.ts`, `src/lib/progress.ts` | ações da Fazendinha e progresso do Correio |
| Telas | `src/modules/*/` | mostram o estado e chamam as ações |

## Salvamento (`src/lib/save.ts`)

### Chaves no `localStorage`

| Chave | Conteúdo |
| --- | --- |
| `pru:save` | save atual: `{ schemaVersion: 2, mail, economy }` |
| `pru:correio:v1` | progresso antigo do Correio (Entrega 06). É lido na migração e **nunca apagado nem alterado** |
| `pru:save:backup:<data>` | cópia do texto original, feita antes de gravar uma recuperação |

O portão do Santuário usa `sessionStorage` (`pru:entrou-no-santuario`), fora do save.

### Ao abrir o site

1. A loja **lê** o armazenamento na hora, para a tela já mostrar o progresso.
2. `interpretSave` (função pura) decide o que fazer:

   | O que está guardado | Resultado |
   | --- | --- |
   | nada | jogo novo; o Correio vem da chave antiga, se existir |
   | versão 2 íntegra | usa como está, sem gravar |
   | versão 2 com campos problemáticos, versão ausente ou inválida, JSON corrompido | recupera o que der, campo a campo |
   | versão maior que 2 | **somente leitura** |

3. Se for preciso gravar (criação, migração ou recuperação), a gravação acontece **dentro do Web Lock `pru:save`, relendo o armazenamento antes**. Se outra aba já gravou, vale o que ela gravou.
4. Se a gravação falhar (por exemplo, cota cheia), o jogo segue em memória e a próxima gravação protegida tenta de novo.

### Proteção entre abas

- **Ações da Fazendinha** (`transactSave`): dentro do lock, relê, valida, aplica e grava. Duas abas nunca fazem isso ao mesmo tempo.
- **Progresso do Correio e "tutorial visto"** (`updateSave`): aparece na hora e é gravado pelo mesmo lock, reaplicado sobre o que estiver gravado.
- **Evento `storage`:** quando outra aba grava, esta relê e atualiza a tela, mantendo o que ainda está na fila para gravar.

| Situação | Comportamento |
| --- | --- |
| Web Locks disponível (HTTPS ou `localhost`) | tudo serializado entre abas |
| Sem Web Locks, com `localStorage` | Fazendinha recusa as ações (`sem-protecao`); Correio e a gravação de abertura valem em melhor esforço, sem garantia |
| Sem `localStorage` | tudo em memória, só nesta aba |
| Lock preso por mais de 5 s | ação recusada (`ocupado`), save intacto |

### Somente leitura (save de versão mais nova)

- Nada é gravado e **nada muda em memória**: Correio e Fazendinha mostram exatamente o que está salvo, com um aviso.
- O Correio não faz entregas; dá para reler as cartas já encontradas.
- Na Fazendinha, as ações respondem com mensagem; o tutorial pode ser fechado, sem ser marcado como visto.
- Se o save fica incompatível no meio da sessão, as alterações que estavam na fila são descartadas e a tela volta ao que está gravado.

### Cópias de segurança

- Uma cópia por texto original: texto já copiado não é copiado de novo.
- Uma cópia nunca substitui outra diferente.
- Ainda não existe tela para restaurar uma cópia; a restauração é manual.

## Fazendinha (Módulo 5)

| Arquivo | Papel |
| --- | --- |
| `src/data/crops.ts` | plantas, tempos, produção, sementes iniciais, saquinho grátis |
| `src/economy/farm.ts` | regras puras: plantar, colher, saquinho, crescimento, recuperação de dados |
| `src/economy/store.ts` | executa as regras dentro do save protegido |
| `src/modules/farm/FarmPage.tsx` | tela: sementes, canteiros, estoque, mensagens |
| `src/modules/farm/PlotButton.tsx`, `FarmTutorial.tsx`, `farmText.ts` | canteiro, tutorial, textos |
| `src/pixel/farmScene.ts`, `src/pixel/sprites/farm.ts` | cenário e sprites |

- **Estado (`economy`):** sementes, alimentos, 4 canteiros (`null` ou `{ planta, horário do plantio }`), horário do último saquinho, tutorial visto.
- **Crescimento pelo horário real:** `agora − horário do plantio`. Por isso continua com o site fechado e não depende de temporizador.
- **Colheita:** esvazia o canteiro, soma os alimentos e devolve 1 semente, tudo na mesma operação.
- **Saquinho grátis:** garante que ninguém fique sem sementes; tem intervalo.
- **Na tela:** uma ação por vez; toques durante a espera são ignorados.

**Ainda não implementado:** gastar os alimentos em outros módulos (economia compartilhada).

## Janelas modais (`src/hooks/useModal.ts`)

Usado pela carta aberta, pelo Rei Pombo e pelo tutorial da Fazendinha.

- O foco entra na janela ao abrir e volta para quem abriu ao fechar.
- Tab e Shift+Tab são sempre tratados pela janela, então o foco não sai dela.
- Esc fecha.
- A página de trás e a barra inferior ficam `inert`.
- No Correio, ao fechar uma carta o foco volta para ela no álbum (ou para o título da página, se o filtro a esconder).

## Testes

`npm test` (Vitest + Testing Library, jsdom).

- **Persistência:** `src/lib/save.test.ts` e `src/economy/concurrency.test.ts`. Cada "aba" é uma loja própria que compartilha armazenamento e locks de teste (`src/test/memoryStorage.ts`, `src/test/fakeLocks.ts`).
- **Limite conhecido:** o jsdom roda numa única thread e não implementa `inert` nem Web Locks. A exclusão mútua real entre abas e o efeito visual do `inert` só se comprovam no navegador.
