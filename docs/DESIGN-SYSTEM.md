# Design system

O ponto de entrada oficial é `css/design-system.css`. Os nomes públicos usam o prefixo `be-`; tokens usam `--be-ds-` para não colidir com estilos legados.

## Fundamentos

- Cores: marca laranja, superfícies claras, texto com contraste e estados semânticos.
- Tipografia: Rubik para destaque e Inter para leitura, sempre com fallback de sistema.
- Espaçamento: escala de 4 px (`--be-ds-space-1` a `--be-ds-space-16`).
- Bordas: três raios e formato pill.
- Movimento: 160 ms para resposta e 240 ms para transições; respeita `prefers-reduced-motion`.
- Conteúdo: largura geral de 1180 px e leitura de 760 px.

## Componentes públicos

- `.be-button`, `.be-button--secondary`, `.be-button--ghost`
- `.be-card`, `.be-card__body`, `.be-card__title`
- `.be-modal`, `.be-modal__body`
- `.be-icon`
- `.be-state-message`, com variações `--success` e `--error`
- `.be-container`, `.be-reading-container`, `.be-section`, `.be-title`

Estados de foco devem continuar visíveis. Alvos de ação têm no mínimo 44 px. Ícones decorativos usam `aria-hidden="true"`; ícones que representam uma ação precisam de nome acessível no botão ou link.

## Responsividade

O padrão é mobile-first e orientado pelo conteúdo. Use 640 px apenas para ajustes compactos, 768 px para mudanças de composição e 1024 px para layouts amplos. Não crie um breakpoint para corrigir um único aparelho; corrija o comportamento fluido do componente.
