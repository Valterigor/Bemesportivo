# Continuidade do Meu Caminho Be

## Princípio

O modo local é o padrão. Planejamento, atividades, refeições, perfil e jornada continuam funcionando sem conta e sem IA. A pessoa pode proteger sua trajetória de duas formas independentes:

1. exportar um arquivo de backup;
2. ativar a continuidade opcional por código criptografado.

## Backup no aparelho

O arquivo exportado usa o identificador `meu-caminho-be-backup` e contém, quando existirem:

- perfil e planos do dia;
- tarefas de rotina;
- atividades do diário;
- refeições registradas.

A importação aceita backups antigos sem identificador, limita o arquivo a 5 MB, higieniza atividades e refeições e pede confirmação antes de substituir os dados atuais. Se uma gravação falhar, o sistema restaura automaticamente os valores anteriores.

Um backup sem perfil continua válido quando contém atividades, refeições ou tarefas. Isso garante que todo arquivo criado pelo próprio sistema também possa ser importado.

## Continuidade criptografada

- Não exige e-mail ou senha.
- A pessoa cria e guarda um código de 32 caracteres.
- O conteúdo é criptografado no navegador com AES-GCM antes do envio.
- O servidor recebe somente o envelope criptografado.
- O código não é enviado ao servidor e não pode ser recuperado pelo Bem Esportivo.
- Perfil, tarefas, diário e refeições compõem um snapshot versionado.
- Conflitos entre aparelhos exigem escolha explícita.
- Excluir a cópia da nuvem não apaga os dados locais.
- Se a rede falhar, o modo local continua funcionando.

## Configuração de hospedagem

1. Disponibilizar `GET`, `PUT` e `DELETE /api/meu-caminho-sync`.
2. Garantir acesso da função ao armazenamento configurado para os envelopes criptografados.
3. Manter validação de origem, limite de tamanho, revisão otimista e idempotência ativos.
4. Nunca armazenar em cache respostas de `/api` no service worker.
5. Testar a continuidade em dois navegadores antes da publicação definitiva.

## Teste de aceite do backup

1. Criar um plano do dia, uma atividade e uma refeição.
2. Exportar o arquivo e confirmar o identificador e a versão do backup.
3. Alterar os dados locais.
4. Importar o arquivo e cancelar na primeira confirmação; os dados atuais devem permanecer.
5. Importar novamente e confirmar; o conteúdo deve ser substituído pelo backup.
6. Recarregar a página e verificar perfil, plano, atividade e refeição.
7. Importar um arquivo inválido e confirmar que nada foi alterado.
8. Simular falha de armazenamento e confirmar a reversão para os dados anteriores.

## Teste de aceite da continuidade

1. Criar um perfil e um registro no Meu Hoje.
2. Abrir **Meu Perfil > Continuidade**.
3. Autorizar a cópia criptografada e criar o código.
4. Guardar o código fora do aparelho.
5. Abrir outro navegador, informar o mesmo código e recuperar a jornada.
6. Alterar os dois aparelhos antes de sincronizar e confirmar que o sistema pergunta qual versão manter.
7. Excluir a cópia da nuvem e confirmar que os dados locais permanecem.

## Limites atuais

- A sincronização usa um snapshot por trajetória e não mescla registros campo a campo.
- Sem o código não existe recuperação da cópia criptografada.
- Antes da publicação definitiva ainda são necessários testes em celulares reais, navegadores diferentes e cenários de armazenamento cheio.
