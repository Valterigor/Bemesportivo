# Publicação

## Site e Pages Functions

O projeto `bemesportivo` usa `wrangler.toml`, executa `npm run build` e publica `dist/`. O diretório `functions/` deve ser incluído como Pages Functions.

Fluxo recomendado:

1. Execute `npm run verify:full`.
2. Confirme que não há segredos ou arquivos locais no diff.
3. Faça commit de escopo único.
4. Envie `main` somente com autorização explícita.
5. Aguarde a implantação ativa.
6. Valide `/`, `/meu-caminho-be`, `/reportagens` e `/api/auth-config`.

## Banco

```bash
npx --yes supabase@latest db push --dry-run --linked
npx --yes supabase@latest db push --linked
```

Revise integralmente cada migração antes do segundo comando.

## Worker de notificações

```bash
npm run deploy:notifications
```

O Worker tem ciclo de publicação separado e usa `workers/wrangler.notifications.jsonc`.

## Segredos

Nunca salve valores em `.env.example`, `wrangler.toml`, código ou documentação. O repositório contém somente nomes de variáveis e identificadores públicos de bindings.
