# Política de cancelamento e reembolso — RASCUNHO EM REVISÃO

**Não publicar sem validação de um jurista.** Campos entre [PARÊNTESIS] são decisões do Daniel ou do jurista. O que está em "Decisões" tem de ser escolhido antes de escrever o texto final.

## Decisões do Daniel

1. **Reembolso depois da primeira cobrança.** Opções:
   - A. Sem reembolso do mês já pago. Cancelas quando quiseres e usas o serviço até ao fim do período.
   - B. Reembolso total nos primeiros [7] dias após a primeira cobrança, se o consumo for baixo (por exemplo, menos de [10] buscas e [2] demos).
   - C. Reembolso total nos primeiros [7] dias, sem condições (maior risco de abuso e de custo de API).
   Recomendação provisória: **B**, porque protege o cliente e o teu custo de API.
2. **Reembolsos são sempre aprovados por ti** (nível 3 do agente: o Alfred nunca reembolsa sozinho).
3. **Falhas do nosso lado** (cobrança duplicada, erro técnico que impediu o uso): reembolso do período afetado. [CONFIRMAR]

## Texto provisório (para o site, depois de validado)

**Teste grátis.** O teste dura 7 dias e não pede cartão. Se não subscreveres, termina sozinho e o limite passa ao mais baixo.

**Cancelar.** Podes cancelar a qualquer momento no portal do cliente. O cancelamento produz efeito no fim do período já pago, e até lá manténs o acesso. Não há fidelização.

**Reembolsos.** [TEXTO CONFORME A DECISÃO 1.] Para pedir um reembolso, escreve para [EMAIL] indicando o email da conta. Respondemos em [PRAZO]. Quando aprovado, o reembolso é feito pelo mesmo meio de pagamento, e pode demorar alguns dias a aparecer.

**Cobrança duplicada ou errada.** Corrigimos e reembolsamos o valor indevido.

**Sites oficiais (5 €/mês por site).** Cancelas o site quando quiseres. Ao cancelar, o site deixa de estar online no fim do período pago. [CONFIRMAR O QUE ACONTECE AOS DADOS E AO ENDEREÇO.]

**Alterações de preço.** Avisamos com [30] dias de antecedência por email antes de qualquer alteração.

## Para o jurista

- Os subscritores são freelancers e pequenas agências. São "consumidores" ou "profissionais"? Isso muda o direito de livre resolução (14 dias nos contratos à distância com consumidores, com regras próprias para serviços digitais que começam durante esse prazo).
- A renúncia ao direito de livre resolução, se aplicável: como se obtém o consentimento expresso no momento da subscrição?
- Reembolso proporcional vs. total, e o que dizer sobre IVA.
- Informação obrigatória sobre preço, renovação automática e cancelamento antes da compra.

## Para o Claude Code (depois de decidido)

- Mostrar a política no ecrã de Planos, antes de pagar, e ligá-la ao Checkout.
- Registar o aceite dos termos e da política no momento da subscrição (data e versão).
- Ecrã ou ligação clara de "Cancelar" no painel (o portal do cliente do Stripe já cobre isto).
