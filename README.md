# Frontend Web — Ages3

Frontend da aplicação Estudify, desenvolvido com React, TypeScript e Vite.

## Tecnologias

| Tecnologia | Uso |
|------------|-----|
| **React 19** | Interface de usuário |
| **TypeScript** | Tipagem estática |
| **Vite 8** | Build e dev server |
| **React Router DOM 7** | Roteamento |
| **Tailwind CSS** | Estilização |
| **ESLint 9** | Linting (flat config) |
| **Prettier** | Formatação de código |
| **Vitest** | Testes unitários |
| **React Testing Library** | Testes de componentes |
| **Husky** | Git hooks |
| **lint-staged** | Lint e format apenas em arquivos staged |

## Pré-requisitos

- **Node.js** 20+ (recomendado LTS)
- **npm** (ou yarn/pnpm)

## Comandos para rodar a aplicação

### 1. Instalar dependências

```bash
npm install
```

(O script `prepare` roda automaticamente e configura o Husky para os hooks de Git.)

### 2. Servidor de desenvolvimento

```bash
npm run dev
```

A aplicação sobe em **http://localhost:5001** (porta definida em `vite.config.ts`). O Vite usa HMR: a página atualiza ao salvar arquivos.

### 3. Build para produção

```bash
npm run build
```

A saída fica em **`dist/`**. Para servir o build localmente:

```bash
npm run preview
```

## Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento (porta 5001). |
| `npm run build` | Gera o build de produção (`tsc -b` + `vite build`). |
| `npm run preview` | Serve o conteúdo de `dist/` localmente. |
| `npm run lint` | Executa o ESLint em todo o projeto. |
| `npm run typecheck` | Roda a checagem de tipos do TypeScript (`tsc -b`). |
| `npm run test` | Roda os testes em modo watch (Vitest). |
| `npm run test:run` | Roda os testes uma vez (útil para CI e pre-push). |
| `npm run prepare` | Configura o Husky (roda automaticamente após `npm install`). |

## Estrutura de pastas

```
frontend-web/
├── .github/
│   └── pull_request_template.md   # Template de PR
├── .husky/                         # Git hooks (Husky)
│   ├── commit-msg                  # Valida mensagem de commit
│   ├── pre-commit                  # Roda lint-staged
│   └── pre-push                    # Valida nome da branch
├── public/                         # Arquivos estáticos
│   └── favicon.svg
├── src/
│   ├── pages/                      # Páginas (uma por rota)
│   │   ├── HomePage.tsx
│   │   └── NotFoundPage.tsx
│   ├── routes/                     # Configuração de rotas (React Router)
│   │   └── index.tsx
│   ├── hooks/                      # Hooks customizados (quando houver)
│   ├── test/                       # Configuração de testes
│   │   └── setup.ts                # Setup global (ex.: jest-dom)
│   ├── App.tsx                     # Componente raiz
│   ├── App.test.tsx                # Testes do App
│   ├── main.tsx                    # Entrada da aplicação
│   └── index.css                   # Estilos globais (Tailwind)
├── index.html
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── .prettierrc
├── .env.example                    # Exemplo de variáveis de ambiente
└── package.json
```

### Descrição das pastas principais

| Pasta/Arquivo | Descrição |
|---------------|-----------|
| `src/pages/` | Componentes de página, um por rota principal. |
| `src/routes/` | Definição das rotas com React Router (`createBrowserRouter`). |
| `src/hooks/` | Hooks customizados reutilizáveis. |
| `src/test/` | Arquivos de setup dos testes (ex.: `@testing-library/jest-dom`). |
| `src/App.tsx` | Componente raiz que renderiza as rotas. |
| `src/main.tsx` | Ponto de entrada; monta o React no DOM. |
| `src/index.css` | Estilos globais e diretivas do Tailwind. |
| `public/` | Arquivos servidos como estão (favicon, assets estáticos). |

## Padrões a serem seguidos

### Código e estilo

- **ESLint**: o código deve passar em `npm run lint`. Regras incluem TypeScript, React Hooks e React Refresh.
- **Prettier**: formatação automática (ex.: via lint-staged no commit). Config em `.prettierrc` (single quote, trailing comma, ordem de imports com plugin).
- **TypeScript**: modo strict ativo. Rodar `npm run typecheck` antes de commitar.
- **Alias `@/`**: importe de `src/` com alias, ex.: `import { Foo } from '@/components/Foo'` (configurado em `tsconfig.app.json` e `vite.config.ts`).

### Componentes e React

- **Um componente por arquivo** quando fizer sentido; manter responsabilidades claras.
- **Hooks customizados** para lógica reutilizável (ex.: em `src/hooks/`).
- **Props tipadas** com TypeScript (interfaces/types quando melhorar a leitura).
- **Acessibilidade**: labels em formulários, uso de roles quando necessário, contraste e foco considerados.

### Testes

- **Vitest** + **React Testing Library** para testes de componentes.
- Arquivos de teste: `*.test.tsx` (ou `*.spec.tsx`).
- Setup global em `src/test/setup.ts` (ex.: matchers do jest-dom).
- Manter `npm run test:run` passando; usar testes em mudanças de regra de negócio ou UI relevante.

### Git: branches e commits (Husky)

Os hooks validam automaticamente:

**Nome da branch** (pre-push):

- Padrão: `tipo(id_clickup)/nome-da-branch`
- Exemplos: `feature(86ag34u4q)/add-login`, `fix(86ag34u4q)/corrige-botao`
- Tipos: `feature`, `fix`, `hotfix`, `chore`, `refactor`, `arch`, `docs`, `test`
- Branches permitidas sem padrão: `main`, `develop`

**Mensagem de commit** (commit-msg):

- Padrão: `tipo(id_clickup): descrição com pelo menos 5 caracteres`
- Exemplo: `feature(86ag34u4q): add suporte a dark mode`
- Tipos: os mesmos da branch.

**Pre-commit**: roda **lint-staged** (ESLint --fix e Prettier nos arquivos staged).

### Variáveis de ambiente

- Copie `.env.example` para `.env` e preencha os valores.
- Variáveis expostas ao cliente devem ter o prefixo **`VITE_`** (ex.: `VITE_API_URL`).
- No código: `import.meta.env.VITE_API_URL`.
- O arquivo `.env` não é versionado (está no `.gitignore`).

## Rotas

- **`/`** — Página inicial (`HomePage`)
- Qualquer rota inexistente — Página 404 (`NotFoundPage`)

## Licença

Projeto privado.
