# Meu Diário Be — dashboard

Publicado a partir da proposta aprovada em 27/10/2026. O conteúdo está em `diario-app/`, incluído pelo build. `js/diario-dashboard-entry.js` preserva a capa, boas-vindas e criação do acesso do aplicativo original e encaminha o usuário identificado ao painel.

## Dados e compatibilidade

- Registros novos são locais, em IndexedDB, separados pela identidade e data de criação do perfil.
- Atividades do armazenamento anterior (`meuCaminhoBeDiaryV1` e atividades válidas de `dailyLogs`) são copiadas uma vez para o novo painel. Os dados originais não são apagados ou modificados pelo importador. Um marcador impede que registros importados excluídos reapareçam.
- Informações adicionais do modelo anterior permanecem acessíveis pelo link “Acesso e histórico anterior”. `?versao=anterior` preserva essa navegação, inclusive ao atualizar a página.
- “Baixar meus registros” exporta JSON com os registros e fotos. “Restaurar cópia” valida o arquivo e adiciona somente IDs ainda ausentes, sem sobrescrever registros existentes.
- O código de continuidade do aplicativo anterior não transporta os novos registros em IndexedDB. A interface informa o uso da cópia própria do painel.
- A prévia em `previas/` usa outro banco e não é publicada. Seus exemplos fictícios não são importados para produção.

## Resultados e posts

Os indicadores consideram registros até hoje; dias são únicos e minutos exigem uma atividade preenchida. Conquistas são recalculadas depois de salvar, editar ou excluir. O modo “Ver exemplo” usa dados fictícios sinalizados, sem gravá-los.

A criação de post usa apenas foto e título do registro; anotações pessoais não são copiadas automaticamente. A imagem é baixada como PNG e não é publicada em redes sociais pelo site.

## Verificação e retorno

`tests/e2e/diary-dashboard.spec.js` verifica abertura, acesso, migração, persistência, download, restauração sem sobrescrita, isolamento entre perfis e layout responsivo.

O modelo anterior está marcado em `site-2026-10-27-before-diary-dashboard`. Para preparar uma restauração, use `npm run site:rollback -- site-2026-10-27-before-diary-dashboard` conforme o procedimento de versões. Isso restaura os arquivos do site, sem apagar os dados locais do usuário.
