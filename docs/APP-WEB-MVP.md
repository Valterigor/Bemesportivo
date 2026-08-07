# Meu Caminho Be — App Web MVP

## Objetivo

O Meu Caminho Be funciona como um aplicativo web instalável, mobile-first e com continuidade opcional entre aparelhos. O site público continua estático; a experiência pessoal permanece isolada em `/meu-caminho-be`.

## Navegação principal

No mobile, a barra inferior possui quatro destinos e uma ação central:

1. **Início** — plano do dia, registro diário e orientação do momento.
2. **Jornada** — diário, história e continuidade da trajetória.
3. **Registrar** — abre diretamente o formulário de atividade.
4. **Perfil** — identidade esportiva, conta, sincronização, exportação e exclusão.
5. **Ferramentas** — recursos práticos do Meu Caminho Be.

Os destinos respeitam a área segura do aparelho. No desktop, o menu lateral oferece seis acessos diretos, na ordem aprovada: **Meu Hoje**, **Meu Diário**, **Evolução**, **História**, **Eu** e **Ferramentas**. Conteúdos, profissionais, modalidades, comunidade, dicas e contador de gols continuam acessíveis de maneira contextual, sem sobrecarregar a navegação principal.

Cada troca de área atualiza o título da página, anuncia a tela para tecnologia assistiva e posiciona o foco no título principal.

## Ciclo funcional

O núcleo da experiência segue um ciclo simples:

1. abrir o Meu Hoje e receber uma única ação no **Be Agora**;
2. começar a ação ou escolher uma versão menor;
3. responder em um toque se conseguiu, fez uma parte ou não conseguiu;
4. informar a principal barreira somente quando ela for necessária;
5. ver a etapa concluída e o próximo passo imediatamente na mesma tela.

O Be Agora e o formulário completo da Jornada usam a mesma regra de conclusão. Assim, qualquer registro válido atualiza a etapa, persiste o histórico e libera a próxima ação sem criar estados paralelos. IA, diário completo, resumo semanal e explicações permanecem fechados até a pessoa solicitar ajuda ou detalhes.

No Be Agora, a imagem muda conforme o objetivo e a execução é apresentada em três estados: **Preparar**, **Fazer** e **Registrar**. Ao começar, a pessoa pode acompanhar um cronômetro opcional, pausar, retomar ou concluir antes do tempo. A sessão permanece ativa enquanto ela navega pelo app na mesma aba. Semana, sequência e XP ficam visíveis de forma compacta, e a conclusão atualiza o próprio card antes de apresentar o próximo passo.

Dor, desconforto ou insegurança nunca geram progressão automática. O sistema orienta a não avançar e procurar avaliação profissional quando apropriado.

## Be IA Esportiva

A Be IA fica disponível no Meu Hoje pelo botão **Preciso de ajuda** depois que o Mapa BeM está concluído. Diferente de um chat genérico, ela considera faixa etária, objetivo, modalidade, progresso, tempo disponível, registros recentes e barreira mais recente.

A versão beta inicial usa um motor contextual local e respostas estruturadas. O texto livre não é armazenado; somente categoria da orientação, classe de segurança e feedback opcional ficam neste aparelho. Cada resposta oferece um passo possível, explica quais dados influenciaram a orientação e mantém acesso direto ao Meu Hoje, à Jornada ou a profissionais.

O contrato para evolução do motor está documentado em [Be IA Esportiva](BE-IA-ESPORTIVA.md).

## Estado e URLs

O Início funciona como a home pessoal. Jornada, Ferramentas e Perfil usam sub-rotas do Meu Caminho Be:

```text
/meu-caminho-be
/meu-caminho-be/jornada
/meu-caminho-be/jornada/evolucao
/meu-caminho-be/jornada/historia
/meu-caminho-be/ferramentas
/meu-caminho-be/perfil
```

Registrar permanece uma ação central e devolve a pessoa à área em que ela estava. O histórico do navegador acompanha as trocas de subpágina. Links antigos com hash ou `?tela=` continuam aceitos para não quebrar atalhos já publicados.

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
- navegação inicial em `/meu-caminho-be`;
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
5. Navegar por Início, Jornada, Registrar, Ferramentas e Perfil na barra principal.
6. Recarregar `/meu-caminho-be/jornada/evolucao` e usar voltar/avançar do navegador.
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
