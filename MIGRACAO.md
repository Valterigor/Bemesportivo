# Migração técnica

O antigo plano de trocar todas as páginas por `src/css/main.css` e `src/js/main.js` foi descontinuado porque esses arquivos não representam o site atualmente publicado.

A evolução agora é incremental:

1. novos estilos usam `css/design-system.css` e seus tokens;
2. componentes compartilhados ficam em `css/components/` e `js/components/`;
3. cada página mantém seus estilos e scripts enquanto é migrada com validação visual;
4. nenhuma URL ou experiência existente muda apenas por reorganização técnica;
5. `src/` não recebe novas dependências e só será removido após auditoria específica.

Consulte [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para a estrutura oficial.
