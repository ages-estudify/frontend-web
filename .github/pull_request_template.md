[86ag34uh1](https://app.clickup.com/t/86ag34uh1)

<!--
    [ID da task no Clickup](URL para a task no Clickup)
-->

## Descrição

<!--
    Descrição sobre o que foi feito nessa branch
-->

## Instruções para teste (se necessário)

<!--
    Caso necessário, instruções de como testar as mudanças realizadas. Ex: rodar o app, acessar a rota X, clicar em Y.
-->

## Tipo de mudança

- [ ] 🐛 Bugfix (correção de uma falha existente)
- [ ] ✨ Nova feature (adição de nova funcionalidade)
- [ ] ♻️ Refatoração (mudança estrutural que não altera o comportamento final)
- [ ] 📚 Documentação (atualizações no README, comentários, JSDoc)
- [ ] ⚙️ Configuração / Core (mudanças em dependências, CI/CD, tooling)

## Checklist de Padrões React

- [ ] Componentes estão organizados e com responsabilidades claras (um componente por arquivo quando fizer sentido).
- [ ] Hooks customizados foram usados quando a lógica é reutilizável.
- [ ] Props tipadas com TypeScript (interfaces/types explícitos quando ajudar na leitura).
- [ ] Acessibilidade básica considerada (labels, roles, contraste, foco em formulários quando aplicável).

## Testes

- [ ] Testes relevantes (`*.test.tsx`) foram criados/atualizados com Vitest e React Testing Library (quando aplicável).
- [ ] O comando `npm run test:run` passa com sucesso.

## Checklist Geral

- [ ] O código passou pelo linter (`npm run lint`).
- [ ] O código foi formatado com Prettier (ex.: via lint-staged no commit).
- [ ] O typecheck passa (`npm run typecheck`).
- [ ] Realizei uma auto-revisão do meu próprio código.
