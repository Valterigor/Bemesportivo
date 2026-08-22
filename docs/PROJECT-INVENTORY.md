# Inventário do projeto

| Área | Responsabilidade | Publicada |
| --- | --- | --- |
| Raiz `*.html` | Páginas e entradas públicas | Sim |
| `css/`, `js/`, `img/`, `videos/` | Recursos do navegador | Sim |
| `src/apps/` | Fontes editáveis dos bundles | Não diretamente |
| `functions/` | Cloudflare Pages Functions | Sim, como backend |
| `server/` | Regras compartilhadas do backend | Empacotada quando usada |
| `workers/` | Worker agendado e configuração | Deploy separado |
| `supabase/` | Migrações e configuração local | Migrações aplicadas separadamente |
| `scripts/` | Build, desenvolvimento e manutenção | Não |
| `tests/` | Integração e navegador | Não |
| `docs/` | Arquitetura e operação | Não |
| `archive/` | Histórico não executável | Não |
| `.local-reference/` | Materiais brutos e privados locais | Nunca |
| `dist/` | Resultado gerado pelo build | Artefato de deploy |

## Arquivos obrigatórios na raiz

- `README.md`, `package.json`, `package-lock.json`
- `wrangler.toml`, `playwright.config.js`
- `_headers`, `_redirects`
- `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, `ads.txt`
- páginas HTML e os poucos CSS/JS públicos compartilhados ainda mantidos na raiz

## Regras de mídia

1. `img/` e `videos/` recebem somente versões finais referenciadas.
2. Arquivos originais de WhatsApp, capturas e exportações ficam em `.local-reference/inbox/`.
3. Ferramentas, modelos e protótipos grandes ficam em `testes/`, que é local e ignorado.
4. Arquivos sem consumidor são removidos do build ou preservados em `archive/`.

## Legado preservado

- `archive/platforms/netlify/`: Functions da plataforma anterior.
- `archive/prototypes/frontend-v1/`: protótipo modular que não chegou à produção.
- `archive/public-assets/`: recursos antigos sem referências internas.
- `docs/archive/`: documentação substituída.
