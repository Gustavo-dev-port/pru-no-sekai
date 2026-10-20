# PRU NO SEKAI — Entrega 01 (v0.1)

Primeira entrega pedida na seção 6 do briefing. **Status geral: o Módulo 1 é um protótipo funcional. Os Módulos 2, 3 e 4 ainda não foram implementados**: eles têm rota, tela e lugar na navegação, mas mostram um aviso honesto de "Em construção" com a lista do que falta.

---

## 1. Estrutura de pastas

```
pru-no-sekai/
├── index.html                  # HTML base (pt-BR, meta tags, fonte)
├── public/favicon.svg          # ícone de torii
├── vite.config.ts
├── tsconfig.json
├── docs/ENTREGA-01.md          # este documento
└── src/
    ├── main.tsx                # ponto de entrada
    ├── App.tsx                 # escolhe a tela pela rota; módulos 2–4 com lazy load
    ├── router.ts               # roteador por hash (#/oraculo), sem dependência
    ├── styles/
    │   ├── tokens.css          # design system: cores, tipografia, espaços, sombras, movimento
    │   ├── global.css          # reset, botões, selos, keyframes, movimento reduzido
    │   └── app.css             # tela de carregamento
    ├── data/                   # TODO o conteúdo editável fica aqui
    │   ├── modules.ts          # os 4 módulos: nome, rota, textos, checklist feito/pendente
    │   └── guardianMessages.ts # falas do Pombo-sama
    ├── lib/
    │   ├── random.ts           # sorteio que nunca repete o item anterior
    │   └── session.ts          # lembra (só na aba) se já entrou no santuário
    ├── hooks/
    │   ├── usePrefersReducedMotion.ts
    │   ├── useRotatingMessage.ts
    │   └── useFocusOnMount.ts  # foco no título ao trocar de tela
    ├── components/             # peças reutilizáveis
    │   ├── Pigeon.tsx          # pombo em SVG com chapéus (eboshi, carteiro, omikuji)
    │   ├── GardenScene.tsx     # jardim, Fuji, cerejeiras, lanternas de pedra, torii
    │   ├── SakuraPetals.tsx    # pétalas caindo (CSS)
    │   ├── PaperLanterns.tsx   # varal de chōchin
    │   ├── Guardian.tsx        # balão de fala + pombo clicável
    │   ├── BottomNav.tsx       # barra inferior com os 4 módulos
    │   ├── WipModulePage.tsx   # tela "em construção" dos módulos 2–4
    │   └── icons.tsx           # ícones dos módulos
    └── modules/
        ├── sanctuary/          # Módulo 1 — protótipo funcional
        │   ├── SanctuaryPage.tsx   # máquina de estados: portão → travessia → pátio
        │   ├── Gate.tsx
        │   ├── Courtyard.tsx
        │   └── Sanctuary.css
        ├── oracle/OraclePage.tsx   # Módulo 2 — placeholder
        ├── feed/FeedPage.tsx       # Módulo 3 — placeholder
        └── mail/MailPage.tsx       # Módulo 4 — placeholder
```

Cada módulo novo cresce dentro da própria pasta em `src/modules/`, com o conteúdo em `src/data/`.

## 2. Arquitetura técnica

- **Stack:** React 19, TypeScript 7 (modo estrito), Vite 8, CSS puro com variáveis. Nenhuma biblioteca de UI, animação ou roteamento: as únicas dependências de execução são `react` e `react-dom`.
- **Roteamento:** por hash (`#/`, `#/oraculo`, `#/alimentar`, `#/correio`), em `router.ts`. Funciona em qualquer hospedagem estática sem configuração, e o botão "voltar" do navegador funciona.
- **Carregamento:** o Santuário vai no pacote principal; Oráculo, Alimentar e Correio são carregados sob demanda (`React.lazy`), cada um no seu arquivo. Build atual: **~76 KB de JS gzip + ~3 KB de CSS gzip** na primeira visita. Toda a arte é SVG/CSS inline, sem imagens para baixar.
- **Estado:** local em cada tela (`useState`). Único dado guardado: um marcador no `sessionStorage` dizendo que a pessoa já atravessou o torii nesta aba, para não repetir a intro ao voltar de outro módulo. Leitura e escrita toleram falha (aba privada etc.).
- **Conteúdo:** textos e configurações ficam em `src/data/*.ts`, com tipos. Sem banco de dados e sem chamadas de rede (fora a fonte do Google Fonts).
- **Privacidade:** nada é coletado, não há analytics, cookies nem formulários.
- **Aleatoriedade sem repetição:** `pickIndexAvoiding()` em `lib/random.ts` sorteia entre os itens que não são o anterior. Já é usada pelo pombo guardião e será reaproveitada pelo Oráculo.
- **Acessibilidade:**
  - HTML semântico (`main`, `nav`, `header`, listas).
  - Um `h1` por tela, que recebe o foco ao trocar de rota.
  - O balão do pombo é `aria-live="polite"`.
  - Botões e links reais, todos com alvo de toque de no mínimo 44 px.
  - Foco visível.
  - `aria-current` na navegação.
  - Arte decorativa com `aria-hidden`.
- **Movimento reduzido:** com `prefers-reduced-motion: reduce`, toda animação e transição é praticamente zerada, as pétalas somem e a travessia do torii vira troca direta de tela (`usePrefersReducedMotion`).
- **Deploy:** Vercel detecta o Vite sozinha (`npm run build` → `dist/`). Não foi publicado ainda.

## 3. Design system inicial

Todos os tokens estão em `src/styles/tokens.css`.

**Paleta**

