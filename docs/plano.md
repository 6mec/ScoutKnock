# Plano ScoutKnock — versão 1 (30 dias)

Resumo do plano completo. O documento original, com tabelas e cronograma desenhado, está no Claude (chat do Daniel).

## Objetivo

No dia 30 (1 de dezembro de 2026): plataforma online, com pagamentos ativos, apresentada numa live no TikTok. Início: segunda-feira, 2 de novembro de 2026.

## Âmbito da versão 1 (tudo funcional no dia 30)

1. Contas e login: email ou Google, recuperação de palavra-passe, painel do utilizador.
2. Radar de empresas: busca por serviço, nicho e localidade (distrito/concelho em PT, cidade/bairro no BR) via Google Places API.
3. Pontuação de oportunidade: nota de 0 a 100 com os motivos (sem site, site lento ou antigo, sem versão móvel, poucas avaliações, sem horário).
4. Mensagem por IA: abordagem para WhatsApp e email, que o freelancer revê e envia ele próprio.
5. Site demo: página gerada para a empresa (nome, serviços, morada, contacto), subdomínio próprio, 3 modelos por nicho, botão "Publicar como oficial".
6. CRM: leads com estados (novo, contactado, respondeu, proposta, cliente, perdido) e notas.
7. Pagamentos e limites: subscrições Stripe, teste grátis de 7 dias, limites por pack.

Versão 2 (não construir agora): portfólio do freelancer, copiloto de vendas, apps de telemóvel.
Nunca: envio automático em massa.

## Packs (proposta inicial)

| Pack | PT | BR | Buscas/mês | Demos/mês |
| --- | --- | --- | --- | --- |
| Teste (7 dias) | grátis | grátis | 10 | 2 |
| Inicial | 19 € | R$ 49 | 100 | 10 |
| Pro | 39 € | R$ 97 | 400 | 50 |
| Agência | 79 € | R$ 197 | 1500 | 200 |

Site oficial alojado: 5 € (R$ 15) por mês por site publicado.

## Semanas

- Semana 1 (dias 1 a 7): fundações. Projeto Next.js + Supabase, login, painel, identidade visual, landing page com lista de espera, base de dados.
- Semana 2 (dias 8 a 14): radar e pontuação. Google Places, busca por localidade, verificação de sites, nota 0 a 100, ecrã de resultados e guardar leads. Checkpoint no dia 14: se busca + pontuação não funcionam, cortar o secundário, nunca os pagamentos.
- Semana 3 (dias 15 a 21): mensagens por IA, gerador de site demo com botão "Publicar como oficial", subscrições Stripe, limites por pack, faturação certificada.
- Semana 4 (dias 22 a 28): CRM, testes com 5 a 10 freelancers, textos legais, perguntas frequentes, polimento visual e teste no telemóvel.
- Dias 29 e 30: rever checklist, pagamento real de teste, lançamento.

## Checklist do dia 30

- [ ] Registo, login e recuperação de palavra-passe testados
- [ ] Busca devolve resultados reais em 5 concelhos PT e 5 cidades BR
- [ ] Pontuação mostra os motivos de cada nota
- [ ] Mensagem IA gerada em menos de 10 segundos
- [ ] Site demo abre bem no telemóvel e no computador
- [ ] CRM guarda e altera estados sem erros
- [ ] Pagamento real feito com cartão próprio e reembolsado
- [ ] Limites dos packs bloqueiam corretamente
- [ ] Fatura certificada emitida automaticamente
- [ ] Privacidade, termos e cookies publicados
- [ ] Landing page com demonstração, preços e perguntas frequentes
- [ ] Pelo menos 1 caso real (empresa contactada com o sistema)

## Legal (validar com contabilista/advogado)

Atividade aberta, faturação certificada pela AT, IVA em vendas online (OSS na UE; tratar clientes BR), RGPD (privacidade, cookies, só dados públicos de empresas), termos de utilização (proibir spam, opção de não ser contactado), termos do Google Places (atribuição e cache).
