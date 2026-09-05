# Canal de contato do Bem Esportivo

O formulário da Home e a página `/contato` enviam dúvidas e solicitações para `bemesportivo@yahoo.com` pela Pages Function `/api/contact`.

## Ativação no Cloudflare

1. Acesse **Compute > Email Service > Email Routing > Destination Addresses**.
2. Adicione `bemesportivo@yahoo.com` e confirme a verificação recebida no Yahoo.
3. Faça o onboarding do domínio `bemesportivo.com` no Email Service.
4. Publique o Worker interno `bemesportivo-contact-email`, cujo binding `CONTACT_EMAIL` fica restrito ao destinatário `bemesportivo@yahoo.com`.
5. No projeto Pages, configure o Service Binding `CONTACT_EMAIL_SERVICE` apontando para `bemesportivo-contact-email`.
6. Configure, se necessário, `CONTACT_FROM_EMAIL=contato@bemesportivo.com`.
7. Faça um novo deploy e envie uma mensagem de teste pela página `/contato`.

O navegador nunca escolhe o destinatário. A função mantém o Yahoo fixo no servidor e usa um Service Binding privado para chamar o Worker de envio.

## Proteções implementadas

- validação de origem, e-mail e tamanho da mensagem;
- campo invisível contra robôs;
- bloqueio de excesso de links;
- limite de cinco mensagens por hora e IP quando o binding `BE_DATA` está disponível;
- destinatário fixo e `Reply-To` configurado com o e-mail informado pelo visitante;
- fallback `mailto:` quando o envio automático não estiver configurado.

O formulário não cadastra newsletter e não armazena a mensagem em banco. A mensagem segue diretamente para o canal de atendimento.
