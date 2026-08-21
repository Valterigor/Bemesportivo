# Canal de contato do Bem Esportivo

O formulário da Home e a página `/contato` enviam dúvidas e solicitações para `bemesportivo@yahoo.com` pela Pages Function `/api/contact`.

## Ativação no Cloudflare

1. Acesse **Compute > Email Service > Email Routing > Destination Addresses**.
2. Adicione `bemesportivo@yahoo.com` e confirme a verificação recebida no Yahoo.
3. Faça o onboarding do domínio `bemesportivo.com` no Email Service.
4. No projeto Pages do site, adicione um binding de envio de e-mail com o nome `CONTACT_EMAIL`, restrito ao destinatário `bemesportivo@yahoo.com`.
5. Configure, se necessário, `CONTACT_FROM_EMAIL=contato@bemesportivo.com`.
6. Faça um novo deploy e envie uma mensagem de teste pela página `/contato`.

O binding nunca deve permitir que o navegador escolha o destinatário. A função mantém o endereço do Yahoo fixo no servidor.

## Proteções implementadas

- validação de origem, e-mail e tamanho da mensagem;
- campo invisível contra robôs;
- bloqueio de excesso de links;
- limite de cinco mensagens por hora e IP quando o binding `BE_DATA` está disponível;
- destinatário fixo e `Reply-To` configurado com o e-mail informado pelo visitante;
- fallback `mailto:` quando o envio automático não estiver configurado.

O formulário não cadastra newsletter e não armazena a mensagem em banco. A mensagem segue diretamente para o canal de atendimento.
