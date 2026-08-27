# Arquitetura técnica

## Visão geral

O Bem Esportivo usa uma arquitetura estática com backend serverless:

```text
navegador
  ├── páginas, CSS, JavaScript e mídia em dist/
  ├── /api/* → Cloudflare Pages Functions
  └── continuidade opcional → cópia criptografada no Cloudflare

Cloudflare Worker agendado → notificações e rotinas
```

O Cloudflare Pages executa `npm run build` e publica `dist/`. As Pages Functions são compiladas a partir de `functions/` e usam módulos compartilhados de `server/`.

## Camadas

### Interface pública

- `*.html`: entradas públicas, metadados, conteúdo e URLs canônicas.
- `css/`: tokens, componentes e estilos por experiência.
- `js/`: módulos e bundles entregues ao navegador.
- `img/` e `videos/`: somente mídia final utilizada pelo site.

### Fontes de aplicação

`src/apps/` contém código editável que precisa ser empacotado. O build atual gera:

- `src/apps/meu-caminho/account.js` → `js/meu-caminho-account.js`
- `js/meu-caminho-navigation.js`: regras de sequencia, bloqueios orientativos e destinos do Meu Caminho Be.
- `css/meu-caminho-navigation.css`: layout canonico do menu lateral, barra movel e divulgacao progressiva do Perfil.

Os arquivos gerados em `js/` não devem ser editados manualmente.

### Perfil Be

A separação entre jornada privada, identidade esportiva, publicações, evolução e conquistas está documentada em `docs/PERFIL-BE.md`.

### Backend

- `functions/api/`: endpoints HTTP do Cloudflare Pages.
- `functions/_middleware.js`: headers comuns de segurança.
- `server/`: regras reutilizadas por Functions e pelo servidor local.
- `workers/`: tarefas agendadas independentes do deploy das páginas.
- `supabase/migrations/`: esquema, permissões e RLS versionados.

### Operação

- `scripts/build.js`: gera o artefato público reproduzível.
- `scripts/dev-server.js`: simula páginas e APIs localmente.
- `scripts/quality-check.js`: valida JavaScript, CSS e HTML.
- `scripts/structure-check.js`: impede resíduos e mídia bruta no espaço público.
- `tests/`: valida comportamento sem misturar testes com ferramentas.

## Direção das dependências

```text
página → componente → núcleo
Function → regra em server/ → armazenamento externo
scripts/ e tests/ → código de produção
```

Código de produção nunca depende de `tests/`, `archive/`, `.local-reference/` ou `dist/`.

## Dados e confiança

- Dados privados do Meu Caminho usam Supabase e RLS por `user_id`.
- Segredos existem somente no ambiente do Cloudflare ou Supabase.
- A chave pública do Supabase pode ser entregue ao navegador; a chave administrativa nunca pode ser exposta.
- Escritas sensíveis exigem autenticação, origem válida e validação de entrada.

## Compatibilidade

As URLs públicas são controladas por `_redirects`, e os headers por `_headers`. Mover arquivos-fonte não autoriza alterar URLs canônicas. Código Netlify e protótipos antigos permanecem em `archive/` apenas para consulta histórica e não participam do build.
