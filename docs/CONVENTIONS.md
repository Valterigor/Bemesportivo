# Convenções de desenvolvimento

## Nomes

- Arquivos e URLs: `kebab-case`.
- Classes compartilhadas: prefixo `be-` e estrutura de componente (`be-card__title`, `be-button--secondary`).
- Classes exclusivas de página: prefixo do produto ou da página.
- JavaScript: `camelCase` para funções/variáveis e `PascalCase` para classes.
- IDs e atributos `data-*`: `kebab-case`.

## CSS

Novos valores globais entram em `css/core/tokens.css`. Componentes reutilizáveis entram em `css/components/`; regras exclusivas permanecem no CSS da página. Evite novos estilos inline e `!important`. O legado será reduzido por componente, nunca por uma reescrita simultânea.

## JavaScript

Use módulos ES para código compartilhado. Entradas de página podem permanecer clássicas enquanto forem independentes. Evite estado global; prefira funções `init...` idempotentes e atributos `data-*` para impedir eventos duplicados.

## HTML e acessibilidade

Use elementos semânticos, um único `h1`, labels associados, nomes acessíveis e ordem de foco coerente. Componentes dinâmicos devem funcionar por teclado. Toda página inclui `lang="pt-BR"` e viewport.

## Cache e entrega

Ao alterar um arquivo de entrada já publicado, incremente sua query `?v=` nas páginas e no service worker. Módulos importados usam o cache de rede prioritária do service worker. Rode `npm run verify` antes de publicar.
