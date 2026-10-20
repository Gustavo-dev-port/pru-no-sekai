# Pru no Sekai プルの世界

Um santuário interativo de pombos, cerejeiras e carinho, feito para a Pru.

React 19 + TypeScript + Vite + CSS puro. Sem login, sem banco de dados, sem serviços pagos e sem coleta de dados pessoais.

## Rodar localmente

Pré-requisito: Node.js 20 ou mais novo (testado com o 22.14).

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

Para testar no celular na mesma rede Wi-Fi: `npm run dev -- --host` e abra o IP mostrado.

## Publicar na Vercel

Importe o repositório na Vercel. Ela detecta o Vite sozinha (build `npm run build`, saída `dist`). Como as rotas usam hash (`#/oraculo`), não precisa de `vercel.json`.

## Onde editar o conteúdo

- Falas do pombo guardião: `src/data/guardianMessages.ts`
- Nomes, textos e checklist dos módulos: `src/data/modules.ts`
- Cores, fontes, espaçamentos: `src/styles/tokens.css`

Documentação da entrega: [docs/ENTREGA-01.md](docs/ENTREGA-01.md).
