# PRU NO SEKAI — Entrega 07.1: Correções da Auditoria 007

**Branch:** `feat/fazendinha` · **Escopo:** só as três correções. A integração econômica com os outros módulos **não** foi iniciada.

## Resumo

| Apontamento | Estado | Evidência principal |
| --- | --- | --- |
| **AUD-007-01** — Concorrência entre abas | **RESOLVIDO** (nas garantias documentadas abaixo) | 10 testes em `concurrency.test.ts` + teste manual com Web Locks reais em 2 abas |
| **AUD-007-02** — Versionamento do save | **RESOLVIDO** | 19 testes em `save.test.ts` + teste manual de save v3 no navegador |
| **AUD-007-03** — Recuperação de dados corrompidos | **RESOLVIDO** | 11 testes de recuperação em `farm.test.ts` |

Valores aprovados mantidos sem mudança:
- 4 canteiros;
- milho 30 s/5, arroz 60 s/10, girassol 120 s/20;
- 1 semente devolvida por colheita;
- saquinho a cada 3 min;
- sementes iniciais 4/2/1.

Visual, tutorial, acessibilidade, movimento reduzido e o Correio também foram mantidos.

---

## 1. AUD-007-01 — Concorrência entre abas

### Estratégia

- **Toda ação econômica** (plantar, colher, saquinho) passa por `transactSave()` em `src/lib/save.ts`.
- **Dentro do lock:** a ação roda num **Web Lock exclusivo `"pru:save"`** (`navigator.locks.request`), compartilhado por todas as abas da mesma origem. Ali dentro ela:
  1. **relê o `localStorage`** (o que outra aba gravou conta);
  2. **valida e aplica** a regra pura (`plant` / `harvest` / `claimFreePouch`);
  3. **grava**.

  Leitura, validação e gravação acontecem **na mesma seção protegida**, e duas abas nunca fazem isso ao mesmo tempo.
- **Consequências:**
  - **Colheita dupla:** impossível. A segunda aba relê, encontra o canteiro vazio e recebe `canteiro-vazio`.
  - **Sobrescrita:** não acontece, porque cada operação parte do estado gravado mais recente, não do estado (talvez velho) em memória.
- **Sincronização:** o evento `storage` faz a outra aba reler e atualizar a tela.
- **Na mesma aba:** a tela ignora toques enquanto uma ação está em andamento. Assim, um toque duplo não gera mensagens contraditórias. O foco continua no botão tocado.
- **API:** as ações econômicas passaram a ser assíncronas (`plantAt`, `harvestAt` e `takeFreePouch` devolvem `Promise`). Os nomes não mudaram. Elas devolvem também `before` (o estado lido dentro do lock), para a mensagem dizer o que foi **realmente** colhido.

### Comportamento sem Web Locks (garantias honestas)

| Situação | Comportamento | Há garantia? |
| --- | --- | --- |
| Web Locks **disponível** (todos os navegadores atuais, em HTTPS ou localhost) | ações econômicas serializadas entre abas | **Sim** |
| **Sem** Web Locks e **com** `localStorage` compartilhado | ação econômica **recusada** (`sem-protecao`), com mensagem; **o save não é tocado** | Não há garantia, então **não executa** |
| **Sem** `localStorage` (ex.: modo privado que bloqueia) | tudo em memória, só nesta aba | Sim: não existe outra aba para conflitar |
| Lock preso por outra aba por mais de 5 s | ação recusada (`ocupado`), save intacto | Sim (falha controlada) |
| Save de versão futura | ação recusada (`save-incompativel`) | Sim (nada é gravado) |

**Correio (não econômico):** cartas vistas, cutucadas e visitas aparecem na hora (otimista) e são gravadas **pelo mesmo lock**.
- **Sem Web Locks:** são gravadas direto, em **melhor esforço, sem garantia de atomicidade** (documentado no código). Nesse caso raro, duas abas gravando no mesmo milissegundo podem perder uma cutucada.
- **Nunca afetam a economia,** porque cada gravação parte do estado gravado mais recente.

