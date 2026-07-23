# Design system

O ponto de entrada oficial é `css/design-system.css`. Os nomes públicos usam o prefixo `be-`; tokens usam `--be-ds-` para não colidir com estilos legados.

## Fundamentos

- Cores: `primary`, `secondary`, `background`, três superfícies e estados `success`, `warning`, `danger` e `info`.
- Tipografia: Rubik em toda a experiência, variando peso, tamanho e altura de linha para criar hierarquia, sempre com fallback de sistema.
- Espaçamento: escala de 4 px (`--be-ds-space-1` a `--be-ds-space-16`).
- Bordas: cinco raios, de `xs` a `xl`, e formato pill.
- Elevação: `--be-ds-elevation-0` a `--be-ds-elevation-3`. Use a menor elevação capaz de comunicar a hierarquia.
- Movimento: 160 ms para resposta, 240 ms para transições e 420 ms para entradas; respeita `prefers-reduced-motion`.
- Dados: cinco cores de gráfico. Cor nunca deve ser o único meio de comunicar um valor.
- Conteúdo: largura geral de 1180 px e leitura de 760 px.

## Componentes públicos

- `.be-button`, `.be-button--secondary`, `.be-button--ghost`, `.be-button--danger`
- `.be-card`, `.be-card__body`, `.be-card__title`, com elevações `--flat`, `--raised` e `--floating`
- `.be-input`
- `.be-badge`, `.be-tag` e variações semânticas
- `.be-progress`, controlado por `--be-progress-value`
- `.be-timeline`
- `.be-modal`, `.be-modal__body`
- `.be-icon`
- `.be-state-message`, com variações `--success`, `--warning`, `--error` e `--info`
- `.be-container`, `.be-reading-container`, `.be-section`, `.be-title`

Estados de foco devem continuar visíveis. Alvos de ação têm no mínimo 44 px. Ícones decorativos usam `aria-hidden="true"`; ícones que representam uma ação precisam de nome acessível no botão ou link.

## Feedback de produto

Todo feedback deve responder, de forma curta, a pelo menos uma pergunta: o que aconteceu, o que mudou ou qual é o próximo passo.

- `success`: confirmação de uma ação concluída.
- `progress`: XP, nível, sequência ou meta atualizada.
- `warning`: atenção necessária sem bloquear a pessoa.
- `danger`: erro ou ação que não pôde ser concluída.
- `info`: orientação neutra ou lembrete.

Recompensas só aparecem quando houve mudança real. Atualizar o mesmo registro não concede XP novamente. Mensagens transitórias usam `role="status"` e `aria-live="polite"`; erros que exigem correção permanecem próximos ao campo correspondente.

## Critério de adoção

Antes de criar uma nova cor, sombra, raio, botão ou card, verifique se um token ou componente público atende ao caso. Estilos específicos de página podem compor componentes, mas não devem redefinir o significado de `primary`, `success`, `warning` ou `danger`.

## Responsividade

O padrão é mobile-first e orientado pelo conteúdo. Use 640 px apenas para ajustes compactos, 768 px para mudanças de composição e 1024 px para layouts amplos. Não crie um breakpoint para corrigir um único aparelho; corrija o comportamento fluido do componente.
