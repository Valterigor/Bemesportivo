# Meu Caminho Be — App Web MVP

## Objetivo

O Meu Caminho Be funciona como um aplicativo web instalável, mobile-first e com continuidade opcional entre aparelhos. O site público continua estático; a experiência pessoal permanece isolada em `/meu-caminho-be`.

## Navegação principal

No mobile, o app possui cinco destinos fixos:

1. **Hoje** — ação principal, registro diário e orientação do momento.
2. **Jornada** — missão atual, etapas e conclusão do ciclo.
3. **Evolução** — semana, sequência, registros, nível e leitura do histórico.
4. **Explorar** — conteúdos, ferramentas, profissionais, modalidades, comunidade e contador de gols.
5. **Perfil** — identidade esportiva, conta, sincronização, exportação e exclusão.

Os destinos ficam na barra inferior e respeitam a área segura do aparelho. No desktop, o menu lateral oferece sete acessos diretos: **Meu Hoje**, **Jornada da Semana**, **Perfil**, **Ferramentas**, **Conteúdos**, **Profissionais** e **Gols**. Evolução e os demais recursos continuam acessíveis dentro das áreas contextuais.

Cada troca de área atualiza o título da página, anuncia a tela para tecnologia assistiva e posiciona o foco no título principal.

## Ciclo funcional

O núcleo da experiência segue um ciclo simples:

1. entender o momento e escolher uma prioridade;
2. receber uma ação possível por vez no Meu Hoje;
3. executar ou adaptar sem compensação;
4. registrar como foi e, quando necessário, a principal barreira;
5. após dois registros na semana, escolher se o próximo ciclo deve manter, simplificar, reorganizar ou buscar orientação.

Dor, desconforto ou insegurança nunca geram progressão automática. O sistema orienta a não avançar e procurar avaliação profissional quando apropriado.

## Be IA Esportiva

A Be IA aparece no Meu Hoje depois que o Mapa BeM está concluído. Diferente de um chat genérico, ela considera faixa etária, objetivo, modalidade, progresso, tempo disponível, registros recentes e barreira mais recente.

A versão beta inicial usa um motor contextual local e respostas estruturadas. O texto livre não é armazenado; somente categoria da orientação, classe de segurança e feedback opcional ficam neste aparelho. Cada resposta oferece um passo possível, explica quais dados influenciaram a orientação e mantém acesso direto ao Meu Hoje, à Jornada ou a profissionais.

O contrato para evolução do motor está documentado em [Be IA Esportiva](BE-IA-ESPORTIVA.md).

## Estado e URLs

As telas principais usam o parâmetro `tela`:

```text
/meu-caminho-be?tela=hoje
/meu-caminho-be?tela=jornada
/meu-caminho-be?tela=evolucao
/meu-caminho-be?tela=explorar
/meu-caminho-be?tela=perfil
```

O histórico do navegador acompanha as trocas de tela. Links antigos com hash continuam aceitos para não quebrar atalhos já publicados.

## Persistência

### Modo local

É o padrão. Perfil, Meu Hoje, tarefas, evolução e contador de gols ficam no navegador. O app funciona sem conta e continua utilizável offline depois do primeiro carregamento.

### Continuidade em nuvem

É opcional e exige:

- conta autenticada;
- consentimento específico;
- confirmação de conflito entre aparelhos;
- possibilidade de excluir a cópia sincronizada.

O cliente envia um snapshot versionado. Cada gravação recebe um `mutationId` para ser idempotente. O backend aplica revisão otimista: uma versão remota nunca é substituída silenciosamente quando o aparelho está desatualizado.

## Backend

Rota:

```text
GET    /api/meu-caminho-sync
PUT    /api/meu-caminho-sync
DELETE /api/meu-caminho-sync
```

Controles implementados:

- autenticação pelo provedor de identidade;
- isolamento pela identificação do usuário;
- verificação de origem em mutações;
- limite de tamanho;
- validação recursiva de JSON;
- bloqueio de chaves perigosas;
- consentimento versionado;
- revisão otimista;
- idempotência;
- respostas sem cache.

O Netlify Blobs atende esta etapa de MVP. Antes de consultas relacionais, compartilhamento social amplo ou uso intensivo, migrar os domínios privados para PostgreSQL com políticas por usuário.

## PWA e offline

- manifesto com identidade própria, atalhos e modo `standalone`;
- navegação inicial em `?tela=hoje`;
- shell essencial pré-armazenado;
- CSS e JavaScript em estratégia network-first;
- mídia estática em cache-first;
- nenhuma resposta de `/api` é armazenada pelo service worker;
- fallback offline restrito ao app.

## Configuração necessária na hospedagem

1. Ativar o provedor de identidade e confirmação de e-mail.
2. Configurar a URL de retorno para `/meu-caminho-be`.
3. Garantir acesso do ambiente às variáveis da Netlify usadas pelo Blobs.
4. Configurar as chaves Web Push somente quando notificações forem liberadas.
5. Executar o teste de conta em dois navegadores antes da publicação.

## Teste de aceite

1. Abrir o app em largura de 360 px.
2. Criar o Mapa BeM.
3. Registrar o Meu Hoje.
4. Confirmar atualização de Hoje e Evolução.
5. Navegar pelas cinco áreas usando apenas a barra inferior e pelos sete acessos diretos do menu lateral no desktop.
6. Recarregar uma URL com `?tela=evolucao`.
7. Instalar o app e abrir pelo ícone.
8. Desconectar a rede e confirmar acesso ao app local.
9. Conectar uma conta e sincronizar em outro navegador.
10. Criar conflito entre aparelhos e confirmar que o app solicita uma escolha.
11. Excluir a cópia da nuvem e confirmar que os dados locais permanecem.
12. Registrar uma etapa parcial, selecionar uma barreira e confirmar que o próximo passo foi adaptado.
13. Criar dois registros na semana, salvar uma decisão semanal e confirmar que ela reaparece após recarregar.
14. Navegar por teclado e confirmar foco, título e anúncio de cada tela.
15. Perguntar “Estou sem vontade de treinar” e confirmar que idade, objetivo, modalidade, progresso, tempo e histórico aparecem na explicação.
16. Informar “Estou com dor forte” e confirmar que a Be IA não recomenda treino e direciona para atendimento profissional.

## Próxima fase

- banco relacional com Row Level Security;
- exclusão completa da identidade;
- painel operacional de privacidade e suporte;
- testes automatizados reais em navegador;
- gráficos mensais;
- fila offline de mutações por registro, substituindo o snapshot único;
- notificações com preferências por usuário.
