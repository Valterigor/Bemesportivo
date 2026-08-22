# Changelog

Mudanças relevantes do projeto são registradas neste arquivo.

## Não publicado

### Alterado

- Meu Caminho Be colocado temporariamente em modo local: registros livres sem login e dados somente no aparelho.
- Sincronizações de conta, continuidade entre aparelhos e publicações externas pausadas sem apagar dados existentes.
- Estrutura separada entre fontes, arquivos públicos, testes, ferramentas e histórico.
- Build e servidor local movidos para `scripts/`.
- Testes organizados em `tests/integration/` e `tests/e2e/`.
- Configuração do Cloudflare Pages versionada em `wrangler.toml`.

### Removido do deploy

- Recursos legados sem consumidores internos.
- Compatibilidade executável com Netlify, preservada somente em `archive/`.
- Logs, mídia bruta e protótipos locais.

## 2026-05-31

### Corrigido

- Seleção do país principal em nomes compostos.
- Dimensões e enquadramento das bandeiras em cards e tabelas.
- Exibição de seleções compostas com nome completo acessível.
