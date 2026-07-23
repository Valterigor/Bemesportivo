# Arquitetura técnica

O Bem Esportivo continua sendo publicado como site estático a partir da raiz. Esta é uma decisão consciente: preserva as URLs, o SEO e o deploy atual enquanto a base é organizada de forma incremental.

## Estrutura oficial

```text
/
├── *.html                 # entradas e páginas públicas
├── css/
│   ├── core/              # tokens e primitivas globais
│   ├── components/        # componentes visuais reutilizáveis
│   └── *.css              # estilos específicos de páginas/produtos
├── js/
│   ├── core/              # dados, rotas e utilitários sem interface
│   ├── components/        # comportamentos reutilizáveis
│   └── *.js               # entradas compartilhadas e scripts de páginas
├── img/ e videos/         # mídia publicada
├── netlify/functions/     # APIs e persistência no servidor
├── scripts/               # qualidade, build e manutenção
├── docs/                  # decisões e padrões técnicos
├── _redirects             # URLs públicas e rotas de API
├── _headers               # cache e cabeçalhos de segurança
└── sw.js                  # cache offline controlado
```

## Direção das dependências

Uma página pode depender de componentes, e componentes podem depender do núcleo. O núcleo nunca depende de uma página.

```text
página → componente → core
```

`js/site-common.js` é a entrada da camada compartilhada. Navegação, breadcrumb, rodapé e botão de voltar ao topo vivem em módulos separados. `site-common.css` preserva a compatibilidade visual atual e importa `css/design-system.css`, a entrada estável do design system.

## Componentes compartilhados

- Navegação principal: `js/components/site-navigation.js`
- Breadcrumb e Schema.org: `js/components/site-breadcrumb.js`
- Rodapé: `js/components/site-footer.js`
- Voltar ao topo: `js/components/back-to-top.js`
- Botões, cards, modais e estados: `css/components/ui.css`

## Migração segura

O diretório `src/` é um protótipo antigo e não participa do site publicado. Não devem ser criadas novas dependências nele. Sua remoção ou migração completa será feita em uma tarefa separada, depois de comparar cada recurso com as páginas reais.

A Home, o Meu Caminho Be e o Game podem ter shells visuais próprios. Eles devem reutilizar tokens, acessibilidade e padrões de interação, sem perder sua identidade ou mecânica específica.

## Evolução do Meu Caminho Be

A transição do produto local para uma aplicação autenticada, sincronizada e preparada para inteligência está definida em [Meu Caminho Be 2.0](MEU-CAMINHO-BE-2.0.md). A implementação deve respeitar as fases, manter separados os dados privados e comunitários e preservar a experiência atual até cada substituição estar validada.
