# Pru no Sekai プルの世界

Um santuário interativo de pombos, cerejeiras e carinho, feito para a Pru.

React 19 + TypeScript + Vite + CSS puro. Sem login, sem banco de dados e sem serviços pagos. O progresso fica só no aparelho (`localStorage`); nada é enviado a servidor.

## Os cinco módulos

| # | Módulo | Rota | Estado |
| --- | --- | --- | --- |
| 1 | Santuário da Grande Pru | `#/` | pronto |
| 2 | Oráculo dos Pombos | `#/oraculo` | pronto |
| 3 | Alimente o Pombo | `#/alimentar` | pronto |
| 4 | Correio Pombo do Amor | `#/correio` | pronto |
| 5 | Fazendinha da Pru | `#/fazenda` | jogável; **falta** gastar os alimentos colhidos nos outros módulos |

Ainda não existe a economia compartilhada: os alimentos da Fazendinha só se acumulam no estoque.

## Rodar localmente

Pré-requisito: Node.js **20.19 ou mais novo na linha 20**, ou **22.12 ou mais novo** (exigência do Vite 8; testado com o 22.14).

```bash
npm install
```

```bash
npm run dev
```

Abra o endereço que o Vite mostrar (por padrão, http://localhost:5173).

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com recarga automática |
| `npm test` | Roda os testes automatizados (Vitest) uma vez |
| `npm run test:watch` | Testes em modo observação |
| `npm run typecheck` | Checagem de tipos do TypeScript |
| `npm run build` | Checa os tipos e gera a versão de produção em `dist/` |
| `npm run preview` | Serve o `dist/` localmente para testar a build |

Para testar no celular na mesma rede Wi-Fi: `npm run dev -- --host` e abra o IP mostrado. Atenção: fora de HTTPS ou `localhost` o navegador não oferece Web Locks, e a Fazendinha recusa as ações (ver [arquitetura](docs/ARQUITETURA.md)).

## Publicar na Vercel

Importe o repositório na Vercel. Ela detecta o Vite sozinha (build `npm run build`, saída `dist`). Como as rotas usam hash (`#/oraculo`), não precisa de `vercel.json`.

## Onde editar o conteúdo

- Falas do pombo guardião: `src/data/guardianMessages.ts`
- Previsões do Oráculo: `src/data/fortunes.json`
- Etapas e falas do minijogo Alimentar: `src/data/feedGame.ts`
- Cartas, regras de desbloqueio e falas do carteiro: `src/data/loveLetters.ts`
- Plantas, tempos, produção e saquinho grátis da Fazendinha: `src/data/crops.ts`
- Nomes, textos e checklist dos módulos: `src/data/modules.ts`
- Cores, fontes, espaçamentos: `src/styles/tokens.css`

## Documentação

- Arquitetura (salvamento, Fazendinha, proteção entre abas): [docs/ARQUITETURA.md](docs/ARQUITETURA.md)
- Histórico das entregas: `docs/ENTREGA-01.md` a `docs/ENTREGA-07.1.md`
