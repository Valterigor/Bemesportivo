# Fornecedores, suboperadores e transferências

## Cadastro mínimo

| Fornecedor | Serviço/dados | Papel esperado | Verificações antes de produção |
| --- | --- | --- | --- |
| Cloudflare | hospedagem, APIs, KV, proteção, notificações, dados públicos e pacotes cifrados | Operador | DPA vigente, regiões/suboperadores, retenção de logs, acesso, incidentes, exclusão e transferência internacional |
| Supabase | infraestrutura histórica de autenticação atualmente não oferecida ao usuário | Operador inativo no fluxo atual | manter sem coleta nova; revisar ou eliminar o projeto e os dados de teste antes de qualquer reativação |
| Google | fontes, YouTube e AdSense após escolha aplicável | Operador/controlador independente conforme serviço | políticas, consentimento, publicidade, cookies, conteúdo de terceiros e ausência de envio de dados identificáveis pelo site |
| Yahoo Mail | recebimento de contatos e pedidos | Operador do canal | MFA, acessos, retenção da caixa, exportação/exclusão e recuperação da conta |

## Checklist contratual

- finalidade e instruções documentadas;
- confidencialidade e acesso mínimo;
- medidas técnicas e administrativas;
- suboperadores e aviso de mudanças;
- local de armazenamento e mecanismo de transferência internacional aplicável;
- retenção, devolução e eliminação;
- apoio a direitos dos titulares e incidentes;
- prazo de notificação de incidente compatível com a resposta em três dias úteis;
- auditorias, evidências e término do contrato.

Guardar links/versões dos documentos aceitos, data, responsável e decisão. Uma política pública do fornecedor não substitui a avaliação do contrato/DPA.

## Revisão

Revisar semestralmente e sempre que houver alteração material, incidente, troca de região ou novo suboperador. Bloquear a nova integração até concluir a avaliação.
