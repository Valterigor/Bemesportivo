# Objetivos, metas e Biblioteca BeM

Implementação local em `js/be-diary-goals.js`, apresentada no início do diário após a criação do perfil. Não usa modelos de IA, geração de texto, embeddings ou APIs externas para selecionar dicas.

## Metas

- Objetivos: constância, acompanhamento de treinos, alimentação e movimento.
- Indicadores: dias distintos de atividade, sessões, minutos e dias distintos com refeições registradas.
- Quantidade e intervalo escolhidos pela pessoa; filtro opcional de atividade.
- Progresso recalculado a partir dos registros existentes, inclusive após importações e exclusões. Não conta datas futuras nem registros fora do intervalo. IDs repetidos não duplicam a contagem.
- Estados: planejada, em andamento, alcançada, prazo encerrado e pausada. A pausa altera o acompanhamento, preservando a contagem dos registros do período. Alterar uma meta recalcula o progresso; não cria conquistas fictícias.
- Alimentação mede o hábito de registrar, sem notas para refeições, calorias ou prescrição de dieta.
- Armazenamento privado em `meuCaminhoBeGoalsV1`, incluído no backup e na restauração; a exclusão dos dados do diário também remove as metas. Não publica nem sincroniza metas com o perfil público.
- Limite de 100 metas; validação de datas, quantidade, tipos e IDs na criação e importação. Falha de armazenamento mantém o formulário disponível.

## Biblioteca

Textos existentes de `BeSportsLibrary.topics` são selecionados por tema e modalidade do perfil. `BeKnowledgeLibrary.assessSafety` verifica restrição registrada antes de exibir o conteúdo esportivo; nesses casos, a mensagem de cuidado da própria biblioteca prevalece. As fontes cadastradas acompanham o texto. Nenhuma recomendação nova é gerada.

As metas são escolhidas pela pessoa, não prescritas pela biblioteca. O módulo não faz avaliação clínica nem altera a ativação do perfil público.

## Validação

`node tests/integration/diary-goals-test.js`

`npx playwright test tests/e2e/diary-goals.spec.js`
