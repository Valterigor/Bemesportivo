# Melhorias do site — setembro de 2026

## Experiência

Revisão visual solicitada: o hero foi simplificado para manter somente a marca Bem Esportivo, a pergunta, o botão de registro e a busca, preservando a foto e o tema. Foram retirados os atalhos intermediários, textos auxiliares e exemplos de busca dessa área. A preferência de modalidade permanece na seção de resultados. Esta revisão substitui os detalhes da proposta inicial abaixo sobre atalhos e exemplos na home.

A home destaca o registro de atividade e oferece quatro destinos no cabeçalho: explorar, Meu Caminho Be, apoio e perfil. Os oito produtos continuam disponíveis na navegação de descoberta. Quem já tem uma jornada local recebe um atalho para retomá-la.

A busca oferece exemplos acionáveis e uma modalidade favorita opcional, escolhida explicitamente. A chave `bemEsportivoSportPreferenceV1` guarda somente uma modalidade predefinida no aparelho. Selecionar a opção vazia remove a preferência e restaura a seleção editorial. Nenhum texto livre da busca é enviado às métricas.

Foram adicionados salto para o conteúdo, foco no título dos resultados, controles de pelo menos 44 px nos novos atalhos e respeito à preferência por movimento reduzido. A paleta da home foi corrigida para textos em superfícies escuras e botões laranja.

## Carregamento

Os estilos extensos da home foram extraídos para `css/home-layout.css`, permitindo cache separado. Foi removida a solicitação da fonte Nunito na home. A imagem principal recebe prioridade e uma imagem PNG da jornada foi substituída pela versão WebP existente. O vídeo institucional usa `preload="none"`.

Essas mudanças não representam uma medição de Core Web Vitals em produção. LCP, INP e CLS devem ser confirmados em visitas reais após a publicação, separando celular e computador.

## Dados

Cada lote aceito é gravado uma única vez em uma chave independente `analytics:<data>:<uuid>`, com retenção de 90 dias. Os totais por evento ficam nos metadados da mesma gravação. Não existe mais atualização concorrente de um contador diário compartilhado.

O painel soma os lotes e reconstrói os antigos sem metadados. Resumos diários antigos não entram na soma, evitando duplicidade. O relatório pagina até 1.000 lotes e declara `complete: false` quando atinge o limite. KV tem atualização eventual; o painel não promete consistência imediata. Para volumes maiores, será necessário agregador periódico ou armazenamento analítico dedicado.

O painel exibe contagens de buscas, atividades, contatos, compartilhamentos e consumo. `video_play` agora representa o início observado no vídeo HTML nativo, uma vez por elemento e visita; `video_complete` representa o término. Players externos não estão incluídos. O histórico anterior de `video_play` representava cliques, portanto a comparação atravessando esta versão exige cuidado.

`content_read` é uma aproximação de leitura engajada: 30 segundos com a página visível e medição autorizada, mais avanço até 75% da página. Não prova leitura integral.

Não foram criados identificadores de rastreamento. Esses dados não permitem deduzir pessoas únicas, retenção D7/D30 ou conversão individual. Tais indicadores dependem de um desenho adicional de medição. Eventos só são enviados após consentimento e a revogação descarta a fila pendente.

## Validação

O teste `tests/integration/analytics-test.mjs` cobre 30 gravações simultâneas, paginação, leitura do legado e sinalização de totais parciais. `tests/e2e/home-improvements.spec.js` cobre teclado, exemplos de busca, persistência e remoção da preferência e largura no celular. Os testes existentes cobrem contraste, rotas, fluxos e responsividade.

Não houve publicação nem alteração de configuração em serviços externos.
