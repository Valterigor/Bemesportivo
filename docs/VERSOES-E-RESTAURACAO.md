# Versões e restauração do site

O site é publicado pelo Cloudflare Pages a partir da branch `main`. Cada versão pode ser marcada com uma tag Git e recuperada sem apagar o histórico.

## Voltar à versão anterior ao feed

Ponto de retorno: `site-2026-09-30-before-feed`, commit `1c5efa4`.

Na pasta do projeto:

```powershell
npm run site:versions
npm run site:rollback -- site-2026-09-30-before-feed
```

O comando busca as tags, cria uma cópia isolada em `.local-reference/rollback-*`, salva uma tag de segurança e prepara um novo commit com a árvore exata da versão escolhida. Seus arquivos locais e a branch em uso permanecem intactos. Nenhum envio é automático.

Entre na pasta indicada, execute `npm ci` e `npm run build`, e confira a versão. O comando imprime os dois `git push` necessários: primeiro a tag de segurança e depois a branch de restauração para `main`. Execute-os para publicar. Não use `--force`. Se alguém atualizar `main` nesse intervalo, prepare novamente a restauração.

O Cloudflare fará outra implantação. Confira o endereço público após a conclusão. A restauração inclui código e arquivos versionados, mas não altera dados do Supabase, KV, contas, segredos ou Workers publicados separadamente.

## Recuperar uma versão mais nova

O mesmo comando aceita outra tag `site-*` que pertença ao histórico de `main`. A versão do feed está marcada como `site-2026-09-30-feed`. Para voltar a ela, passe essa tag ao comando de restauração.

Ao restaurar uma versão antiga, os comandos npm criados depois dela deixam de existir nessa cópia. Mantenha a pasta original, onde o script continua disponível. Em uma instalação nova da versão antiga, recupere o script sem trocar de branch:

```powershell
git fetch origin --tags
git show site-2026-09-30-feed:scripts/site-version.cjs | Set-Content -Encoding UTF8 "$env:TEMP/be-site-version.cjs"
node "$env:TEMP/be-site-version.cjs" prepare site-2026-09-30-feed
```

## Próximas publicações

Antes de alterar `main`, marque o commit publicado com `git tag -a site-DATA-before-NOME origin/main -m "Versão anterior"` e envie a tag com `git push origin refs/tags/site-DATA-before-NOME`. Depois de validar a publicação, marque também o novo commit. Nunca mova ou reutilize uma tag já publicada.
