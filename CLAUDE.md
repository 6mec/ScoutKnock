# ScoutKnock

Ferramenta pessoal do Daniel (Portugal), freelancer, para encontrar empresas locais em qualquer país que precisem de um site ou de uma app, abordá-las, gerir os contactos e entregar o trabalho. Não se vende a outros utilizadores por agora (decisão de 04/11/2026): sem `SIGNUPS_ENABLED=true` ninguém cria conta. A página de venda, os packs e o Stripe ficam no código, desligados, para mais tarde.

Fluxo: serviço + nicho + localidade → empresas reais com nota de oportunidade → mensagem ou guião de chamada → site demo → contactos (CRM) → site oficial publicado pelo Daniel. A cobrança ao cliente é feita por fora da app.

Dono do projeto: Daniel. Responde-lhe em português de Portugal. Plano antigo (versão para vender packs) em @docs/plano.md: serve de histórico, não manda.

## Stack

- Next.js (App Router) + TypeScript + Tailwind, na Vercel
- Supabase: Postgres + autenticação
- Fontes de empresas: modo manual, OpenStreetMap (Overpass, `COMPANY_SOURCE=osm`) e Google Places (desligado)
- API do Claude para mensagens e textos das demos (desligada sem chave)
- Stripe e Resend: em teste ou desligados

## Comandos

Ver `package.json` (dev, build, test, lint). Antes de sugerir um commit: testes, lint e build.

## Regras fixas

- Nunca escrever chaves ou segredos no código. Usar `.env.local` (fora do Git) e manter `.env.example` atualizado.
- Nada de scraping do Google Maps, Instagram ou de outras apps. Dados só por API oficial, OpenStreetMap (com atribuição, licença ODbL) ou escritos pelo Daniel.
- Do Google guardar só o `place_id` e o que o Daniel escreve.
- Guardar só dados públicos e comerciais das empresas (RGPD e leis de cada país).
- Envio de mensagens é sempre manual e um a um (link wa.me ou email aberto). Nunca envio automático em massa.
- Textos da interface num ficheiro de traduções, não escritos à mão nos componentes. Português de Portugal é a língua base; outras línguas e mercados só quando o Daniel decidir.
- Sites demo têm aviso "proposta não oficial" até serem publicados como oficiais, e são apagados ao fim de 30 dias se não forem aceites.
- Nenhuma funcionalidade é anunciada como disponível sem estar a funcionar.
- Inspiração noutros produtos: estudar a funcionalidade e reescrever. Nunca copiar código, textos, imagens, marca nem números inventados (vendas, avaliações, notificações falsas).
- Sem gastar dinheiro nem tratar de assuntos jurídicos ou fiscais até o Daniel dizer.

## Como trabalhar

- Trabalhar pelo ficheiro `docs/tarefas.md`: lê-lo, seguir as regras lá escritas, fazer uma tarefa de cada vez por ordem e, no fim, atualizá-lo.
- Antes de escrever código, propor um plano curto e esperar aprovação.
- Perguntas de negócio (preços, textos de marketing, decisões legais) não se decidem aqui: devolver ao Daniel.
- Não gastar créditos em relatórios ou análises soltas: preferir tarefas que alterem o produto.
