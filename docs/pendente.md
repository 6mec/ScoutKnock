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

## Países

**Estado:** lançamento só em Portugal, com `MARKETS_ENABLED=PT`. Vazio ou inválido fica igual.

**Com o Brasil desligado:** Radar só com os 18 distritos, as 2 regiões e os 308 concelhos; preços e Checkout só em euros; a landing não fala do Brasil. O servidor recusa localidades fora da lista, sem gastar busca.

**Para ligar o Brasil (Daniel decide quando):**

1. Criar os preços em reais no Stripe e preencher os `STRIPE_PRICE_*_BRL`. Sem eles, com o Brasil ligado, os pagamentos ficam desligados.
2. Colocar `MARKETS_ENABLED=PT,BR` e publicar de novo, porque a landing é gerada no build.

**Ainda faltaria para o Brasil:** textos em pt-BR, que não existem, uma lista completa de cidades, porque hoje só há 4, e a revisão dos preços em reais.

## Limites dos packs

**Estado:** provisórios. Rever depois de medir o custo real com a chave do Google e o uso dos primeiros clientes.

Escolhidos para cumprir os 30% do preço em euros no pior caso, com os preços do Google de 30/10/2026, sem a parte grátis e com um dólar a contar como um euro (0,035 € por busca e 0,02 € por abertura de contacto):

| Pack | Buscas | Aberturas por mês (por dia) | Custo máximo | 30% do preço |
| --- | --- | --- | --- | --- |
| Inicial | 100 | 90 (3) | 5,30 € | 5,70 € |
| Pro | 150 | 300 (10) | 11,25 € | 11,70 € |
| Agência | 245 | 750 (25) | 23,58 € | 23,70 € |

O consumo renova no período atual da subscrição do Stripe. No teste grátis, o período é o próprio teste. Sem subscrição, conta o mês de calendário em Lisboa.

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
- [ ] O tom e a qualidade do texto são bons: gerar 20 mensagens e seguir a checklist da secção 4 de `docs/mensagens.md`. As instruções estão em `src/lib/messages/claude-provider.ts` e ainda não foram experimentadas com o modelo.
- [ ] Surge uma linha `message` em `api_costs`, com um custo plausível.

**Seguimento:** usa um modelo fixo com o nome escrito pelo freelancer, sem chamadas ao Google nem à Anthropic. Fica disponível 3 dias depois do último contacto, só uma vez por empresa, e precisa da migração `20261111000000_contact_follow_up.sql`.

**Aviso "Antes de enviar, abre o site":** aparece quando os motivos incluem a verificação do site. Com o Google ligado, a mensagem ainda não recebe os sinais verificados, por isso esse aviso só aparece hoje com os dados de exemplo.

**Por decidir (Daniel):** limite de mensagens por pack. Até lá vale o travão provisório de 20 por dia.

**Ainda não feito:** mensagens em português do Brasil e em inglês, que entram com as traduções; motivos próprios por serviço, quando houver mais serviços; guardar o serviço no contacto, que hoje usa o único que existe.

## Google Places

**Estado:** pendente: precisa de chave e de validação por um jurista.

**Funciona hoje:** o Radar com os dados de exemplo (`sample-companies`), só em desenvolvimento, com empresas fictícias no Porto, em Lisboa, em Braga e em Coimbra. Noutra localidade, o ecrã diz que não há exemplos aí.

**Testado só com respostas simuladas do Google, nunca com a API a sério:** pedido, conversão dos resultados, erros, páginas, travão de custo e registo em `api_costs`.

**O que já foi aplicado:** os Contactos guardam só o `place_id` e o que o freelancer escreve, e os dados do Google são pedidos ao abrir o contacto. Os Sites demo guardam o `place_id` e o que o freelancer escreve. Latitude e longitude não são pedidas nem guardadas.

**Bloqueia a produção: validar com jurista a leitura dos termos do Google (docs/termos-google.md).** Perguntas em aberto:

- Se o CRM, mesmo só com o `place_id`, cai na proibição de listagens e diretórios.
- Se dados escritos e confirmados pelo freelancer chegam para os Sites demo, sobretudo com os dados do Google visíveis ao lado no formulário.
- Se é permitido enviar à Anthropic o nome da empresa, o nicho e os motivos da nota, com o serviço escolhido e o canal da mensagem, para a escrever.
- Como fazer a atribuição quando não se mostra mapa.
- Se podemos visitar automaticamente um endereço de site obtido do Google, mesmo sem guardar o resultado.
- Se, no futuro, poderíamos guardar só um sinal calculado com data. Hoje nada é guardado.
- Se visitar sites de terceiros sem autorização levanta outra questão, além de respeitar o `robots.txt`, e se a página `/bot` chega como informação.

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
- [ ] Os resultados são bons em 5 concelhos. O pedido leva "nicho em localidade, Portugal" e `regionCode: "PT"`, testados só com respostas simuladas.
- [ ] Depois de 10 buscas de teste, comparar o custo estimado com o gasto real no Cloud Console e corrigir os custos configurados:
  - Chamadas por busca: `select data->>'calls', data->>'count' from public.events where type = 'search' order by created_at desc;`
  - Custo por tipo: `select kind, count(*), sum(cost_eur) from public.api_costs where provider = 'google_places' group by kind;`
