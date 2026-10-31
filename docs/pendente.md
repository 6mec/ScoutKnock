# Pendente: o que precisa de chave ou de dinheiro

Lista do que já está construído mas desligado. Cada ponto diz o passo exato para o ligar. Nunca colar chaves no código nem em conversas: só no `.env.local` e nas variáveis de ambiente da Vercel.

## Mensagens por IA

**Estado:** pendente: precisa de chave.

**Funciona hoje:** gerar, editar, copiar, abrir no WhatsApp ou no email e pedir outra versão, com texto de modelo escrito por nós e a etiqueta "Exemplo".

**Testado só com uma imitação local da API, nunca com o Claude a sério:** escolha do modelo, streaming, registo de custos, travão de 20 mensagens por dia e erros.

**Para ligar:**

1. Em console.anthropic.com, carregar créditos e definir um limite de gastos mensal.
2. Criar uma chave de API.
3. Colocar a chave em `ANTHROPIC_API_KEY`, no `.env.local` e na Vercel.
4. Reiniciar a aplicação. Não é preciso alterar código.

**Verificar na primeira utilização:**

- [ ] A chave é aceite. O SDK envia-a no cabeçalho `Authorization`, e isto só se confirma com uma chave real.
- [ ] A mensagem aparece sem a etiqueta "Exemplo".
- [ ] Demora menos de 10 segundos (checklist do dia 30).
- [ ] O tom e a qualidade do texto são bons em várias empresas. As instruções estão em `src/lib/messages/claude-provider.ts` e ainda não foram experimentadas com o modelo.
- [ ] Surge uma linha `message` em `api_costs`, com um custo plausível.

**Por decidir (Daniel):**

- Limite de mensagens por pack. Até lá vale o travão provisório de 20 por dia.
- Texto dos modelos de exemplo em `src/i18n/pt-PT.ts`, em `messages.sample`.

**Ainda não feito:** mensagens em português do Brasil e em inglês, que entram com as traduções.

## Google Places

**Estado:** pendente: precisa de chave e de uma decisão legal.

**Funciona hoje:** o Radar com os dados de exemplo (`sample-companies`), só em desenvolvimento.

**Testado só com respostas simuladas do Google, nunca com a API a sério:** pedido, conversão dos resultados, erros, páginas, travão de custo e registo em `api_costs`.

**Bloqueia a produção: decisão legal por tomar (Daniel).** Os termos do Google dizem: "You must not pre-fetch, cache, or store Places API content beyond the allowed exceptions", e a única exceção indicada é o `place_id`. Hoje, Contactos e Sites demo guardam nome, morada, telefone e site da empresa. Com dados reais, isto precisa de ser validado ou alterado antes de abrir ao público. Fonte: developers.google.com/maps/documentation/places/web-service/policies (consultada a 31/10/2026).

**Para ligar (em desenvolvimento):**

1. Seguir `docs/google-cloud.md`, passos 1 a 6 (projeto, faturação, chave restrita, orçamento e quotas).
2. No `.env.local`, preencher todas estas variáveis. Sem qualquer uma delas, a busca fica indisponível, sem gasto:
   - `GOOGLE_PLACES_API_KEY`
   - `GOOGLE_DAILY_BUDGET_EUR` e `GOOGLE_MONTHLY_BUDGET_EUR`, os tetos do projeto inteiro em euros de custo estimado
   - `GOOGLE_TEXT_SEARCH_COST_EUR` e `GOOGLE_PLACE_DETAILS_COST_EUR`, o custo estimado de cada chamada
3. Confirmar os preços em developers.google.com/maps/billing-and-pricing/pricing. Valores da página a 30/10/2026, sem contar com a parte grátis: Text Search Enterprise 35 $ por 1000 e Place Details Enterprise 20 $ por 1000. Com um dólar a contar como um euro, dá `0.035` e `0.02`.
4. Reiniciar a aplicação. Não é preciso alterar código.

**Verificar na primeira utilização:**

