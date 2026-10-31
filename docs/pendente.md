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