- [ ] A atribuição cumpre as regras. Os termos pedem o logótipo do Google quando os dados aparecem sem mapa, e hoje só existe o texto "Dados do Google Maps" no Radar, no contacto e no formulário da demo.

**Limitações conhecidas:**

- Abrir um contacto ou gerar uma mensagem faz uma chamada paga de detalhes, que conta para o limite de aberturas do pack. Guardar um contacto e criar uma demo não fazem chamadas. As chamadas de detalhes ficam em `api_costs` por utilizador, mas não entram nas chamadas da busca.
- Os tetos de custo são do projeto inteiro. Os limites dos packs reduzem o risco, mas muitos utilizadores em simultâneo podem esgotar o teto de todos.
- O alerta aos 80% do teto, previsto no guia, não está construído.

## Verificação dos sites

**Estado:** construída e desligada. Precisa da migração `20261110000000_site_checks.sql` e da validação por um jurista (ver "Google Places").

**Funciona hoje:** só com sites simulados nesta máquina. Nunca visitou um site real. Com dados de exemplo não corre, porque as empresas são fictícias. Os endereços de redes sociais, páginas de ligações e reservas já valem como "Sem site próprio" assim que a busca real estiver ligada, sem visita nenhuma.

**O que guarda:** nada dos sites. `events` fica com contagens (`site_checks`) e `api_costs` com o número de verificações, a custo 0, sem endereços. Abrir o mesmo contacto volta a verificar.

**Para ligar:**

1. Publicar o site, para `/bot` ser público, e colocar `SITE_URL` com o endereço público.
2. Definir `SITE_CHECKS_ENABLED=true`, `SITE_CHECKS_DAILY_LIMIT`, `BOT_CONTACT_NAME` e `BOT_CONTACT_EMAIL`, e publicar de novo, porque a página `/bot` é gerada no build.
3. Quando alguém pedir exclusão por email, juntar o domínio a `SITE_CHECKS_EXCLUDED_HOSTS`.

**Confirmar antes de produção:**

- [ ] Tempo máximo na Vercel. Documentação de 24/08/2026: com Fluid compute, 300 s por omissão e no máximo no plano Hobby, incluindo respostas em streaming. A busca mais os 25 s de verificação cabem nisso. Confirmar no projeto real que o Fluid compute está ativo.
- [ ] Região das funções. A Vercel usa `iad1` (Estados Unidos) por omissão, o que torna sites portugueses e brasileiros mais lentos na medição. Escolher a região antes de confiar em "Site lento".

**Rever na primeira utilização:**

- [ ] Amostra de 20 sites reais, para confirmar se os motivos são justos, sobretudo "Site lento" e "Sem versão para telemóvel".
- [ ] A lista de terceiros e os sinais de domínio estacionado, em `src/lib/radar/site-rules.ts`.

**Limitações conhecidas:**

- O limite de 1 visita por site a cada 60 s fica na memória de cada instância do servidor. Com várias instâncias em simultâneo, o mesmo site pode receber mais de uma visita.
- Dentro desse minuto, o segundo pedido mostra "Não foi possível verificar", por isso repetir a mesma busca logo a seguir fica sem sinais.
- A geração de mensagens não usa os sinais verificados, só os motivos que não precisam de visita, incluindo "Sem site próprio".
- Lê só o HTML inicial: em sites montados por JavaScript, os sinais podem ficar por concluir, e nesse caso não dão pontos.

**Por decidir (Daniel):** texto da página `/bot`, e o nome e o email a mostrar nela.

## Pagamentos (Stripe)

**Estado:** só modo de teste. O modo real não está ligado, e uma chave `sk_live_`, `rk_live_` ou `pk_live_` desliga os pagamentos.

**Funciona hoje:** os limites de buscas e demos por pack, que dependem da migração `20261105000000_billing.sql`. Sem chaves, o ecrã de Planos não mostra preços nem botões de compra.

**Testado sem o Stripe a sério:** configuração, parâmetros do Checkout, assinatura e tratamento dos eventos, com eventos simulados.

**Para ligar o modo de teste (grátis):**

1. Criar uma conta em dashboard.stripe.com e confirmar que está em modo de teste.
2. Criar três produtos (Inicial, Pro e Agência), cada um com um preço mensal em EUR, com os valores do `docs/plano.md`.
3. Em Definições de faturação, ativar o portal do cliente e permitir cancelar, mudar de pack e atualizar o pagamento.
4. Instalar o Stripe CLI e correr `stripe login`. Depois, `stripe listen --forward-to localhost:3000/api/stripe/webhook --events customer.subscription.created,customer.subscription.updated,customer.subscription.deleted` mostra o `whsec_...`.
5. Preencher no `.env.local` as variáveis `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, as três `STRIPE_PRICE_*_EUR` e `SITE_URL`.
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
