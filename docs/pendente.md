# Pendente: o que precisa de chave ou de dinheiro

Lista do que já está construído mas desligado. Cada ponto diz o passo exato para o ligar. Nunca colar chaves no código nem em conversas: só no `.env.local` e nas variáveis de ambiente da Vercel.

## Bloqueios do lançamento

Sem cada um destes pontos, o site não pode abrir ao público:

- **SMTP próprio no Supabase:** sem ele, ninguém de fora se regista. Ver "Emails".
- **Domínio verificado e envio real dos emails.** Ver "Emails".
- **Validar com jurista a leitura dos termos do Google (docs/termos-google.md).** Ver "Google Places".
- **Chave do Google Places e modo real do Stripe, com faturação certificada.** Ver as secções respetivas.
- **Textos legais validados.**
- **Identificação do responsável pelo tratamento:** nome, NIF, morada e contacto, por decidir e preencher na política de privacidade. Hoje a página só tem o nome e o email.
- **Prazo de conservação dos eventos:** por decidir e publicar na política de privacidade. O rascunho sugere 12 meses, e 30 dias para os erros. Depois de decidido, é preciso apagar os eventos quando o prazo acabar, o que ainda não está construído.

## Limites dos packs

**Estado:** provisórios. Rever depois de medir o custo real com a chave do Google e o uso dos primeiros clientes.

Escolhidos para cumprir os 30% do preço em euros no pior caso, com os preços do Google de 30/10/2026, sem a parte grátis e com um dólar a contar como um euro (0,035 € por busca e 0,02 € por abertura de contacto):

| Pack | Buscas | Aberturas por mês (por dia) | Custo máximo | 30% do preço |
| --- | --- | --- | --- | --- |
| Inicial | 100 | 90 (3) | 5,30 € | 5,70 € |
| Pro | 150 | 300 (10) | 11,25 € | 11,70 € |
| Agência | 245 | 750 (25) | 23,58 € | 23,70 € |

Os limites estão em `PLANS` (`src/lib/account/rules.ts`) e em `public.plan_limits` e `public.plan_lookup_limits`. Têm de mudar nos dois sítios.

**Por decidir (Daniel):** os preços em reais não cumprem esta conta a câmbios acima de cerca de 2,50 a 2,77 reais por euro, conforme o pack. Os preços ficam como estão por agora. Rever com o câmbio do dia.

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

**Estado:** pendente: precisa de chave e de validação por um jurista.

**Funciona hoje:** o Radar com os dados de exemplo (`sample-companies`), só em desenvolvimento.

**Testado só com respostas simuladas do Google, nunca com a API a sério:** pedido, conversão dos resultados, erros, páginas, travão de custo e registo em `api_costs`.

**O que já foi aplicado:** os Contactos guardam só o `place_id` e o que o freelancer escreve, e os dados do Google são pedidos ao abrir o contacto. Os Sites demo guardam o `place_id` e o que o freelancer escreve. Latitude e longitude não são pedidas nem guardadas.

**Bloqueia a produção: validar com jurista a leitura dos termos do Google (docs/termos-google.md).** Perguntas em aberto:

- Se o CRM, mesmo só com o `place_id`, cai na proibição de listagens e diretórios.
- Se dados escritos e confirmados pelo freelancer chegam para os Sites demo, sobretudo com os dados do Google visíveis ao lado no formulário.
- Se é permitido enviar à Anthropic o nome da empresa, o nicho e os motivos da nota, para escrever a mensagem.
- Como fazer a atribuição quando não se mostra mapa.

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
- [ ] A atribuição cumpre as regras. Os termos pedem o logótipo do Google quando os dados aparecem sem mapa, e hoje só existe o texto "Dados do Google Maps" no Radar, no contacto e no formulário da demo.

**Limitações conhecidas:**

- Os sinais do site (lento, sem versão móvel, antigo) ficam por verificar e não dão pontos, por isso as notas de empresas com site serão baixas.
- Abrir um contacto ou gerar uma mensagem faz uma chamada paga de detalhes, que conta para o limite de aberturas do pack. Guardar um contacto e criar uma demo não fazem chamadas. As chamadas de detalhes ficam em `api_costs` por utilizador, mas não entram nas chamadas da busca.
- Os tetos de custo são do projeto inteiro. Os limites dos packs reduzem o risco, mas muitos utilizadores em simultâneo podem esgotar o teto de todos.
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

## Emails

**Estado:** pendente: precisa de domínio próprio. O envio real está desligado.

**Funciona hoje, com a chave gratuita do Resend:** todos os envios da aplicação passam por `src/lib/email/send.ts`. Com `EMAIL_REAL_SENDING` diferente de `true`, o destinatário passa a `delivered@resend.dev` e o remetente a `onboarding@resend.dev`, por isso não chega nada a ninguém. Estes envios contam para a quota do Resend.

**Só em desenvolvimento:** com o envio real desligado, a lista de espera mostra o link de confirmação no ecrã, para testar o fluxo. Em produção esse link não existe.

**Em produção, sem envio real:** a lista de espera fica fechada e não guarda emails.

### Bloqueio do lançamento: SMTP próprio no Supabase

Registo, confirmação de conta e recuperação de palavra-passe saem pelo Supabase, não por `send.ts`. O serviço por omissão do Supabase só entrega a membros da equipa do projeto, está limitado a 2 mensagens por hora e não serve para produção. **Sem SMTP próprio, ninguém de fora consegue registar-se nem recuperar a palavra-passe.** Fonte: supabase.com/docs/guides/auth/auth-smtp (consultada a 31/10/2026).

**Para ligar:**

1. Comprar um domínio.
2. No Resend, adicionar o domínio e configurar os registos DNS indicados. Esperar pela verificação.
3. No Resend, criar uma chave de API própria para o SMTP.
4. No Supabase, em Authentication, ativar o SMTP próprio com os dados do Resend e um remetente do domínio.
5. No Supabase, rever os limites de envio. Depois de ligar o SMTP, o limite por omissão é de 30 mensagens por hora.
6. Na Vercel e no `.env.local`, colocar `WAITLIST_EMAIL_FROM` com um endereço do domínio, `SITE_URL` com o endereço público e `EMAIL_REAL_SENDING=true`.
7. Rever o limite do plano do Resend em relação ao `DAILY_EMAIL_LIMIT`.

**Verificar antes de abrir:**

- [ ] Registo com um email fora da equipa do projeto: o email de confirmação chega.
- [ ] Recuperação de palavra-passe com o mesmo email.
- [ ] Lista de espera em produção: o email chega, e o link confirma e permite sair.
- [ ] Os emails não caem no spam.
