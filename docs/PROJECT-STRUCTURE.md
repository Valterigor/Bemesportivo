# Estrutura operacional

## Onde editar

- Página ou reportagem: arquivo HTML correspondente na raiz.
- Componente visual compartilhado: `css/components/` e `js/components/`.
- Tokens e primitivas: `css/core/`.
- Meu Caminho autenticado: `src/apps/meu-caminho/`.
- API: `functions/api/`, com regras reutilizáveis em `server/`.
- Banco e RLS: nova migração em `supabase/migrations/`; nunca edite uma migração já aplicada.
- Worker agendado: `workers/`.

## O que não editar

- `dist/`: sempre regenerado.
- `js/meu-caminho-auth.js` e `js/meu-caminho-account.js`: bundles gerados.
- `archive/`: referência histórica congelada.
- `.local-reference/` e `testes/`: materiais locais fora do produto.

## Rotina segura

```bash
npm run dev
npm run check
npm run build
npm test
npm run test:e2e
```

Antes de commit:

```bash
npm run verify:full
git diff --check
git status --short
```

## Critério de organização

Um arquivo deve ter uma única responsabilidade e um único lugar oficial. Se houver uma versão editável e outra gerada, ambas precisam estar identificadas. Compatibilidade antiga fica em `archive/`, nunca misturada ao caminho de produção.
