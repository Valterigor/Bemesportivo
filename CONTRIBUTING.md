# Contribuindo

## Regras

- Use nomes `kebab-case` para arquivos públicos e URLs.
- Mantenha um único propósito por commit.
- Não inclua segredos, dados pessoais, logs, builds ou mídia bruta.
- Preserve URLs públicas e contratos de API.
- Adicione ou atualize testes para mudanças de comportamento.

## Validação obrigatória

```bash
npm ci
npm run verify:full
git diff --check
git status --short
```

## Segurança

Relate vulnerabilidades de forma privada para `bemesportivo@yahoo.com`. Não abra uma issue pública com credenciais, dados pessoais ou instruções de exploração contra o site em produção.
