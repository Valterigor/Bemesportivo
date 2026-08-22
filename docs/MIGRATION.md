# Estratégia de migração

O projeto evolui de forma incremental, preservando URLs, SEO e comportamento validado.

## Diretrizes

1. Novos estilos globais usam `css/design-system.css` e seus tokens.
2. Componentes compartilhados ficam em `css/components/` e `js/components/`.
3. Fontes que exigem bundle ficam em `src/apps/`; o resultado gerado fica em `js/`.
4. Páginas mantêm estilos próprios enquanto são migradas com validação visual.
5. Código substituído vai para `archive/` somente quando não possui consumidores ativos.
6. Nenhuma URL ou experiência muda apenas por reorganização técnica.

O protótipo antigo de `src/css` e `src/js/main.js` foi preservado em `archive/prototypes/frontend-v1/`. Ele não representa a arquitetura atual.
