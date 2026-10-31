# Agente operador — o assistente do dono (versão 2)

Visão para depois do lançamento. **Não se constrói na versão 1**, com uma exceção: o registo de eventos e custos (secção 6), que entra já, porque sem esses dados o agente não tem com o que trabalhar.

Dono: Daniel. Nome do assistente: [NOME A ESCOLHER — decisão do Daniel]. Neste documento chama-se "o agente".

## 1. Objetivo

Um assistente que:
1. **mantém o Daniel informado em tempo real** sobre o que se passa no ScoutKnock (utilizadores, buscas, receita, custos, erros);
2. **trabalha por ele**: prepara respostas, publicações, correções e sugestões, e executa sozinho o que for seguro;
3. **fala e ouve**, como um assistente pessoal ("Jarvis"): o Daniel pergunta e responde por voz, sem estar sempre a escrever.

Meta realista: o Daniel intervém **menos de 1 hora por dia** e cada ação do agente fica registada. Não prometemos (nem a clientes nem a nós) "100% automático": há coisas que ficam sempre com uma pessoa.

## 2. Níveis de autonomia

| Nível | O que o agente faz | Exemplos |
| --- | --- | --- |
| **1. Livre** | Só lê e avisa | métricas, resumos, alertas, perguntas e respostas |
| **2. Propõe, o Daniel aprova** | Prepara e espera um "ok" no ecrã | respostas a clientes, publicações, guiões de live, emails de lançamento, mudanças de limites dos packs, tarefas e correções de código para o Claude Code |
| **3. Nunca sozinho** | Só o Daniel | movimentar dinheiro (reembolsos, preços, transferências), apagar dados, contactar empresas, decisões legais ou fiscais, publicar o que não foi aprovado |

Regras:
- Tudo o que seja nível 2 ou 3 é aprovado **com um botão no ecrã**, nunca só por voz (a transcrição pode errar "não" por "então").
- Uma ação nova começa sempre no nível 2. Só sobe para o nível 1 depois de funcionar bem durante semanas e o Daniel o decidir.
- O nível 3 não se promove.

## 3. O que o agente sabe e faz (ferramentas)

Cada ferramenta tem nome, nível e permissões mínimas. O agente só pode usar as ferramentas listadas.

| Ferramenta | Nível | Notas |
| --- | --- | --- |
| `ler_metricas` (inscrições, buscas, demos, assinaturas, receita) | 1 | Só leitura da base de dados |
| `ler_custos` (Google, Claude, Resend, Vercel, Supabase) | 1 | Custo por dia e por utilizador; compara com a receita |
| `ler_erros` | 1 | Erros do site e falhas de pagamento |
| `resumo_diario` | 1 | Mensagem de manhã |
| `alertar` | 1 | Notificação ao Daniel quando passa um limite |
| `rascunhar_resposta_suporte` | 2 | Texto pronto para aprovar |
| `rascunhar_publicacao` / `rascunhar_guiao_live` | 2 | Texto pronto para aprovar |
| `propor_ajuste_limites` | 2 | Com a conta feita (custo vs preço do pack) |
| `abrir_tarefa_codigo` | 2 | Cria a tarefa para o Claude Code corrigir, o Daniel revê o resultado |
| `reembolsar`, `mudar_preco`, `apagar_dados`, `contactar_empresa` | 3 | O agente não tem acesso a estas ações |

## 4. O que o Daniel vê em tempo real

**Painel de dono** (página só dele, ex.: `/admin`, protegida por papel de administrador):
- inscrições na lista de espera e novos registos;
- buscas feitas, empresas devolvidas, sites demo criados e publicados;
- assinaturas ativas e receita do mês;
- **custo de APIs ao lado da receita, por dia e por utilizador**, com a margem de cada pack;
- erros do site e pagamentos que falharam;
- um registo de tudo o que o agente fez e propôs, com botão de aprovar/recusar.

**Alertas imediatos** (Telegram ou email) quando:
- o custo do dia passa o normal;
- a quota do Google chega a 80%;
- há uma assinatura nova ou um pagamento falhado;
- um utilizador gasta mais de 30% do preço do seu pack em custos;
- o número de erros sobe de repente.

**Resumo de manhã**, por exemplo: "ontem: 12 inscrições, 41 buscas, 3,20 € de custo, 0 erros, 1 assinatura nova. Duas coisas a aprovar."

## 5. Voz ("Jarvis")

