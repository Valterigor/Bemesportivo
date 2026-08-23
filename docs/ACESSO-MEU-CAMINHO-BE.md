# Acesso ao Meu Caminho Be

## Modelo atual

O Meu Caminho Be não possui cadastro ou entrada por e-mail, senha ou provedor social. O acesso é local e começa dentro do próprio Perfil Be.

1. A pessoa informa como deseja ser chamada.
2. Conclui e salva o Perfil Be.
3. O nome passa a identificar automaticamente a jornada naquele navegador.
4. Nas próximas visitas, o perfil é reconhecido e o caminho continua do ponto salvo.

Não existe uma tela adicional de login depois do perfil. Pedir novamente o mesmo nome não aumentaria a segurança e criaria uma etapa redundante.

## Limites do nome de acesso

O nome funciona como identificação de experiência, não como credencial secreta. Em aparelho compartilhado, outra pessoa que use o mesmo navegador poderá ver a jornada local. A interface informa essa limitação e permite exportar ou zerar os dados.

Nome sozinho nunca recupera uma jornada em outro aparelho e não deve ser usado como autorização de API, identificador público ou prova de identidade.

## Continuidade entre aparelhos

A continuidade é opcional e utiliza um código secreto de 32 caracteres. Os dados são criptografados no aparelho com AES-GCM antes do envio; o código não é enviado ao servidor.

- Sem código: os dados permanecem no navegador.
- Com código: uma cópia criptografada pode ser continuada em outro aparelho.
- Se a rede falhar: a cópia local continua disponível.
- Fotos do diário privado não integram a sincronização.
- Conflitos entre aparelhos exigem escolha explícita da pessoa.

## Teste de aceite

1. Abrir `/meu-caminho-be` sem dados e confirmar que o Perfil Be é a primeira etapa.
2. Confirmar que não existe formulário, botão ou recurso de e-mail, senha ou Google.
3. Informar um nome e concluir o perfil.
4. Confirmar que o nome aparece no topo e que a jornada segue para o Mapa BeM.
5. Recarregar a página e confirmar o reconhecimento automático do perfil.
6. Ativar um código de continuidade e testar a recuperação em outro navegador.
7. Simular indisponibilidade da API e confirmar que os dados locais permanecem utilizáveis.
