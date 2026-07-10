# Estrutura do Projeto - Bem Esportivo

Este projeto usa HTML estatico na raiz, com CSS e JavaScript separados por pagina.

## Pastas principais

```text
meu-site/
├── index.html
├── Reportagens.html
├── beplay.html
├── coluna-valtinho.html
├── produtos.html
├── profissionais.html
├── sobre.html
├── contato.html
├── politica-de-privacidade.html
├── termos.html
├── site-common.css
├── style.css
├── css/
├── js/
├── img/
├── netlify/
├── dev-server.js
└── package.json
```

## CSS

`site-common.css` concentra regras compartilhadas:

- menu e navegacao comum;
- rodape;
- ajustes mobile;
- acessibilidade;
- protecoes contra overflow e sobreposicao.

Arquivos em `css/` concentram estilos especificos:

- `css/index.css`
- `css/reportagens-base.css`
- `css/reportagens.css`
- `css/beplay-base.css`
- `css/beplay.css`
- `css/coluna-valtinho.css`
- `css/produtos.css`
- `css/profissionais.css`

Regra de manutencao: estilos globais ficam em `site-common.css`; estilos que so existem em uma pagina ficam no CSS especifico dela.

## JavaScript

`js/site-common.js` concentra comportamento compartilhado:

- menu mobile;
- link ativo;
- botao voltar ao topo quando existir.

Scripts especificos:

- `js/index.js`
- `js/reportagens.js`
- `js/beplay.js`
- `js/coluna-valtinho.js`
- `js/produtos.js`
- `js/profissionais.js`

Regra de manutencao: comportamento reutilizavel entra em `js/site-common.js`; comportamento de uma pagina fica no script especifico.

## BEplay

O BEplay usa:

- player principal com YouTube embed sob demanda;
- playlist com busca e filtros;
- comentarios locais;
- nome salvo do visitante;
- historico local de videos assistidos;
- salvar video e inscricao local;
- integracao com `/api/community` quando disponivel.

## Teste local

```bash
npm run check
npm run dev
```

Rotas principais para conferir:

- `/`
- `/reportagens`
- `/beplay`
- `/coluna-valtinho`
- `/produtos`
- `/profissionais`
- `/sobre`
- `/contato`

## Checklist antes de subir

```bash
npm run check
node --check js/site-common.js
git diff --check
git status --short
```

Tambem confira no navegador:

- menu em desktop e celular;
- imagens de destaque;
- formularios;
- BEplay em largura mobile;
- rodape;
- links principais.

## Git

```bash
git status
git add .
git commit -m "Mensagem objetiva"
git push
```

Atualizado em 2026-07-09.
