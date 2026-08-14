# Painel Administrativo Be

O painel operacional fica em `/admin` e não aparece na navegação pública. A página não contém dados administrativos no HTML: todos os indicadores e itens de moderação dependem da API protegida `/api/admin/*`.

## Proteção de acesso

A API exige a variável secreta `BE_ADMIN_TOKEN`, com pelo menos 32 caracteres aleatórios. Sem essa configuração, o servidor responde `503` e nenhum dado é entregue. Uma chave incorreta responde `401`.

Configure a variável como **secret** no projeto Cloudflare Pages. Não coloque o valor em `.env` versionado, código, HTML, mensagens públicas ou documentação. Depois da configuração, faça uma nova implantação.

No navegador, a chave fica somente em `sessionStorage`: ela é removida ao sair do painel e deixa de existir quando a aba é encerrada. O painel nunca usa `localStorage` para a credencial.

## Recursos da primeira versão

- contagem de comentários, respostas, denúncias e conteúdos ocultos;
- contagem de jornadas criptografadas, lembretes, lotes de métricas e participantes do game;
- fila com comentários denunciados ou ocultos;
- ações de ocultar, restaurar e excluir;
- registro de auditoria para cada decisão, retido por 365 dias;
- respostas administrativas sem cache e página marcada como `noindex`.

## Operação segura

1. Analise contexto, linguagem e risco antes de agir.
2. Use **Ocultar** quando o conteúdo precisar sair do ar sem ser apagado.
3. Use **Restaurar** somente depois de concluir a análise; as denúncias anteriores são zeradas.
4. Use **Excluir** para conteúdo ilegal, exposição de dados pessoais, spam ou violação inequívoca. A exclusão não pode ser desfeita.
5. Registre decisões sensíveis no controle operacional da equipe, sem copiar dados pessoais além do necessário.

## Testes

```bash
npm run test
npm run test:e2e
npm run verify:full
```

O teste de API usa armazenamento isolado em memória. O teste de navegador intercepta a API administrativa e nunca altera a comunidade pública.