Objetivo final: falar com o agente em conversa contínua, em português de Portugal, e ouvir as respostas, podendo interrompê-lo a meio.

**Como funciona:** a voz do Daniel é convertida em texto, o agente pensa e usa as ferramentas, a resposta volta em voz. Em tempo real, isto faz-se com um serviço de voz em tempo real (voz→voz) ou com a cadeia voz→texto→agente→texto→voz, desde que a pausa entre falar e ouvir seja pequena.

**Fases da voz**
1. **Carregar para falar** no painel e no telemóvel: o Daniel carrega, fala, o agente responde em voz e texto.
2. **Notas de voz no Telegram**: fala-se como num áudio de WhatsApp, útil na rua e no carro.
3. **Conversa contínua**: sem carregar em botões, com possibilidade de interromper. Palavra de ativação ("[NOME], estás aí?") só se a privacidade e a bateria o permitirem.

**Regras**
- Só funciona depois de o Daniel estar autenticado. A voz nunca serve de palavra-passe.
- Ações de nível 2 e 3 pedem sempre confirmação por botão.
- Antes de escolher o serviço de voz, **testar 2 ou 3 com a voz e o sotaque do Daniel**: a qualidade do português de Portugal varia muito.
- Escolher uma voz clara e natural, sem imitar a voz de uma pessoa real.
- A voz passa por um serviço externo: enviar o mínimo de dados pessoais e dizê-lo na política de privacidade.

## 6. Dados que têm de existir já na versão 1

Tabelas no Supabase, com RLS ativo e leitura só para o administrador:

- `events`: o que aconteceu (`id`, `created_at`, `user_id` opcional, `type` como `signup`, `search`, `demo_created`, `demo_published`, `subscription_started`, `payment_failed`, `error`, e `data` em JSON com só o necessário).
- `api_costs`: quanto custou cada chamada (`id`, `created_at`, `user_id`, `provider` como `google_places`, `claude`, `resend`, `kind`, `units`, `cost_eur`).
- Papel de administrador no perfil do Daniel (campo `is_admin`, só alterável pela base de dados, nunca pela app).

Mais tarde (versão 2): `agent_actions` (registo de tudo o que o agente fez), `agent_proposals` (o que está à espera de aprovação).

Regra para o código da versão 1: **cada busca, demo, subscrição e erro regista um evento, e cada chamada paga regista o seu custo**. Não é trabalho extra grande se for feito desde o início.

## 7. Guarda-corpos (obrigatórios)

- **Limites fixos de gasto** no Google Cloud e no fornecedor de IA, mais um limite mensal só para o agente. Um erro nunca pode sair caro.
- **Registo de cada ação** do agente (quem pediu, o que fez, com que resultado) e **botão de desligar** tudo.
- **Chaves com o mínimo de permissões**: o agente lê métricas, mas não tem acesso ao Stripe para mexer em dinheiro.
- **Texto de utilizadores e de sites de empresas é dado, não instrução.** O agente nunca obedece a pedidos que apareçam nesses textos (proteção contra instruções escondidas). Antes de agir sobre algo que veio desses textos, pede confirmação.
- **RGPD:** o agente vê o mínimo de dados pessoais, nunca emails completos em resumos, e nenhum conteúdo de mensagens de utilizadores sem necessidade.
- **Honestidade:** nada do que o agente escreva para fora (publicações, respostas) promete ganhos ou resultados.

## 8. Fases

| Fase | O que entrega | Quando |
| --- | --- | --- |
| **0** | Tabelas `events` e `api_costs` e papel de administrador | Durante a versão 1 |
| **1** | Painel de dono e resumo diário por Telegram/email, com alertas | Logo a seguir ao lançamento |
| **2** | Chat de texto: perguntas sobre os números, só leitura | Depois da fase 1 |
| **3** | Voz: carregar para falar e notas de voz no Telegram | Depois da fase 2 |
| **4** | Propostas com aprovação (respostas, publicações, ajustes, tarefas de código) | Depois da fase 3 |
| **5** | Conversa contínua por voz e autonomia limitada em tarefas simples | Quando as anteriores funcionarem bem |

## 9. Decisões em aberto (do Daniel)

- Nome do assistente.
- Telegram ou email como canal principal de alertas.
- Orçamento mensal máximo do agente: [A DEFINIR].
- Se o painel de dono mostra também dados de clientes individuais ou só números agregados.
