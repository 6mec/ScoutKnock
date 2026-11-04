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

### T9. Modo manual, sem custos (04/11/2026)
Sem chave do Google, o Radar passa a "Procurar à mão": link oficial de pesquisa do Google Maps (só abre o Maps, não lê nada dele) e "Adicionar empresa". Nos Contactos, "Adicionar empresa" e "Colar lista" (uma por linha, com ou sem cabeçalho, repetidas pelo nome ou telefone ficam de fora). Nas empresas manuais, a ficha edita os dados escritos, a nota calcula-se com eles sem inventar motivos, e a mensagem e o site demo usam-nos sem chamar o Google.
Depende da migração `20261113000000_manual_companies.sql`. Fluxo estudado com o REA (CRM e Encontrar clientes do crieai.app) e validado no código; nada copiado.
Animação da busca (estudada com o REA no `MapSearchAnimation` do crieai.app): o globo roda até à localidade, abre o mapa real da região (Leaflet e OpenStreetMap) e voa até à cidade; as empresas de exemplo caem como pinos na cor da nota e os resultados aparecem quando o último assenta. Limites do mapa em `docs/pendente.md`. Telemóveis WhatsApp sem +351 passam a abrir a conversa certa.
CRM (estudado com o REA no `Crm` do crieai.app; o `Dashboard` deles simula vendas e notificações, e isso ficou de fora): nos Contactos, meta do dia, próxima da fila com "Saltar", retornos de hoje e atrasados, ritmo dos últimos 14 dias e pesquisa também pelo telefone; na ficha, valor da proposta, "Não contactar" e histórico dos estados; no quadro e na tabela, o valor; no painel, o bloco "Negócios" só com valores escritos pelo freelancer. Depende da migração `20261114000000_crm.sql`.
Aspeto do painel (estudado com o REA e o CSS público do crieai.app, sem copiar marca nem cores): painéis com degradé, reflexo e sombra suaves (`panel`), títulos de bloco com ícone (`PanelHeader`), avisos discretos (`Callout`), números na letra do texto, botões e campos mais finos com a área de toque de 44 px, estados com cor, ficha do contacto em duas colunas no computador. A landing fica com a letra mono (`type-mono`).
Ferramentas do CRM (estudadas com o REA no `Crm`, `ScannerLocal`, `Contratos` e `Financeiro` do crieai.app; contratos e cobranças ficaram de fora por serem jurídicos e envolverem dinheiro): "Chamar no WhatsApp" na fila e na ficha, com a mensagem do freelancer (`{nome}`), que marca "Contactado" e conta para a meta; "Ele respondeu"; filtros rápidos (retorno para hoje, sem resposta há 3 dias, com valor, não contactar); "Exportar folha (CSV)" só com o que o freelancer escreveu; "Criar proposta" para imprimir ou guardar em PDF, sem texto jurídico, que pode guardar o total na ficha. O modelo da mensagem depende da migração `20261115000000_whatsapp_template.sql`.

### T8. Landing com personalidade e correções pequenas
Por esta ordem, parando no fim de cada bloco com capturas antes/depois: (1) simulação interativa, que substitui a secção dos interruptores e mantém os pontos de cada motivo; (2) cartões flutuantes fixos no herói, só no computador e sem temporizador nem animação de entrada/saída, e "Como funciona" com ecrã maior e menos scroll; (3) planos na app e na landing, com limites, "Preço em breve", "abertura de contacto" explicada e só os 5 €/mês do site oficial; (4) propostas 1 a 5 da T5.
Lighthouse mínimo de 95 nos ecrãs alterados (landing, entrada, painel, Contactos e outros mexidos); Demos e Conta reportam-se à parte. Só dados de exemplo; não numerar secções além de "Como funciona"; sem números inventados, urgência nem falsas notificações.

## Próximas (por ordem)

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

- T5. Revisão do aspeto e da experiência (01/11/2026). 22 ecrãs nos 4 modos e 21 propostas, sem alterar código. As escolhidas (1 a 5, 14 a 17) passaram à T8.
  Por escolher: 6 a 13 e 18 a 20. A 21 (numerar secções) ficou recusada.
- T4. Publicar como oficial, em modo de teste (01/11/2026). Sites em `/s/nome` com subscrição própria de 5 €/mês, separada dos packs, confirmação gravada, cabeçalhos de segurança e pedido de remoção.
  Testado só com eventos e um Stripe imitados. O domínio separado ficou como bloqueio no `pendente.md`.
- T3. Mensagens de abordagem (01/11/2026). Instruções da IA e modelos do `docs/mensagens.md`, com serviço e canal, aviso para confirmar observações do site, seguimento único 3 dias depois do último contacto e `/bot` a ler o contacto da configuração.
  Por avaliar com chave real: a qualidade das mensagens da IA. Política de privacidade e perguntas para o jurista atualizadas quanto ao que vai para a Anthropic.
- T2. Navegação e contraste do login (01/11/2026). A navegação já estava certa e foi só confirmada. As páginas de autenticação deixam de desvanecer ao entrar, e as etiquetas de todos os formulários passam a 14 px, peso 500, na cor do texto (15,08 no escuro e 19,22 no claro).
  O aviso "1 Issue" do Next, visto numa captura em desenvolvimento, não se reproduziu em 36 aberturas sem erros na consola; causa por confirmar.
- T1. Lançamento só em Portugal (01/11/2026). Interruptor `MARKETS_ENABLED`, Radar com os 18 distritos, as 2 regiões e os 308 concelhos, preços só em euros, landing sem Brasil.
  Empresas de exemplo também em Braga e Coimbra; por isso a nota diz "só há empresas no Porto, em Lisboa, em Braga e em Coimbra".
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