### Evidências

**Testes automatizados (`src/economy/concurrency.test.ts`, 10/10).** Cada "aba" é uma loja própria com estado em memória próprio, compartilhando o mesmo armazenamento e o mesmo gerenciador de locks:

| Cenário obrigatório | Resultado verificado |
| --- | --- |
| Duas abas colhendo o mesmo canteiro | só 1 colhe; a outra recebe `canteiro-vazio`; estoque +5 uma vez; sementes certas |
| Dois plantios simultâneos (mesmo canteiro) | 1 planta, o outro recebe `canteiro-ocupado`; só 1 semente gasta |
| Dois plantios simultâneos (canteiros diferentes) | os dois valem, nada sobrescrito |
| Colheita numa aba + saquinho na outra | os dois efeitos ficam salvos |
| Dois saquinhos simultâneos | só 1 ganha; o outro recebe `saquinho-indisponivel` |
| Sincronização após gravação em outra aba | a outra aba recebe o estado novo |
| Sem Web Locks | `sem-protecao`; armazenamento **sem nenhuma gravação** |
| Lock preso além do limite | `ocupado`; save intacto |
| Lock preso por pouco tempo | a ação espera e usa o estado mais novo (vê o plantio da outra aba) |
| Toda ação econômica passa pelo lock `"pru:save"` | contagem de pedidos de lock confere |

> **Limitação do ambiente de teste:** o jsdom roda numa única thread, então duas "abas" de teste nunca executam ao mesmo tempo de verdade. O lock de teste (`src/test/fakeLocks.ts`) é uma fila FIFO exclusiva com cancelamento, como a API real. Por isso a exclusão mútua **entre processos** foi verificada também **manualmente**, com a API real do navegador.

**Teste manual com Web Locks reais.** Chromium, `localhost` (contexto seguro), 2 abas da Fazendinha com o mesmo armazenamento:

1. **Colheita simultânea.**
   - Montagem: a aba A segurou o lock `pru:save` por 5 s e pôs "colher canteiro 1" na fila. A aba B, que ainda via o canteiro 1 "pronto", também pediu para colher.
   - Aba A: *"Colheu 5 de milho! A plantinha devolveu 1 semente de milho."*
   - Aba B: *"Esse canteiro está vazio."*
   - Salvo: milho **5** (uma colheita só), canteiro 1 vazio. A tela da aba B atualizou sozinha para estoque 5.
2. **Saquinho simultâneo** (mesma montagem).
   - Aba A ganhou; aba B: *"O Pombo-sama está buscando mais sementes. Volta em 3 min."*
   - Sementes somadas **uma vez**: milho 4→6, arroz 2→3, girassol 1→2.

## 2. AUD-007-02 — Versionamento do save

### Regras (`interpretSave`, função pura)

| O que está guardado | Status | Grava? |
| --- | --- | --- |
| Nada | `ok` (jogo novo) | sim |
| Só a chave v1 do Correio (`pru:correio:v1`) | `ok`, Correio migrado inteiro | sim, **e a chave v1 nunca é apagada nem alterada** |
| `schemaVersion: 2` íntegro | `ok` | não (nada a mudar) |
| `schemaVersion: 2` com campos problemáticos | `recovered` | sim, **depois de copiar o texto original** |
| `schemaVersion` inteiro **> 2** (3, 4, 99…) | `future-version`: **somente leitura** | **nunca**: nem ao abrir, nem ao jogar, nem se outra aba gravar a v3 no meio da sessão |
| Versão ausente, texto, fração, 0, negativa ou 1 | `recovered` (recupera o que reconhecer) | sim, depois da cópia |
| JSON corrompido | `recovered` (recomeça, aproveitando o Correio v1) | sim, depois da cópia |

- **Cópia de segurança:** antes de gravar qualquer recuperação, o texto original vai para `pru:save:backup:<data>`. Nada é perdido em silêncio.
- **Versão futura na interface:** a Fazendinha mostra o aviso *"Este progresso foi salvo por uma versão mais nova… a fazendinha está só para olhar"*, e as ações respondem com mensagem controlada.
- **Verificado no navegador:** um save v3 com campo novo continuou **byte a byte idêntico** depois de abrir a Fazendinha e tocar num canteiro.

