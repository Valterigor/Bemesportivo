# Desenvolvimento local

## Ambiente

- Node.js: versão registrada em `.nvmrc`.
- Instalação reproduzível: `npm ci`.
- Porta padrão: `3100`; use `PORT` para alterar.

## Servidor

```bash
npm run dev
```

O servidor em `scripts/dev-server.js` entrega as páginas da raiz e implementa substitutos locais das APIs necessárias aos testes.

## Build

```bash
npm run build
```

O build empacota as fontes em `src/apps/`, valida o código e recria `dist/`. Nunca copie manualmente arquivos para `dist/`.

## Testes

- `npm test`: integração, APIs, segurança, privacidade e contratos HTML.
- `npm run test:e2e`: fluxos no Chromium.
- `npm run verify:full`: sequência obrigatória antes de publicar.

## Dados locais

Use `.env.local` para valores locais e `.local-reference/` para mídia bruta. Ambos são ignorados. Segredos de produção devem ser configurados diretamente no provedor.