| Grupo | Tokens | Uso |
| --- | --- | --- |
| Sakura | `--sakura-50` … `--sakura-700` | fundos rosados, pétalas, ação principal (`700` é a cor de botão/texto com contraste AA) |
| Creme | `--cream-50` … `--cream-300` | fundo base, cartões, caminho de pedra |
| Sálvia | `--sage-100` … `--sage-700` | chão, colinas, estado "pronto" |
| Santuário | `--torii`, `--lacquer`, `--gold`, `--wood`, `--lantern-glow` | torii, laca preta, placas de madeira (ema), lanternas |
| Pombo | `--pigeon-*`, `--neck-green`, `--neck-purple`, `--pigeon-eye`, `--pigeon-feet` | o pombo |
| Texto | `--ink`, `--ink-soft` | texto principal e secundário (marrom-ameixa, nunca preto puro) |

**Tipografia:** Zen Maru Gothic (arredondada, kawaii, cobre japonês e português), com a fonte arredondada do sistema como reserva. A escala vai de `--text-xs` até `--text-hero`, com `clamp()` nos títulos.

**Forma "de minijogo":**
- Contorno grosso (`--border-chunky`, 3 px).
- Cantos bem arredondados (`--radius-*`).
- Sombra "pop" com base sólida (`--shadow-pop`). Ao apertar, o botão afunda (`--shadow-pressed`).

**Componentes base:**
- `.btn`, `.btn--primary`, `.btn--ghost`
- `.badge--wip` e `.badge--done`
- `.eyebrow`
- Balão de fala (`Guardian`)
- Ema: cartão de madeira em formato de casinha, usado na navegação do santuário
- Barra inferior (`BottomNav`)

**Movimento:** durações `--dur-fast/med/slow` e curvas `--ease-out`/`--ease-bounce`. Keyframes compartilhados: `pop-in`, `wobble` (cutucada no pombo), `head-bob` (cabeça de pombo), `sway` (lanternas).

**Personagem:** o `Pigeon` é um componente único com variações de chapéu:
- `eboshi`: Pombo-sama, o guardião
- `mail`: carteiro
- `omikuji`: faixa de vidente

Assim o pombo tem o mesmo visual em todos os módulos.

## 4. Protótipo da tela inicial (Módulo 1)

1. **Portão:** jardim japonês com o Monte Fuji emoldurado pelo torii (placa "プル"), cerejeiras, lanternas de pedra piscando, caminho de pedra e pétalas caindo. Título "Pru no Sekai / プルの世界".
2. **Pombo guardião (Pombo-sama):** toque nele para ouvir uma de 14 falas engraçadas, nunca a mesma duas vezes seguidas. Ele balança ao ser cutucado e mexe a cabeça o tempo todo, como pombo de verdade.
3. **Animação de entrada:** "Atravessar o torii" faz a câmera dar zoom pelo vão do portão e a tela clarear em rosa. Depois, o pátio aparece.
4. **Pátio:** varal de lanternas de papel e o guardião com uma saudação. Três **ema** (plaquinhas de pedido) levam ao Oráculo, ao Alimentar e ao Correio. Há também a opção "Voltar ao portão" para rever a entrada.

## 5. Navegação entre os quatro módulos

- Do pátio do santuário: as três ema.
- Dentro de cada módulo: barra inferior fixa com os quatro (Santuário, Oráculo, Alimentar, Correio) e o botão "Voltar ao santuário".
- O botão voltar do navegador funciona, e também é possível abrir o link direto de um módulo (ex.: `/#/correio`).

## 6. Execução local

Veja o [README](../README.md): `npm install` e depois `npm run dev`.

## 7. Implementado × pendente

### Implementado nesta entrega
- [x] Projeto React + TypeScript + Vite com build de produção funcionando (`npm run build` sem erros)
- [x] Design system em tokens CSS
- [x] Módulo 1: jardim japonês com torii
- [x] Módulo 1: pombo guardião com falas aleatórias sem repetição consecutiva
- [x] Módulo 1: animação de entrada no santuário (com alternativa sem movimento)
- [x] Módulo 1: navegação para as outras três experiências
- [x] Rotas e telas "em construção" para os módulos 2, 3 e 4, cada uma com a lista do que falta
- [x] Barra de navegação entre os quatro módulos
- [x] Layout mobile-first (coluna única no celular, três colunas de ema a partir de 720 px)
- [x] Respeito a `prefers-reduced-motion`
- [x] Sem login, banco de dados, serviços pagos ou coleta de dados

### Pendente
- [ ] **Módulo 2 — Oráculo dos Pombos:** sorteio, apresentação omikuji, animação de revelação, banco de previsões, sem repetição (a função de sorteio já existe)
- [ ] **Módulo 3 — Alimente o Pombo:** grãos, animação de comer, contador, pombos surgindo, invasão, recomeçar
- [ ] **Módulo 4 — Correio Pombo do Amor:** pombo-carteiro, cartas, abertura de envelope, categorias, surpresas
- [ ] Textos personalizados das cartas e previsões (precisam vir do dono do projeto, porque são pessoais)
- [ ] Sons e efeitos sonoros, desligados por padrão (não estavam no briefing; ficam como sugestão)
- [ ] Hospedar a fonte localmente para não depender do Google Fonts (otimização de rede móvel)
- [ ] Testes automatizados (ex.: Vitest para `pickIndexAvoiding` e para o roteador)
- [ ] Publicação na Vercel e teste em aparelhos reais (iOS Safari e Android Chrome)
- [ ] Auditoria de acessibilidade com leitor de tela real (VoiceOver/TalkBack)