### Testes (`src/lib/save.test.ts`, 19/19)

- ausência de save;
- migração v1→v2;
- v2 válido (sem gravação);
- v3, v4 e v99 somente leitura;
- 6 variações de versão ausente/inválida;
- JSON corrompido;
- **chave v1 preservada byte a byte**;
- versão futura **sem nenhuma gravação** (contador de gravações = 0);
- v3 gravada por outra aba no meio da sessão;
- cópia de segurança do texto corrompido;
- recarregar a página;
- modo sem armazenamento.

## 3. AUD-007-03 — Recuperação de dados corrompidos

### Política (documentada em `src/economy/farm.ts`, função `recoverEconomy`)

| Campo | Válido | Ausente | Inválido (negativo, NaN, ∞, texto…) |
| --- | --- | --- | --- |
| sementes / alimentos | inteiro ≥ 0 mantido (zero explícito também); fração → piso | 0, relatado como **"ausente"** | 0, relatado como **"inválido"** |
| canteiro | `null` ou `{planta, data}` mantido | vazio | vazio (planta desconhecida) |
| data de plantio | número ≤ agora | agora (**planta mantida**, volta a crescer) | agora (planta mantida) |
| data no futuro | — | — | agora |
| canteiros além do 4º | — | — | removidos, **semente devolvida** (ela tinha sido gasta) |
| último saquinho | `null` ou número ≤ agora | agora (espera o intervalo; não ganha saquinho de graça) | agora |
| tutorial visto | `true` / `false` | deduzido do progresso | deduzido do progresso |

**Princípios:**
1. O que é válido fica.
2. Ausente e inválido são diferenciados no relatório (`issues`).
3. **Nada é criado do nada:** quantidade sem valor confiável vira 0.
4. **Ninguém fica travado:** se a recuperação deixar a jogadora sem sementes e sem plantas, o saquinho grátis fica disponível na hora.
5. **Nunca lança erro.**
6. **Recuperação estável:** recuperar de novo não muda nada nem duplica recursos (testado).

O Correio usa a mesma ideia (`sanitizeMail`): cartas e visitas válidas são mantidas e ids inválidos são descartados. O Correio da chave v1 é sempre aproveitado quando o save novo está ilegível.

### Testes (`src/economy/farm.test.ts`, 11 novos)

- save íntegro;
- sementes e alimentos parcialmente ausentes;
- negativos, não finitos e não numéricos;
- canteiros inválidos;
- datas inválidas e no futuro;
- canteiros além do limite;
- objeto incompleto;
- último saquinho inválido;
- save totalmente corrompido (6 tipos de lixo);
- estabilidade (sem duplicação).

## 4. Arquivos modificados

| Arquivo | Mudança |
| --- | --- |
| `src/lib/save.ts` | reescrito como "loja" criável (`createSaveStore`): `interpretSave` (versões), cópia de segurança, `transactSave` com Web Locks e timeout, `updateSave` de melhor esforço, evento `storage`, status do save |
| `src/economy/farm.ts` | `recoverEconomy` com política documentada (`sanitizeEconomy` continua como atalho) |
| `src/economy/store.ts` | ações econômicas assíncronas pelo lock; erros das regras + erros de proteção; devolve `before` |
| `src/modules/farm/FarmPage.tsx` | espera as ações, ignora toques durante a espera (`aria-busy`), mensagem pelo estado real, aviso de somente leitura |
| `src/modules/farm/farmText.ts` | mensagens para `sem-protecao`, `ocupado`, `save-incompativel`, `falha-ao-salvar` |
| `src/modules/farm/Farm.css` | estilo do aviso de somente leitura |
| `src/test/fakeLocks.ts` *(novo)* | LockManager de teste (FIFO exclusivo, com AbortSignal) |
| `src/test/memoryStorage.ts` *(novo)* | armazenamento compartilhável entre "abas" de teste, com contador de gravações |
| `src/test/setup.ts` | Web Locks de teste e save novo a cada teste |
| `src/economy/concurrency.test.ts` *(novo)* | cenários de concorrência |
| `src/lib/save.test.ts` | reescrito para as regras de versão |
| `src/economy/farm.test.ts` | testes de recuperação, no lugar dos 3 antigos de "dados salvos" (mais rigorosos) |
| `src/modules/farm/FarmPage.test.tsx` | ações aguardadas + toque duplo, foco, sem Web Locks e save futuro |
| `src/lib/progress.test.ts`, `src/modules/mail/MailPage.test.tsx` | aguardam a gravação (agora assíncrona) antes de ler o armazenamento |

