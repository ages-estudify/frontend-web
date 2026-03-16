# Frontend Web — Ages3

Frontend da aplicação Estudify, desenvolvido com React, TypeScript e Vite.

## Tecnologias

- **React 19** — Interface de usuário
- **TypeScript** — Tipagem estática
- **Vite** — Build e dev server
- **React Router DOM** — Roteamento
- **Tailwind CSS** — Estilização
- **ESLint** — Linting

## Estrutura de pastas

```
frontend-web/
├── public/                 # Arquivos estáticos públicos
│   └── favicon.svg
├── src/
│   ├── pages/              # Páginas da aplicação
│   │   ├── HomePage.tsx
│   │   └── NotFoundPage.tsx
│   ├── routes/             # Configuração de rotas
│   │   └── index.tsx
│   ├── App.tsx             # Componente raiz
│   ├── main.tsx            # Entrada da aplicação
│   └── index.css           # Estilos globais (Tailwind)
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.app.json
└── tsconfig.node.json
```

### Descrição das pastas

| Pasta/Arquivo | Descrição |
|---------------|-----------|
| `public/` | Arquivos servidos como estão (ícones, imagens estáticas). |
| `src/pages/` | Componentes de página, um por rota. |
| `src/routes/` | Definição das rotas com React Router. |
| `src/App.tsx` | Componente principal que renderiza as rotas. |
| `src/main.tsx` | Ponto de entrada; monta o React no DOM. |
| `src/index.css` | Estilos globais e diretivas do Tailwind. |

## Pré-requisitos

- **Node.js** 18+ (recomendado 20+)
- **npm** (ou yarn/pnpm)

## Como rodar

### 1. Instalar dependências

```bash
npm install
```

### 2. Subir o servidor de desenvolvimento

```bash
npm run dev
```

### 3. Acessar o site

Com o servidor rodando, abra no navegador:

- **URL local:** [http://localhost:5001](http://localhost:5001)

O Vite está configurado para usar a porta **5001** (definida em `vite.config.ts`). O hot reload (HMR) atualiza a página automaticamente ao salvar arquivos.

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento (porta 5001). |
| `npm run build` | Gera o build de produção em `dist/`. |
| `npm run preview` | Serve o build de produção localmente para testar. |
| `npm run lint` | Executa o ESLint no código. |

## Build para produção

```bash
npm run build
```

Os arquivos de saída ficam em **`dist/`**. Para servir esse build localmente:

```bash
npm run preview
```

## Rotas

- `/` — Página inicial (`HomePage`)
- Qualquer outra rota — Página 404 (`NotFoundPage`)

## Variáveis de ambiente

Se o projeto passar a usar variáveis de ambiente (ex.: URL da API), crie um arquivo `.env` na raiz. Variáveis devem ter o prefixo `VITE_` para serem expostas ao cliente. Exemplo:

```env
VITE_API_URL=http://localhost:3000
```

No código: `import.meta.env.VITE_API_URL`.

## Licença

Projeto privado.
