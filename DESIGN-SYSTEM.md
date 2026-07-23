# Design System BeM

Fonte oficial para decisões de interface do BeMEsportivo.

## Estrutura

- `css/core/tokens.css`: cores, tipografia, espaçamento, bordas, elevação e movimento.
- `css/core/primitives.css`: reset seguro, containers, títulos e utilitários de composição.
- `css/components/ui.css`: componentes reutilizáveis e seus estados.
- `css/design-system.css`: ponto único de entrada do sistema.
- `design-system.html`: catálogo visual e exemplos de uso.

## Princípios

1. Clareza antes de decoração.
2. Uma ação primária por contexto.
3. Inter em toda a interface.
4. Grid de espaçamento baseado em 4 px.
5. Controles com no mínimo 44 px; padrão de 50 px.
6. Raio padrão de 12 px para controles.
7. Elevação apenas quando comunica hierarquia ou interação.
8. Ícones SVG de 20 px e traço de 1,8 px.
9. Movimento entre 160 e 240 ms, respeitando `prefers-reduced-motion`.
10. Contraste e foco visível são obrigatórios.

## Botões

```html
<button class="be-button" type="button">Continuar</button>
<button class="be-button be-button--outline" type="button">Ver detalhes</button>
<button class="be-button be-button--ghost" type="button">Cancelar</button>
<button class="be-button be-button--success" type="button">Concluir</button>
<button class="be-button be-button--danger" type="button">Excluir</button>
```

O fundo primário permanece `#FF7A00`. O texto é escuro porque branco sobre esse laranja não atinge o contraste mínimo WCAG.

## Campos

```html
<label class="be-field">
  <span class="be-field__label">Objetivo</span>
  <input class="be-input" type="text">
  <small class="be-field__help">Explique o que deseja alcançar.</small>
</label>
```

Erros devem usar `aria-invalid="true"`, uma mensagem próxima ao campo e `aria-describedby`.

## Cards

```html
<article class="be-card be-card--interactive">
  <div class="be-card__body">
    <span class="be-badge be-badge--brand">Meu Hoje</span>
    <h2 class="be-card__title">Registre seu dia</h2>
    <p>Texto curto e orientado à ação.</p>
  </div>
</article>
```

Use `be-card--flat` para agrupamento, `be-card--interactive` quando o card reage ao usuário e `be-card--raised` somente para maior hierarquia.

## Convenções

- Componentes oficiais usam prefixo `be-`.
- Elementos internos usam BEM: `be-card__body`.
- Variações usam modificadores: `be-button--outline`.
- Estados funcionais usam atributos nativos ou ARIA antes de classes: `disabled`, `aria-invalid`, `aria-current`.
- Cores e dimensões não devem ser repetidas no componente; use tokens `--be-ds-*`.

## Migração

As páginas atuais recebem adaptadores em `css/premium-refinement.css`. Novo código deve usar diretamente os componentes `be-*`. Componentes legados devem ser migrados quando forem editados por necessidade real, evitando uma reescrita arriscada de toda a plataforma.

## Checklist para novos componentes

- Possui estados normal, hover, foco, pressionado e desabilitado?
- Funciona com teclado?
- Tem nome acessível?
- Mantém área de toque adequada?
- Respeita a escala de espaçamento?
- Usa somente tokens oficiais?
- Funciona em 320 px sem rolagem horizontal da página?
- Respeita redução de movimento?