**Sobre os testes anteriores:**
- **Nenhum foi enfraquecido.** Os que liam o armazenamento logo após uma ação agora **esperam a gravação terminar** e conferem o mesmo valor.
- Os 3 testes antigos de "dados salvos" foram substituídos por 11 que cobrem os mesmos casos e mais.
- O teste antigo de "outra aba" foi substituído pelos 10 de concorrência.

## 5. Validação

| Comando | Resultado |
| --- | --- |
| `npm test` | **151 / 151 testes passando**, 14 arquivos (eram 117) |
| `npm run typecheck` | **sem erros** |
| `npm run build` | **sem erros**; Fazendinha 4,4 KB JS gzip; pacote inicial 75,2 KB gzip; nenhuma dependência nova |

Por arquivo:

| Arquivo | Testes |
| --- | --- |
| App | 12 |
| router | 9 |
| concurrency | 10 |
| farm | 25 |
| progress | 4 |
| random | 5 |
| save | 19 |
| sprites | 5 |
| FarmPage | 12 |
| feedLogic | 9 |
| FeedPage | 15 |
| MailPage | 9 |
| unlocks | 10 |
| OraclePage | 7 |

**Verificação manual** (Chromium, 390 px, `localhost` com Web Locks reais), partindo de um navegador **só com o save antigo do Correio** (3 cartas lidas):

| # | Passo | Resultado |
| --- | --- | --- |
| 1 | Abrir a Fazendinha | tutorial; Correio já migrado para v2, chave v1 intacta |
| 2 | Plantar nos 4 canteiros | 4 × milho, sementes 4 → 0 |
| 3–4 | Recarregar | os 4 cultivos permanecem, contagem continua (28–29 s) |
| 5 | Aguardar | os 4 ficaram prontos no tempo real; anúncio "Pronto para colher" |
| 6–7 | Colher | estoque **20 milho**, sementes de volta a **4** |
| 8 | Abrir o Correio | **4 / 10 encontradas · 3 lidas** (igual ao início); chave v1 intacta; nenhuma cópia de segurança desnecessária |
| 9 | Duas abas | colheita e saquinho simultâneos: **uma** operação vale, a outra é recusada com mensagem (ver seção 1); a tela da outra aba sincronizou |
| extra | Save v3 | aviso de somente leitura; o save ficou idêntico |

## 6. Pendências e limitações conhecidas

- **Sem Web Locks, a economia fica bloqueada (por decisão de segurança).** Hoje isso só acontece em navegadores muito antigos ou fora de HTTPS. A mensagem orienta a atualizar o navegador.
- **Correio sem Web Locks:** grava em melhor esforço, sem garantia de atomicidade. No pior caso, perde uma cutucada se duas abas gravarem no mesmo instante. Não afeta a economia.
- **Exclusão mútua real entre processos:** só pode ser comprovada no navegador (feito manualmente). Os testes automáticos rodam numa única thread.
- **Cópias de segurança** (`pru:save:backup:*`) só são criadas quando há recuperação. Ainda não existe tela para restaurá-las; hoje a restauração é manual.
- **Ainda não testado em celular real** (Safari iOS: Web Locks desde a 15.4).
- **Integração econômica** com Oráculo, Alimentar e Correio: **não iniciada**, aguardando a aprovação desta entrega.
