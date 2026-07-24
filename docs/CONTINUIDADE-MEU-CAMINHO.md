# Continuidade do Meu Caminho Be

## O que foi implementado

- O modo local continua sendo o padrão.
- Conta opcional por e-mail e senha com Netlify Identity.
- Consentimento separado antes do envio de dados pessoais e de saúde.
- Sincronização do perfil, diário, progresso e tarefas.
- Dados separados pelo identificador autenticado de cada usuário.
- Controle de revisão para detectar alterações feitas em outro aparelho.
- Escolha explícita entre a cópia local e a cópia da nuvem.
- Exclusão da cópia sincronizada sem apagar os dados locais.
- Fallback local quando a rede ou o serviço estiver indisponível.

## Ativação na Netlify

1. Abrir o projeto correto no painel da Netlify.
2. Acessar **Project configuration > Identity**.
3. Ativar o Netlify Identity.
4. Liberar cadastro por e-mail e senha.
5. Manter a confirmação de e-mail ativada.
6. Definir `https://bemesportivo.com/meu-caminho-be` como URL de retorno permitida.
7. Publicar o projeto e testar primeiro com uma conta de teste.

Sem essa ativação administrativa, o site mantém o modo local e informa que a continuidade ainda não está disponível.

## Teste de aceite

1. Criar um perfil e um registro no Meu Hoje.
2. Abrir **Meu Perfil > Continuidade**.
3. Criar uma conta e confirmar o e-mail.
4. Entrar novamente e confirmar “Tudo sincronizado agora”.
5. Abrir uma janela privada ou outro aparelho e entrar com a mesma conta.
6. Confirmar que o perfil, o diário e as tarefas foram restaurados.
7. Alterar os dois aparelhos antes de sincronizar e confirmar que o sistema pede qual versão manter.
8. Excluir a cópia da nuvem e confirmar que os dados locais permanecem.

## Limites desta primeira etapa

- Recuperação de senha e exclusão completa da identidade serão adicionadas na próxima etapa da conta.
- A sincronização usa um registro por usuário e controle otimista de revisão; não faz mesclagem campo a campo.
- Não ativar a funcionalidade em produção sem revisar os textos de e-mail e realizar o teste de aceite.
