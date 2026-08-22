# Bem Esportivo

Plataforma editorial e esportiva publicada no Cloudflare Pages, com páginas estáticas, APIs em Pages Functions, autenticação Supabase e tarefas agendadas em Cloudflare Workers.

## Começar

Requisitos: Node.js 20.18 ou superior, dentro da linha 20–22, e npm.

```bash
npm ci
npm run dev
```

O servidor local fica disponível em `http://localhost:3100`.

## Comandos principais

```bash
npm run check        # qualidade de código e estrutura
npm run build        # gera dist/
npm test             # testes de integração
npm run test:e2e     # fluxos reais no navegador
npm run verify:full  # validação completa
```

## Estrutura

```text
├── *.html                  páginas públicas e URLs canônicas
├── css/ e js/              arquivos entregues ao navegador
├── img/ e videos/          mídia publicada e referenciada
├── src/apps/               fontes editáveis que geram bundles em js/
├── functions/              APIs do Cloudflare Pages
├── server/                 regras compartilhadas pelo backend
├── workers/                tarefas agendadas e suas configurações
├── supabase/               configuração e migrações do banco
├── scripts/                build, servidor local e manutenção
├── tests/                  testes de integração e navegador
├── docs/                   arquitetura, operação, segurança e produto
├── archive/                código histórico fora do build
└── .local-reference/       mídia bruta e referências locais ignoradas
```

As páginas permanecem na raiz para preservar URLs, SEO e edição direta. O build entrega somente a seleção pública em `dist/`.

## Fluxo de contribuição

1. Trabalhe em uma alteração de escopo único.
2. Não coloque segredos, logs ou mídia bruta no repositório.
3. Execute `npm run verify:full`.
4. Revise `git diff --check` e `git status --short`.
5. Só publique após aprovação explícita.

Consulte [estrutura do projeto](docs/PROJECT-STRUCTURE.md), [arquitetura](docs/ARCHITECTURE.md), [desenvolvimento](docs/DEVELOPMENT.md), [publicação](docs/DEPLOYMENT.md), [contribuição](CONTRIBUTING.md) e [segurança](SECURITY.md).
