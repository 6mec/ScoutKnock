# Como trabalhamos (a partir de 04/11/2026)

Documento de rumo. Escrito com o Daniel; manda sobre `docs/plano.md` (que é o plano antigo, para vender packs a outros). Em caso de dúvida, pergunta ao Daniel.

## O que é o ScoutKnock agora
Uma app/site **só do Daniel** (freelancer, Portugal) para encontrar empresas locais, apresentar-lhes o trabalho e, quando aceitam, executar o trabalho. Serve para vender **sites e apps** a empresas de qualquer país. Não se vende a outros utilizadores por agora. A cobrança aos clientes é feita fora da app.

## O fluxo, em 4 pontos
1. **Encontrar empresas.** Radar (OpenStreetMap, Google Places quando houver cartão) e o modo manual ("Procurar à mão", "Adicionar empresa", "Colar lista"). O Google Places continua desligado até o Daniel ter o cartão: nada depende dele para funcionar.
2. **Apresentar o trabalho.** Contactos (CRM), mensagem de WhatsApp ou email, guião de chamada, diagnóstico em PDF, proposta e portfólio público (`/p/nome`). O Daniel envia tudo à mão, um a um.
3. **Quando o cliente aceita.** O Daniel entra na app e usa "Pedir trabalho" na ficha do contacto para registar o que é preciso fazer. O pedido chega ao Claude Code (comando `/pedidos`), que lê o pedido e prepara o trabalho. Uma app à medida é sempre um projeto à parte, com plano aprovado antes de escrever código.
4. **A app tem de ser totalmente profissional**, com ferramentas à altura do dia a dia com clientes: agenda de retornos, histórico, propostas, estados dos projetos, entregas e manutenção.

## O que muda no código
- **Acaba o construtor de demos como caminho principal.** Trabalho para clientes é definitivo, em projeto próprio. As demos antigas ficam como estão, sem novas funcionalidades.
- **Cada cliente com projeto separado**, copiado de um site-base reutilizável (por fazer). Domínio e alojamento ficam em nome do cliente.
- **Portfólio** passa a ser o principal argumento de venda: só trabalhos reais.
- **Ecrã de projetos por cliente** (feito, `/painel/projetos`): estado (pedido, em curso, entregue, em manutenção, terminado), valor de criação, custos de terceiros e manutenção mensal opcional, com datas, notas e histórico. Um pedido passa a projeto com "Passar a projeto".

## Modelo de cobrança (decisão do Daniel)
Três valores separados: criação (uma vez), custos de terceiros (pagos pelo cliente diretamente) e manutenção mensal (opcional). A app regista valores que o Daniel escreve; **não cobra, não emite faturas, não calcula impostos**.

## Regras que não mudam
- Mensagens sempre manuais e uma a uma. Nenhum envio automático em massa. "Automatizado" quer dizer que o pedido passa da app para o Claude Code sem copiar e colar, não que o Claude Code contacte clientes.
- Nenhum scraping do Google Maps, Instagram ou de outras apps. Do Google guardar só o `place_id` e o que o Daniel escreve. OpenStreetMap com atribuição.
- Chaves só em `.env.local`. Nunca em código, nem em respostas.
- Inspiração noutros produtos: estudar a funcionalidade e reescrever. Nunca copiar código, textos, imagens ou marca, nem números, vendas ou notificações inventadas.
- Sem gastar dinheiro nem tratar de jurídico ou fiscal sem o Daniel dizer. Antes de cobrar o primeiro cliente, o Daniel trata do recibo verde e de um acordo escrito simples.
- Dados pessoais dos clientes dos clientes (por exemplo, marcações de um barbeiro) pedem política de privacidade e cuidado com o RGPD: perguntar ao Daniel antes de guardar.

## Como o Claude Code trabalha
1. Lê `CLAUDE.md`, este ficheiro e `docs/tarefas.md`.
2. Uma tarefa de cada vez. Propõe um plano curto e espera aprovação.
3. Prefere tarefas que alteram o produto. Sem relatórios ou análises soltas: gastam os créditos do Daniel.
4. No fim: testes, lint e build; atualiza `docs/tarefas.md` e `docs/pendente.md`; sugere um commit.
5. Decisões de negócio, preços, textos de marketing e jurídico voltam ao Daniel.

## Primeiro caso real
Um barbeiro pediu uma app. Antes de planear: o Daniel recolhe as respostas do cliente (marcações online? lembretes? pagamento? vários barbeiros? domínio e identidade visual) e decidimos entre web app instalável (PWA, recomendada para começar) e app nativa.

## Por decidir
- Preços e conteúdo da manutenção mensal.
- Línguas: a interface está em português; mensagens e sites noutras línguas ficam para quando o Daniel decidir.
