# 🔄 Guia de Migração - HTML para Nova Estrutura

## Passo a Passo

### 1. Adicionar ao `<head>` do HTML

Remova os links antigos de CSS:
```html
<!-- ❌ REMOVER -->
<link rel="stylesheet" href="site-common.css">
<link rel="stylesheet" href="style.css">
```

Adicione o novo main.css:
```html
<!-- ✅ ADICIONAR -->
<link rel="stylesheet" href="src/css/main.css">
```

### 2. Adicionar ao final do `<body>`

Remova os scripts antigos:
```html
<!-- ❌ REMOVER -->
<script src="script.js"></script>
<script src="ai-agent-data.js"></script>
```

Adicione o novo main.js:
```html
<!-- ✅ ADICIONAR -->
<script type="module" src="src/js/main.js"></script>
```

### 3. Estrutura HTML Mínima

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem Esportivo</title>
  
  <!-- Novo CSS unificado -->
  <link rel="stylesheet" href="src/css/main.css">
</head>
<body>
  <!-- HTML do site -->
  
  <!-- Scripts otimizados -->
  <script type="module" src="src/js/main.js"></script>
</body>
</html>
```

### 4. Usar Classes CSS Utilitárias

Substitua estilos inline por classes reutilizáveis:

```html
<!-- ❌ ANTES -->
<div style="display: flex; gap: 20px; margin: 20px 0;">

<!-- ✅ DEPOIS -->
<div class="flex gap-lg m-lg">
```

### Classe Utilities Disponíveis

#### Display & Layout
- `.flex`, `.flex-center`, `.flex-between`, `.flex-col`, `.flex-wrap`
- `.grid`, `.grid-cols-2`, `.grid-cols-3`, `.grid-cols-4`
- `.container`, `.container-sm`, `.container-lg`

#### Espaçamento
- Padding: `.p-xs`, `.p-sm`, `.p-md`, `.p-lg`, `.p-xl`, `.p-2xl`
- Margin: `.m-xs`, `.m-sm`, `.m-md`, `.m-lg`, `.m-xl`, `.m-2xl`
- Gap: `.gap-sm`, `.gap-md`, `.gap-lg`, `.gap-xl`

#### Componentes
- Botões: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-sm`, `.btn-lg`
- Cards: `.card`
- Badges: `.badge`, `.badge-secondary`
- Tags: `.tag`
- Alertas: `.alert`, `.alert-info`

#### Utilidades
- `.hidden`, `.visible`
- `.truncate`, `.line-clamp-2`, `.line-clamp-3`
- `.site-mobile-only`, `.site-tablet-only`, `.site-desktop-only`

### 5. Exemplo Completo de Migração

**Antes:**
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="site-common.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <nav>
      <a href="#">Home</a>
      <a href="#">Sobre</a>
    </nav>
  </header>

  <button id="voltar-topo">Voltar</button>
  
  <script src="script.js"></script>
  <script src="ai-agent-data.js"></script>
</body>
</html>
```

**Depois:**
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem Esportivo</title>
  
  <!-- Único CSS consolidado -->
  <link rel="stylesheet" href="src/css/main.css">
</head>
<body>
  <header>
    <nav>
      <a href="#">Home</a>
      <a href="#">Sobre</a>
    </nav>
  </header>

  <!-- Botão voltar ao topo (estilo + funcionalidade automática) -->
  <button id="voltar-topo">↑</button>
  
  <!-- Único JavaScript modularizado -->
  <script type="module" src="src/js/main.js"></script>
</body>
</html>
```

## 6. Funcionalidades que Funcionam Automaticamente

Depois de adicionar `src/js/main.js`, essas funcionalidades funcionam sem configuração:

✅ **Botão Voltar ao Topo**
```html
<button id="voltar-topo">Voltar ao Topo</button>
<!-- Precisa ter id="voltar-topo" -->
```

✅ **Menu Responsivo**
```html
<button id="menu-toggle">☰</button>
<nav>...</nav>
<!-- Precisa ter id="menu-toggle" e id="menu-toggle" clica em nav -->
```

✅ **Leia Mais / Leia Menos**
```html
<div class="texto-expandido">Seu texto aqui...</div>
<button class="leia-mais">Leia mais</button>
<!-- Classe .leia-mais ativa a funcionalidade -->
```

✅ **Animações ao Scroll**
```html
<div class="animate-on-scroll">Conteúdo animado</div>
<!-- Usa Intersection Observer para otimizar -->
```

## 7. Verificação de Elementos Necessários

Certifique-se que seu HTML tem esses elementos:

```html
<!-- Para botão voltar ao topo funcionar -->
<button id="voltar-topo"></button>

<!-- Para menu responsivo funcionar -->
<button id="menu-toggle"></button>
<nav>
  <a href="#">Link 1</a>
  <a href="#">Link 2</a>
</nav>

<!-- Para leia mais funcionar -->
<div class="texto-expandido">Texto longo...</div>
<button class="leia-mais">Leia mais</button>

<!-- Para animações ao scroll -->
<div class="animate-on-scroll">Será animado</div>
```

## 8. Build/Minificação

Quando pronto para produção:
```bash
npm install    # Instalar dependências (primeira vez)
npm run build  # Minificar CSS e JS
```

Após build, usar versão minificada:
```html
<link rel="stylesheet" href="dist/main.min.css">
<script type="module" src="dist/main.min.js"></script>
```

## 📋 Checklist de Migração

- [ ] Remover links antigos de CSS (site-common.css, style.css)
- [ ] Adicionar link para src/css/main.css
- [ ] Remover scripts antigos (script.js, ai-agent-data.js)
- [ ] Adicionar script type="module" src="src/js/main.js"
- [ ] Verificar que elementos com IDs estão presentes (#voltar-topo, #menu-toggle)
- [ ] Testar em mobile, tablet e desktop
- [ ] Testar scroll, menu, leia mais
- [ ] Fazer commit no git

## ✅ Próximas Páginas para Migrar

Priorize nesta ordem:
1. `index.html` (principal)
2. `beplay.html`
3. `meu-caminho-be.html`
4. `profissionais.html`
5. ... outras páginas

---

**Última atualização**: 2026-07-04
