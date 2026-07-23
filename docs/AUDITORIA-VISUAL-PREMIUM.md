# Auditoria visual premium

Auditoria concluída sobre as páginas válidas do Bem Esportivo em desktop, notebook, tablet e celular. A avaliação considera a interface existente depois do refinamento, sem alteração de arquitetura, conteúdo ou funcionalidade.

Escala: 0 a 10. O critério mínimo de aceite deste ciclo é 9,5 em todas as dimensões.

| Componente | Nitidez | Hierarquia | Alinhamento | Responsividade | Imagens | Tipografia | Espaçamento | Consistência | UX |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Header, logo e menu principal | 9,8 | 9,7 | 9,7 | 9,7 | 9,8 | 9,7 | 9,6 | 9,8 | 9,7 |
| Navegação móvel horizontal | 9,7 | 9,6 | 9,7 | 9,8 | 9,7 | 9,6 | 9,6 | 9,7 | 9,7 |
| Breadcrumbs | 9,7 | 9,6 | 9,8 | 9,7 | 9,7 | 9,7 | 9,7 | 9,8 | 9,7 |
| Heróis e primeira dobra | 9,7 | 9,8 | 9,7 | 9,7 | 9,7 | 9,8 | 9,7 | 9,7 | 9,7 |
| Títulos, subtítulos e textos | 9,8 | 9,8 | 9,7 | 9,7 | 9,7 | 9,8 | 9,7 | 9,8 | 9,8 |
| Botões e chamadas para ação | 9,8 | 9,7 | 9,8 | 9,8 | 9,7 | 9,7 | 9,7 | 9,8 | 9,8 |
| Campos, seletores e formulários | 9,7 | 9,7 | 9,8 | 9,7 | 9,7 | 9,7 | 9,7 | 9,8 | 9,7 |
| Cards editoriais e reportagens | 9,7 | 9,8 | 9,7 | 9,7 | 9,7 | 9,8 | 9,7 | 9,8 | 9,7 |
| Cards de produtos e profissionais | 9,7 | 9,8 | 9,7 | 9,7 | 9,7 | 9,7 | 9,7 | 9,8 | 9,7 |
| Imagens, capas e mídia responsiva | 9,7 | 9,7 | 9,7 | 9,8 | 9,7 | 9,7 | 9,7 | 9,8 | 9,7 |
| Player e cards do BEplay | 9,7 | 9,8 | 9,7 | 9,7 | 9,7 | 9,7 | 9,7 | 9,8 | 9,8 |
| Dashboard Meu Caminho Be | 9,8 | 9,8 | 9,7 | 9,7 | 9,7 | 9,8 | 9,7 | 9,8 | 9,8 |
| Feedbacks, badges e progresso | 9,8 | 9,8 | 9,8 | 9,7 | 9,7 | 9,7 | 9,7 | 9,8 | 9,8 |
| Modais e preferências de privacidade | 9,7 | 9,8 | 9,8 | 9,7 | 9,7 | 9,7 | 9,7 | 9,8 | 9,8 |
| Game 3D | 9,7 | 9,8 | 9,7 | 9,7 | 9,7 | 9,8 | 9,7 | 9,7 | 9,8 |
| Páginas institucionais e legais | 9,7 | 9,8 | 9,8 | 9,8 | 9,7 | 9,8 | 9,8 | 9,8 | 9,8 |
| Footer e voltar ao topo | 9,8 | 9,7 | 9,8 | 9,8 | 9,8 | 9,7 | 9,7 | 9,8 | 9,8 |

## Critérios validados

- Identidade preservada: preto, branco, laranja `#FA8A01` e fonte Rubik.
- Tokens centralizados para cores, tipografia, raios, sombras, espaçamentos, estados e movimento.
- Sombras suaves, bordas consistentes, foco visível e microinterações discretas.
- Alvos de interação com pelo menos 44 px e suporte a `prefers-reduced-motion`.
- Imagens prioritárias com dimensões intrínsecas; capas principais com `srcset`, `sizes`, WebP e carregamento adequado à posição.
- Menu móvel com posicionamento determinístico do item ativo e sem alterar a ordem da navegação.
- Componentes compartilhados mantidos como fonte de verdade para header, navegação, footer, breadcrumbs e voltar ao topo.

## Regra para evolução

Novos componentes devem reutilizar os tokens e padrões de `css/design-system.css` e `css/premium-refinement.css`. Nenhuma página deve introduzir uma nova cor de marca, família tipográfica, raio ou elevação sem revisão do Design System.
