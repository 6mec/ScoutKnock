# Tarefas do ScoutKnock

Fonte de verdade da fila de trabalho. Quem escreve as tarefas: o Daniel e o assistente de planeamento (o Claude do chat). Quem as executa: o Claude Code.

## Como trabalhar (Claude Code)

1. Pega na **primeira tarefa "Em curso" ou, se não houver, na primeira "Próximas"**, por ordem.
2. Propõe um plano curto e **espera a aprovação do Daniel** antes de escrever código.
3. Faz só essa tarefa. Corre testes, lint e build. Mostra capturas se mexeu em ecrãs.
4. No fim, **atualiza este ficheiro**: passa a tarefa para "Feitas" com a data e duas linhas do que mudou, e atualiza `docs/pendente.md`.
5. Não começas a tarefa seguinte sem o Daniel dizer.
6. Regras de todas as tarefas: nada que custe dinheiro nem chaves reais; nada jurídico ou fiscal (os textos legais ficam provisórios); nada de Brasil enquanto o interruptor estiver em PT.

## Em curso

### T1. Lançamento só em Portugal
Plano aprovado. Interruptor `MARKETS_ENABLED=PT`, sem Brasil visível, localidades só de Portugal, Stripe só em euros. Ajuste aprovado: em modo de exemplo, quando se procura numa localidade sem empresas de exemplo, mostrar "Em modo de exemplo, só há empresas no Porto e em Lisboa" e acrescentar empresas fictícias em mais concelhos (Braga, Coimbra), marcadas como exemplo.

## Próximas (por ordem)

### T2. Navegação e contraste do login
Cabeçalho da landing: com sessão, "Ir para o painel" (/painel); sem sessão, "Entrar" (/entrar) ao lado do botão da lista de espera. Logótipo da app leva a /painel; menu da conta com "Ver o site". Corrigir o contraste do cartão de login (título e etiquetas), diagnosticar a causa (animação de entrada ou cor), medir antes e depois, em escuro e claro.

### T3. Mensagens de abordagem
Ver `docs/mensagens.md`. Substituir o SYSTEM do `claude-provider.ts` e os modelos de exemplo; passar o serviço do Radar e o canal ao gerador; botão "Gerar seguimento" (uma vez por empresa); a mensagem nunca afirma que existe demo se não existir; a página /bot lê nome e email da configuração.

### T4. Publicar como oficial (modo de teste)
Botão no ecrã da demo, 5 €/mês, Stripe em modo de teste. Sem domínio ainda: servir em caminho (por exemplo /s/nome), com o modelo de subdomínio preparado e desligado. O aviso "proposta não oficial" e a data de apagamento só desaparecem com a subscrição ativa. Cancelamento e falha de pagamento com regras simples e honestas. Só o dono publica e cancela. Testes com eventos simulados. Páginas demo com noindex.

### T5. Revisão crítica do aspeto e da experiência (só proposta)
Percorrer todos os ecrãs. Para cada um, até 3 melhorias concretas por impacto, com capturas do atual: o que parece genérico, o que não tem personalidade, onde falta feedback (carregamento, vazio, erro, sucesso), onde o texto não ajuda. Manter cores atuais, escuro por defeito, acessibilidade e honestidade. **Não implementar sem o Daniel escolher.**

### T6. Experiência ponta a ponta com dados de exemplo
Como utilizador novo: entrar, primeira busca, abrir empresa, gerar mensagem, criar demo, guardar contacto, ver o painel. Listar o que falha, confunde ou parece inacabado e corrigir o que for pequeno depois de aprovado o plano.

### T7. Verificações técnicas de conformidade (sem jurídico)
Lista de licenças das dependências e fontes em `docs/licencas.md`; confirmar que o site de produção não carrega scripts ou fontes de terceiros; listar cookies e armazenamento local com a finalidade; textos alternativos, rótulos, ordem de foco e títulos.

## Em pausa (envolvem decisões legais, fiscais ou dinheiro)

- Apagamento automático de eventos e alerta aos 80% do teto de custo (depende do prazo de conservação e do jurista).
- Política de reembolso no ecrã de Planos (depende da decisão do Daniel e do jurista).
- Registo da data e versão dos termos aceites (depende dos textos finais).
- Ligar chaves reais (Google, Anthropic, Stripe), domínio e SMTP.
- Verificação dos sites ligada em produção.
- Brasil e inglês.

## Feitas

- Painel do utilizador (6 blocos em /painel).
- Verificação dos sites com proteção SSRF, desligada por omissão.
- Google Places, Stripe em teste, emails e travões de custo, tudo desligado ou simulado.
- Contactos e demos guardam só o `place_id` e o que o freelancer escreve.
- Rever, a pedido do Daniel: ficheiros em `docs/`.

## Decisões já tomadas

- Lançamento só em Portugal. Brasil e outros países depois.
- Os dados do Google não se guardam: só o `place_id` e o que o freelancer escreve.
- Limites dos packs provisórios, para cumprir 30% do preço no pior caso. Rever com custos reais.
- O consumo renova no período da subscrição do Stripe, não a 1 de cada mês.
- Depois do teste, o limite desce ao mais baixo. Teste de 7 dias sem cartão.
- Sem pagar serviços nem tratar do jurídico/fiscal até o Daniel dizer que o site lhe agrada a 100%.
