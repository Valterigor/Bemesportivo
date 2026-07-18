# Estrutura operacional do Bem Esportivo

O site é entregue estaticamente a partir da raiz. A arquitetura oficial e as regras de dependência estão em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Camadas

- `site-common.css`: compatibilidade e composição visual compartilhada atual.
- `css/design-system.css`: tokens, primitivas e componentes oficiais para evolução.
- `js/site-common.js`: entrada modular de navegação, breadcrumb, rodapé e voltar ao topo.
- CSS e JavaScript com nome de página: comportamento exclusivo daquela experiência.
- `netlify/functions/`: comunidade e demais serviços persistentes.

O diretório `src/` é um protótipo descontinuado e não deve receber código novo.

## Rotina local

```bash
npm run dev
npm run check
npm run build
```

Antes de publicar, rode:

```bash
npm run verify
git diff --check
git status --short
```

Além da verificação automática, confira no navegador a Home, Reportagens, uma reportagem, BEplay, Meu Caminho Be e Game em largura desktop e mobile.

## Documentos relacionados

- [Design system](docs/DESIGN-SYSTEM.md)
- [Convenções](docs/CONVENTIONS.md)
- [URLs e arquitetura da informação](docs/URLS.md)
- [Estratégia de migração](MIGRACAO.md)
