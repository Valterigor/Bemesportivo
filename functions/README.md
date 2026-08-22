# Cloudflare Pages Functions

Rotas em `api/` são publicadas sob `/api/*`. O middleware raiz aplica headers comuns de segurança.

Regras reutilizáveis ficam em `server/`. Toda escrita deve validar método, origem, tamanho e formato da entrada; endpoints privados também exigem autenticação e autorização.
