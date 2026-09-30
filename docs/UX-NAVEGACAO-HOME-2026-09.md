# Home e navegação: revisão de UX

Revisão de 29/09/2026, aplicada à prévia local a pedido do responsável pelo site.

## Base da análise

Leitura do HTML e dos caminhos reais da home, Reportagens, BePlay, Fala Bem!, Radar SP, Conhecimento, Ferramentas, Profissionais, Meu Caminho Be, Moda Fitness e Produtos. Também foram consultados o posicionamento em Sobre e a documentação de ecossistema e voz.

É uma avaliação heurística do conteúdo e da interface. Não houve pesquisa com visitantes, análise de cliques ou experimento de conversão; a ordem é uma hipótese fundamentada, não uma melhora de conversão comprovada.

## Diagnóstico

O Bem Esportivo é uma entrada pública para histórias, conhecimento e prática esportiva. O diário é um dos destinos, e não a própria home. O feed aprovado traduz bem a proposta, mas a ordem anterior intercalava conteúdo, catálogo, serviço e experiência pessoal sem explicar as funções.

| Área | Necessidade atendida | Decisão aplicada |
| --- | --- | --- |
| Busca Be | Encontrar algo com uma intenção já definida | Primeiro conteúdo da home, com campo acessível e resultados sob demanda |
| Reportagens | Conhecer histórias e pessoas | Primeiro post, respeitando o destaque já publicado |
| BePlay | Assistir | Segundo post e acesso principal próprio |
| Fala Bem! | Ler opinião | Terceiro post; identificado como opinião, sem prometer conversa ao vivo |
| Radar SP | Encontrar onde praticar | Primeiro destino prático, com limite geográfico explícito |
| Conhecimento | Aprender como começar | Logo após o Radar; acesso descritivo na navegação |
| Ferramentas | Consultar referências de prática | Atalho circular, grupo de prática no menu e bloco dedicado com links diretos |
| Profissionais | Encontrar apoio humano | Após os caminhos de descoberta e aprendizagem |
| Meu Caminho Be | Registrar e acompanhar a própria jornada | Post descritivo e acesso direto permanente no cabeçalho para retornos |
| Moda Fitness | Explorar estilo e catálogo | Depois dos caminhos de prática, com filtro próprio “Estilo” |
| Produtos, Game 3D e Criar postagem | Recursos complementares | Grupo “Estilo e recursos”, sem competir com a busca e o conteúdo principal |
| Reportagem de arquivo | Continuar a leitura do acervo | Final do feed inicial, com indicação de arquivo |
| Sobre, contato e políticas | Entender o site e falar com a equipe | Rodapé e acessos institucionais no menu expandido |

## Sequência da home

1. Cabeçalho comum e acesso direto ao Meu Caminho Be.
2. Pergunta de entrada, explicação breve e Busca Be.
3. Atalhos circulares: Reportagens → BePlay → Fala Bem! → Radar SP → Conhecimento → Ferramentas → Profissionais → Meu Caminho Be → Moda Fitness. Cada atalho explica a função em uma linha curta.
4. Feed: Reportagens → BePlay → Fala Bem! → Radar SP → Conhecimento → Profissionais → Meu Caminho Be → Moda Fitness → reportagem de arquivo.
5. Ferramentas com acesso direto a IMC, pace e água diária.
6. Rodapé com exploração, contato, transparência e políticas.

Os nove posts continuam em três colunas no desktop, duas no tablet e uma no celular. Não foram adicionados botões sociais nem substituídas as capas aprovadas.

## Modelo visual comum, navegação contextual

O cabeçalho mantém o design da home: logo original, fundo preto, textos discretos, linha laranja na seção atual e a mesma geometria entre páginas. O pedido final é compartilhar o design e o layout, **sem copiar os itens da home nas outras áreas**. Na home, a navegação segue **Início → Reportagens → BePlay → Fala Bem! → Explorar**, com **Meu Caminho Be** como acesso direto separado visualmente.

Somente na home, “Explorar” apresenta grupos com títulos e explicações:

- **Praticar e aprender:** Radar SP, Conhecimento, Ferramentas, Profissionais.
- **Sua jornada:** Meu Caminho Be, Meu perfil.
- **Estilo e recursos:** Moda Fitness, Produtos, Game 3D, Criar postagem.
- Acessos finais: todas as seções, Sobre o Be e Contato.

As demais páginas apresentam destinos relacionados ao próprio conteúdo:

| Página | Conteúdo do menu |
| --- | --- |
| Reportagens | Início, Reportagens, Destaque, Mais histórias |
| Uma reportagem | Início, Reportagens, Ler história, Relacionadas, Comentários |
| BePlay | Início, Assistir, Playlist, Comentários, Minha lista |
| Moda Fitness | Início, Conceito, Editorial, Catálogo, Contato |
| Radar SP | Início, Radar SP, Onde praticar, Indicar um local |
| Profissionais | Início, Como funciona, Encontrar apoio, Contato |
| Produtos | Início, Produtos, Moda Fitness, Contato |
| Fala Bem! | Início, Fala Bem!, A editoria, Colunas, Enviar uma ideia |
| Institucionais | Início, Sobre, Contato, Políticas |

Os menus continuam disponíveis sem JavaScript; os painéis usam o elemento nativo `details`. Escape fecha o painel e devolve o foco ao acionador. No celular, menus de seção mais longos deslizam horizontalmente. Diário, jogo, administração e catálogo de componentes conservam seus controles existentes com o tratamento visual atualizado, sem um cabeçalho da home duplicado.

## Manutenção

`js/core/routes.js` define os links e grupos da home e a configuração contextual de cada área. `npm run navigation:sync` aplica o modelo visual com os links próprios de cada página; `npm run navigation:check` verifica as 29 páginas e suas âncoras. O estilo é centralizado em `css/components/site-navigation.css`.

## Validação e próxima etapa

Os testes de navegação cobrem os cabeçalhos contextuais, preservação dos menus próprios, abertura e fechamento de painéis, teclado, âncoras, ausência de JavaScript e larguras de 320, 390, 768 e 1440 pixels. A home tem verificações próprias de busca, filtros e ordem do feed. Capturas de comparação ficam em `previas/`.

Antes de afirmar impacto no uso, observar visitantes tentando encontrar uma reportagem, um local para praticar, uma ferramenta e o diário. Verificar se entendem Fala Bem! como opinião, Radar SP como serviço local e Meu Caminho Be como experiência pessoal. Essas tarefas permitem ajustar rótulos e ordem sem descaracterizar o layout aprovado.

Limitação da suíte geral na publicação de 30/09: corrigidas as expectativas antigas da contagem de ações contextuais e da versão do script. O smoke ainda exige um `fb-goals-panel` ausente no diário anterior; testes antigos também procuram Ferramentas no menu principal e tentam interagir sem abrir a capa do diário. A execução completa não foi aprovada. A validação específica de home e navegação usa os controles atuais. O CTA de registro da home foi preservado no card Meu Caminho Be.
