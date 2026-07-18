# URLs e arquitetura da informação

## Estrutura pública

```text
/
├── meu-caminho-be
├── reportagens
│   ├── treino-funcional-br-assessoria
│   ├── duda-e-o-futebol
│   └── dedicacao-e-talento-mirim
├── beplay
├── profissionais
├── produtos
├── sobre
├── contato
├── politica-de-valores
├── politica-de-privacidade
└── termos
```

O Game permanece temporariamente em `/game.html` para preservar integrações existentes. Modalidades futuras devem usar `/modalidades/{slug}`, por exemplo `/modalidades/futebol` e `/modalidades/corrida`, somente quando houver conteúdo próprio suficiente.

## Regras

- URL canônica pública sem `.html`, exceto legados documentados.
- Slugs minúsculos, sem acentos e com hífen.
- Uma intenção de busca por página; não criar páginas vazias apenas para ocupar uma URL.
- Toda nova rota deve atualizar `_redirects`, canonical, OpenGraph, sitemap e navegação quando aplicável.
- Redirecionamentos permanentes existem para migração, nunca como navegação interna padrão.