- [ ] Com um teto a `0`, a busca mostra "temporariamente indisponível" e o Google não recebe chamadas.
- [ ] Os resultados são bons em 5 concelhos PT e 5 cidades BR. O texto pesquisado é "nicho em localidade", sem país definido, e isso pode precisar de ajuste.
- [ ] Depois de 10 buscas de teste, comparar o custo estimado com o gasto real no Cloud Console e corrigir os custos configurados:
  - Chamadas por busca: `select data->>'calls', data->>'count' from public.events where type = 'search' order by created_at desc;`
  - Custo por tipo: `select kind, count(*), sum(cost_eur) from public.api_costs where provider = 'google_places' group by kind;`
- [ ] A atribuição cumpre as regras. Os termos pedem o logótipo do Google quando os dados aparecem sem mapa, e hoje só existe o texto "Dados do Google Maps" no detalhe da empresa.

**Limitações conhecidas:**

- Os sinais do site (lento, sem versão móvel, antigo) ficam por verificar e não dão pontos, por isso as notas de empresas com site serão baixas.
- Guardar um contacto, criar uma demo ou gerar uma mensagem a partir do Radar faz uma chamada paga de detalhes. Estas chamadas ficam em `api_costs` por utilizador, mas não entram nas chamadas da busca.
- Os tetos são do projeto inteiro: até os limites dos packs estarem ligados, um só utilizador pode esgotar o teto de todos.
- O alerta aos 80% do teto, previsto no guia, não está construído.

## Pagamentos (Stripe)

**Estado:** só modo de teste. O modo real não está ligado, e uma chave `sk_live_`, `rk_live_` ou `pk_live_` desliga os pagamentos.

**Funciona hoje:** os limites de buscas e demos por pack, que dependem da migração `20261105000000_billing.sql`. Sem chaves, o ecrã de Planos não mostra preços nem botões de compra.

**Testado sem o Stripe a sério:** configuração, parâmetros do Checkout, assinatura e tratamento dos eventos, com eventos simulados.

**Para ligar o modo de teste (grátis):**

1. Criar uma conta em dashboard.stripe.com e confirmar que está em modo de teste.
2. Criar três produtos (Inicial, Pro e Agência), cada um com um preço mensal em EUR e outro em BRL, com os valores do `docs/plano.md`.
3. Em Definições de faturação, ativar o portal do cliente e permitir cancelar, mudar de pack e atualizar o pagamento.
4. Instalar o Stripe CLI e correr `stripe login`. Depois, `stripe listen --forward-to localhost:3000/api/stripe/webhook --events customer.subscription.created,customer.subscription.updated,customer.subscription.deleted` mostra o `whsec_...`.
5. Preencher no `.env.local` as variáveis `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, as seis `STRIPE_PRICE_*` e `SITE_URL`.
6. Reiniciar a aplicação.

**Verificar com o modo de teste:**

- [ ] Começar o teste grátis: o Checkout não pede cartão, e o estado fica `trialing`.
- [ ] Sem cartão até ao fim do teste (com um relógio de teste do Stripe), a subscrição cancela e o limite fica no mais baixo.
- [ ] Com o cartão `4242 4242 4242 4242`, o estado fica `active` e os limites passam aos do pack.
- [ ] Com um cartão de teste que falha na renovação, o estado fica `past_due` e o limite baixa. Ao regularizar, volta ao do pack.
- [ ] Reenviar um evento com `stripe events resend` não muda nada.
- [ ] Os preços mostrados no ecrã são iguais aos criados no Stripe.
- [ ] Apagar a conta remove o cliente e cancela a subscrição no Stripe.

**Pendente: precisa de dinheiro ou de decisão legal (Daniel):**

- Modo real. Implica alterar a verificação em `src/lib/billing/rules.ts`, criar os preços reais e registar o webhook público em HTTPS.
- Faturação certificada (InvoiceXpress ou Moloni) e IVA (OSS na UE, clientes BR). Não está construída.
- Regras das redes de cartões para testes grátis e lembretes do fim do teste. O Stripe não envia estes lembretes em modo de teste.
- Termos de subscrição e direito de cancelamento, com os textos legais.
