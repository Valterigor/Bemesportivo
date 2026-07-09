# 📁 Estrutura do Projeto - Bem Esportivo

## Overview
Projeto organizado em módulos para máxima performance, manutenibilidade e escalabilidade.

```
meu-site/
├── src/                          # Código-fonte
│   ├── css/                      # Estilos organizados por módulo
│   │   ├── variables.css         # Design system (cores, tipografia, espaçamento)
│   │   ├── base.css              # Reset CSS e estilos globais
│   │   ├── layout.css            # Grid, flexbox e containers
│   │   ├── components.css        # Componentes reutilizáveis
│   │   ├── responsive.css        # Media queries e breakpoints
│   │   └── main.css              # Entry point (importa todos)
│   │
│   └── js/                       # JavaScript modularizado
│       ├── main.js               # Inicializador (entry point)
│       ├── utils/                # Funções utilitárias
│       │   └── dom.js            # Helpers de DOM
│       ├── components/           # Componentes reutilizáveis
│       │   ├── scroll-to-top.js   # Botão voltar ao topo
│       │   ├── read-more.js       # Expandir/compactar texto
│       │   ├── mobile-menu.js     # Menu responsivo
│       │   └── scroll-animations.js # Animações ao rolar
│       └── modules/              # Módulos funcionais
│           └── ai-agent.js       # Sistema de IA
│
├── public/                       # Arquivos públicos finais
│   └── pages/                    # Páginas HTML (será migradas)
│
├── assets/                       # Assets (imagens, áudio, vídeo)
│   ├── img/                      # Imagens otimizadas
│   └── audio/                    # Áudios
│
├── netlify/                      # Funções Netlify serverless
│   └── functions/
│
├── index.html                    # Páginas HTML (root)
├── coluna-valtinho.html
├── beplay.html
├── profissionais.html
├── produtos.html
├── Reportagens.html
├── sobre.html
├── contato.html
├── politica-de-privacidade.html
├── termos.html
│
└── package.json                  # Dependências e scripts

```

## 🎨 Sistema de Estilos CSS

### Arquitetura CSS 7-1
- **variables.css**: Design tokens (cores, espaçamento, tipografia)
- **base.css**: Reset, estilos base e tipografia
- **layout.css**: Grid, flexbox, containers, utilitários
- **components.css**: Botões, cards, badges, animações
- **responsive.css**: Media queries e mobile-first
- **main.css**: Entry point que importa todos

### Como Usar
```html
<!-- Apenas importe main.css, que importa todos os módulos -->
<link rel="stylesheet" href="src/css/main.css">
```

### Variáveis CSS Disponíveis
```css
/* Cores */
--color-primary: #fa8a01
--color-secondary: #1a1a1a
--bg-dark, --bg-soft, --bg-card
--text-primary, --text-secondary, --text-muted

/* Tipografia */
--font-family
--font-size-xs até --font-size-3xl
--font-weight-normal, --font-weight-medium, --font-weight-bold

/* Espaçamento */
--spacing-xs até --spacing-2xl

/* Utilidades */
--radius-sm, --radius-md, --radius-lg, --radius-full
--transition-fast, --transition-base, --transition-slow
--shadow-sm, --shadow-md, --shadow-lg
```

## 🚀 Sistema de JavaScript Modularizado

### Estrutura
Cada funcionalidade é um módulo independente:

```javascript
// Exemplo: Usar ScrollToTop
import ScrollToTop from './components/scroll-to-top.js';

// Inicializar
ScrollToTop.init();
```

### Módulos Disponíveis

#### Utils
- **dom.js**: Helpers de DOM (get, addClass, addClass, on, off, show, hide)

#### Components (Inicializar no main.js)
- **scroll-to-top.js**: Botão voltar ao topo automático
- **read-more.js**: Expandir/compactar conteúdo
- **mobile-menu.js**: Menu responsivo com toggle
- **scroll-animations.js**: Animações ao scroll (Intersection Observer)

#### Modules
- **ai-agent.js**: Sistema de dados e serviços de IA

### Como Usar
```javascript
// main.js inicializa tudo automaticamente
// Basta adicionar ao HTML:
<script type="module" src="src/js/main.js"></script>

// Para criar novo componente:
// 1. Crie arquivo em src/js/components/seu-componente.js
// 2. Exporte um objeto com método init()
// 3. Importe e inicialize em main.js
```

## 📱 Breakpoints Responsivos
```css
Mobile:   0px - 640px   (.site-mobile-only)
Tablet:   641px - 1024px (.site-tablet-only)
Desktop:  1025px+       (.site-desktop-only)
```

## 📦 Performance e Otimização

### CSS
- ✅ Modularizado para carregar apenas necessário
- ✅ Variáveis CSS para fácil manutenção
- ✅ Mobile-first (começa pequeno e cresce)
- ✅ Pronto para minificação

### JavaScript
- ✅ Modular para tree-shaking
- ✅ Lazy loading de componentes
- ✅ Event delegation para eficiência
- ✅ Intersection Observer para scroll animations
- ✅ Reduz memory footprint

### Imagens
- 📋 Sempre use `max-width: 100%`
- 📋 Imagens em pasta `assets/img/`
- 📋 Otimizar com ferramentas (ImageOptim, TinyPNG)

### Build/Minificação
```bash
npm run build    # Minificar CSS e JS
npm run watch    # Watch mode durante desenvolvimento
```

## 🔧 Como Manter a Organização

### Adicionar Nova Funcionalidade
1. Se é um componente visual (botão, card): Adicione em `src/css/components.css`
2. Se é um componente JavaScript reutilizável: Crie em `src/js/components/`
3. Se é uma função utilitária: Adicione em `src/js/utils/`
4. Se é um módulo funcional completo: Crie em `src/js/modules/`

### Naming Conventions
- **CSS**: `kebab-case` (`.scroll-to-top`)
- **JS**: `camelCase` (scrollToTop)
- **Classes úteis**: `.btn`, `.card`, `.badge`, `.flex`, etc

### Git Workflow
```bash
git status      # Verificar mudanças
git add .       # Adicionar tudo
git commit -m "Descrição clara"
git push        # Enviar para GitHub
```

## 📊 Benefícios da Nova Estrutura

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Tamanho CSS** | ~50KB (site-common.css) | ~15KB modularizado |
| **Tamanho JS** | Espalhado por páginas | ~10KB modularizado |
| **Manutenção** | Difícil encontrar código | Fácil localizar em módulos |
| **Reutilização** | Duplicado entre páginas | Único lugar, reusável |
| **Performance** | Carrega tudo | Carrega apenas necessário |
| **Escalabilidade** | Difícil adicionar features | Fácil com novos módulos |

## 🎯 Próximos Passos

1. ✅ Estrutura criada
2. ⏳ Migrar arquivos CSS/JS existentes para nova estrutura
3. ⏳ Atualizar HTML para importar novo main.css e main.js
4. ⏳ Adicionar scripts de build para minificação
5. ⏳ Otimizar imagens e assets
6. ⏳ Testar em todos os breakpoints

---

**Documentação atualizada em**: 2026-07-04
**Versão**: 1.0.0
**Status**: Em desenvolvimento
